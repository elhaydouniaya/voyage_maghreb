/**
 * AI Service for MaghrebVoyage
 * Implements Module C of the CDC: Structuration and Matching.
 *
 * LLM priority: Gemini (primary, free tier) → OpenAI (fallback) → heuristic offline
 */

import { getOpenAIClient, isOpenAIConfigured } from "@/lib/openai";
import {
  isOpenAIPaused,
  isOpenAIQuotaOrRateLimitError,
  pauseOpenAI,
} from "@/lib/openai-errors";
import { getGeminiClient, isGeminiConfigured } from "@/lib/gemini";
import { isGeminiPaused, pauseGemini, isGeminiQuotaError } from "@/lib/gemini-errors";
import type { ClientGuideContext } from "@/services/guide-profile.service";

// ─── Intent Engine types ──────────────────────────────────────────────────────

export type IntentType =
  | "travel_plan"
  | "recommendation"
  | "booking_request"
  | "modification_request"
  | "history_query"
  | "smalltalk"
  | "unknown";

export type IntentAction = "ask_user" | "call_backend" | "fetch_history";

export interface SessionContext {
  last_destination?: string | null;
  last_budget?: number | null;
  last_intent?: string | null;
  [key: string]: unknown;
}

export interface IntentResult {
  intent: IntentType;
  destination: string | null;
  budget: number | null;
  dates: string | null;
  people: number | null;
  travel_type: string | null;
  missing_information: string[];
  action: IntentAction;
}

// ─── Intent engine system prompt (sent verbatim to the LLM) ──────────────────

const INTENT_SYSTEM_PROMPT = `You are a senior AI system architect.
Your role is ONLY to transform user messages into structured decisions for a travel platform (MaghrebVoyage).
You are NOT a chatbot. You NEVER respond directly to the user.

STRICT ARCHITECTURE: Next.js → Node.js + Prisma → FastAPI → OpenAI → PostgreSQL + Redis

CORE RULE: Output ONLY valid JSON. No explanations. No natural language. No extra text.

INPUT: user_message (string) + session_context (Redis summary: last_destination, last_budget, last_intent)

YOUR TASK:
1. Detect user intent
2. Extract travel entities
3. Decide system action
4. Use session_context only for continuity
5. Detect history requests

SUPPORTED INTENTS: travel_plan | recommendation | booking_request | modification_request | history_query | smalltalk | unknown

ACTION TYPES:
- ask_user → missing information required
- call_backend → enough data to process travel logic
- fetch_history → user requests past data

HISTORY RULE: If user asks "my history", "last trip", "what did I say", "previous trips" → intent=history_query, action=fetch_history

DECISION RULES:
- If required info is missing → action=ask_user
- If all required info exists → action=call_backend
- If history requested → action=fetch_history

DATA TO EXTRACT: intent, destination, budget (number|null), dates (string|null), people (number|null), travel_type (string|null), missing_information (string[]), action

OUTPUT FORMAT (STRICT JSON ONLY):
{"intent":"","destination":null,"budget":null,"dates":null,"people":null,"travel_type":null,"missing_information":[],"action":""}`;

const GUIDE_SYSTEM_PROMPT = `Tu es le Guide Touristique personnel MaghrebVoyage, réservé aux clients connectés.
Tu accompagnes le voyageur dans la préparation de son voyage au Maghreb (Maroc, Algérie, Tunisie, Mauritanie, Libye).
Réponds en français, avec chaleur et expertise. Mène une vraie conversation : pose des questions pour mieux connaître le client avant de conseiller.
Utilise le profil mémorisé (destinations, style, budget, nombre de voyageurs) pour personnaliser chaque réponse.
Propose 1 à 2 suggestions concrètes (destination, saison, type de circuit) adaptées à ce profil.
Si le client cherche un voyage précis à réserver, oriente-le vers /recherche ou /voyages.
Ne invente pas de prix ou de disponibilités exactes.`;

export interface TravelRequestData {
  destination: string;
  isDateFlexible: boolean;
  startDate?: string;
  endDate?: string;
  duration?: number;
  budgetMax: number;
  tripType: string[];
  tripStyle?: string[];
  numberOfTravelers: number;
  accommodation?: string;
  transportIncluded?: boolean;
  activities?: string[];
  constraints?: string;
}

export interface StructuredDemand {
  summary: string;
  tags: string[];
  complexity: 1 | 2 | 3 | 4 | 5;
  destinationNormalized: string;
  budgetLevel: 'low' | 'medium' | 'high' | 'premium';
  dominantTripType: string;
  targetDuration: number;
  startDate?: Date;
  numberOfSeats: number;
  budgetMax: number;
}

export interface TripScore {
  tripId: string;
  score: number;
  compatibility: number;
  reasons: string[];
}

export class AIService {
  /**
   * C.1 - Structuration de la demande via LLM
   * Normalise les entrées du formulaire pour le matching.
   */
  static structureDemandHeuristic(request: TravelRequestData): StructuredDemand {
    return {
      summary: `Voyage à ${request.destination} pour ${request.numberOfTravelers} personnes. Budget: ${request.budgetMax}€.`,
      tags: [...request.tripType, ...(request.activities || [])].map((t) => t.toLowerCase()),
      complexity: 2,
      destinationNormalized: request.destination
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
      budgetLevel:
        request.budgetMax < 800
          ? "low"
          : request.budgetMax < 1800
            ? "medium"
            : request.budgetMax < 3500
              ? "high"
              : "premium",
      dominantTripType: request.tripType[0] || "AVENTURE",
      targetDuration: request.duration || 7,
      startDate: request.startDate ? new Date(request.startDate) : undefined,
      numberOfSeats: request.numberOfTravelers,
      budgetMax: request.budgetMax,
    };
  }

  static async structureDemand(request: TravelRequestData): Promise<StructuredDemand> {
    const fallback = () => this.structureDemandHeuristic(request);

    if (!isOpenAIConfigured() || isOpenAIPaused()) return fallback();

    const openai = getOpenAIClient();
    if (!openai) return fallback();

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `Tu structures une demande de voyage au Maghreb pour un moteur de matching.
Réponds UNIQUEMENT en JSON avec: summary, tags (string[]), complexity (1-5), destinationNormalized, budgetLevel (low|medium|high|premium), dominantTripType, targetDuration, startDate (ISO ou null), numberOfSeats, budgetMax.`,
          },
          { role: "user", content: JSON.stringify(request) },
        ],
        response_format: { type: "json_object" },
        max_tokens: 400,
        temperature: 0.3,
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) return fallback();

      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const base = fallback();
      const budgetLevel = parsed.budgetLevel;
      const complexity = Number(parsed.complexity);

      return {
        summary: String(parsed.summary || base.summary),
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.map((t) => String(t).toLowerCase())
          : base.tags,
        complexity:
          complexity >= 1 && complexity <= 5
            ? (complexity as 1 | 2 | 3 | 4 | 5)
            : base.complexity,
        destinationNormalized: String(
          parsed.destinationNormalized || base.destinationNormalized
        ),
        budgetLevel:
          budgetLevel === "low" ||
          budgetLevel === "medium" ||
          budgetLevel === "high" ||
          budgetLevel === "premium"
            ? budgetLevel
            : base.budgetLevel,
        dominantTripType: String(parsed.dominantTripType || base.dominantTripType),
        targetDuration: Number(parsed.targetDuration) || base.targetDuration,
        startDate: parsed.startDate
          ? new Date(String(parsed.startDate))
          : base.startDate,
        numberOfSeats: Number(parsed.numberOfSeats) || base.numberOfSeats,
        budgetMax: Number(parsed.budgetMax) || base.budgetMax,
      };
    } catch (error) {
      if (isOpenAIQuotaOrRateLimitError(error)) {
        pauseOpenAI(60);
        console.warn("OpenAI structureDemand quota — mode local");
      } else {
        console.error("OpenAI structureDemand error:", error);
      }
      return fallback();
    }
  }

  /**
   * C.2 - Algorithme de Matching (Phase 1, 2, 3)
   * Score sur 18 points selon le CDC MaghrebVoyage vFinal.
   */
  static async matchTrips(demand: StructuredDemand, trips: any[]): Promise<TripScore[]> {
    const scoredTrips = trips.map(trip => {
      let score = 0;
      const reasons: string[] = [];

      // --- PHASE 1: Filtres durs (Éliminatoires) ---
      if (trip.status !== "PUBLISHED") return null;
      if (trip.bookedSpots >= trip.totalSpots) return null;
      
      const tripStartDate = new Date(trip.startDate);
      const now = new Date();
      if (tripStartDate <= now) return null;

      // --- PHASE 2: Score de pertinence (Max 18 pts) ---
      
      // 1. Destination (+4)
      const tripDest = trip.destination.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (tripDest.includes(demand.destinationNormalized) || demand.destinationNormalized.includes(tripDest)) {
        score += 4;
        reasons.push("Destination correspondante");
      }

      // 2. Dates compatibles (+3 + 1 bonus)
      if (demand.startDate) {
        const diffTime = Math.abs(tripStartDate.getTime() - demand.startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 14) {
          score += 3;
          reasons.push("Dates proches de vos souhaits");
          if (diffDays <= 7) {
             // Logic says +3 base. We can add +1 if really close or if client is flexible as per CDC
             score += 1; 
          }
        }
      } else {
        // If no date provided, we give a base score for future trips
        score += 2;
      }

      // 3. Budget compatible (+3 + 1 bonus)
      const tripPrice = Number(trip.totalPrice);
      if (tripPrice <= demand.budgetMax) {
        score += 3;
        reasons.push("Respecte votre budget");
        if (tripPrice <= demand.budgetMax * 0.8) {
          score += 1; // Bonus +1 if well under budget
          reasons.push("Excellent rapport qualité/prix");
        }
      }

      // 4. Type de voyage (+2)
      if (trip.tripType === demand.dominantTripType) {
        score += 2;
        reasons.push(`${trip.tripType} : Votre style favori`);
      }

      // 5. Tags en commun (+1/tag, Max +4)
      const tripTags = trip.aiTags || [];
      const commonTags = tripTags.filter((t: string) => demand.tags.includes(t.toLowerCase()));
      const tagPoints = Math.min(commonTags.length, 4);
      score += tagPoints;
      if (tagPoints > 0) reasons.push("Correspond à vos centres d'intérêt");

      // 6. Places suffisantes (+1)
      if (trip.totalSpots - trip.bookedSpots >= demand.numberOfSeats) {
        score += 1;
      }

      // Final Compatibility %
      const maxScore = 18;
      const compatibility = Math.min(Math.round((score / maxScore) * 100), 100);

      return {
        tripId: trip.id,
        score,
        compatibility,
        reasons: Array.from(new Set(reasons)) // Unique reasons
      };
    }).filter(Boolean) as TripScore[];

    // --- PHASE 3: Tri et Sélection ---
    let results = scoredTrips
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        // Priority to closest start date on equal score
        const tripA = trips.find(t => t.id === a.tripId);
        const tripB = trips.find(t => t.id === b.tripId);
        return new Date(tripA.startDate).getTime() - new Date(tripB.startDate).getTime();
      })
      .slice(0, 3);

    // C.2.Fallback : Si 0 résultat -> Afficher les 3 prochains départs
    if (results.length === 0) {
      const nextTrips = trips
        .filter(t => t.status === "PUBLISHED" && new Date(t.startDate) > new Date())
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 3)
        .map(t => ({
          tripId: t.id,
          score: 0,
          compatibility: 0,
          reasons: ["Prochain départ disponible"]
        }));
      results = nextTrips;
    }

    return results;
  }

  static formatContextBlock(ctx: ClientGuideContext): string {
    const lines: string[] = [];
    if (ctx.profile.preferredDestinations.length) {
      lines.push(`Destinations d'intérêt : ${ctx.profile.preferredDestinations.join(", ")}`);
    }
    if (ctx.profile.travelStyles.length) {
      lines.push(`Styles : ${ctx.profile.travelStyles.join(", ")}`);
    }
    if (ctx.profile.budgetMax) lines.push(`Budget indicatif : ${ctx.profile.budgetMax}€`);
    if (ctx.profile.travelersCount) {
      lines.push(`Voyageurs : ${ctx.profile.travelersCount}`);
    }
    if (ctx.profile.preferredSeason) {
      lines.push(`Saison préférée : ${ctx.profile.preferredSeason}`);
    }
    if (ctx.recentBookings.length) {
      lines.push(
        `Réservations : ${ctx.recentBookings.map((b) => `${b.title} (${b.destination})`).join("; ")}`
      );
    }
    if (ctx.favoriteDestinations.length) {
      lines.push(`Favoris : ${ctx.favoriteDestinations.join(", ")}`);
    }
    if (ctx.pastAiDestinations.length) {
      lines.push(`Recherches passées : ${ctx.pastAiDestinations.join(", ")}`);
    }
    return lines.length ? lines.join("\n") : "Profil en cours de découverte.";
  }

  /**
   * Guide conversationnel local (sans OpenAI) — personnalisé au profil client.
   */
  static guideChatOffline(
    messages: { role: "user" | "assistant"; content: string }[],
    ctx: ClientGuideContext
  ): string {
    const last = messages[messages.length - 1]?.content?.toLowerCase() || "";
    const greeting = ctx.userName?.split(" ")[0] || "voyageur";
    const p = ctx.profile;
    const primaryDest = p.preferredDestinations[0];

    if (
      /^(salam|bonjour|hello|coucou|hey|bonsoir)/.test(last.trim()) ||
      last.includes("bonjour")
    ) {
      if (p.preferredDestinations.length === 0) {
        return `Salam ${greeting} ! Ravi de vous accompagner. Pour commencer : vers quelle destination du Maghreb souhaitez-vous partir ? (Maroc, Algérie, Tunisie, Sahara…)`;
      }
      return `Salam ${greeting} ! Content de vous revoir. Vous aviez mentionné ${p.preferredDestinations.join(" et ")}. Qu’est-ce qui vous intéresse aujourd’hui : dates, budget, ou idées d’activités ?`;
    }

    if (!p.preferredDestinations.length && !this.extractDestinationsFromText(last).length) {
      return `Pour vous conseiller au mieux, dites-moi d’abord quelle région vous attire : le Maroc (Marrakech, désert), l’Algérie (Sud, oasis), la Tunisie, ou un mix ?`;
    }

    if (p.preferredDestinations.length > 0 && p.travelStyles.length === 0) {
      if (!/(aventure|culture|famille|détente|desert|désert|tradition)/.test(last)) {
        return `Parfait pour ${primaryDest || "le Maghreb"} ! Quel style de voyage vous correspond : aventure, culture & médinas, famille, ou détente ?`;
      }
    }

    if (p.preferredDestinations.length > 0 && !p.budgetMax && !/(\d{3,5}|€|budget|prix)/.test(last)) {
      return `Très bien. Pour ${primaryDest}, quel budget par personne envisagez-vous (par ex. 800€, 1200€, 2000€) ? Cela m’aide à cibler les bons circuits.`;
    }

    if (p.preferredDestinations.length > 0 && !p.travelersCount && !/(personnes|voyageurs|couple|famille|\d+)/.test(last)) {
      return `Combien serez-vous à voyager ? (seul, couple, famille…) Je adapterai mes suggestions.`;
    }

    if (last.includes("sahara") || last.includes("désert") || last.includes("desert")) {
      const destLine = primaryDest
        ? `Pour votre projet ${primaryDest}, `
        : "";
      return `${destLine}le Sahara (Merzouga, Taghit, Djanet, Timimoun) est idéal d’octobre à avril — 7 à 10 jours, guide local recommandé. Je vous suggère de comparer les départs sur /voyages ou le configurateur /recherche. Souhaitez-vous plutôt dunes & bivouac ou oasis & culture ?`;
    }

    if (last.includes("budget") || last.includes("prix") || last.includes("€")) {
      const b = p.budgetMax ? `Avec votre budget d’environ ${Math.round(p.budgetMax)}€, ` : "";
      return `${b}comptez 700–1 200€/semaine en groupe standard au Maghreb (hors vols). L’acompte sur MaghrebVoyage sécurise la place. Voulez-vous que je vous oriente vers des circuits ${primaryDest || "adaptés"} ?`;
    }

    if (last.includes("réserver") || last.includes("reserver")) {
      return `Pour réserver : parcourez /voyages, ou lancez /recherche pour un matching personnalisé${primaryDest ? ` vers ${primaryDest}` : ""}. Vos réservations sont dans Profil → Mes réservations.`;
    }

    if (primaryDest && (last.includes("conseil") || last.includes("idée") || last.includes("suggest"))) {
      const style = p.travelStyles[0] || "découverte";
      const season = p.preferredSeason || "printemps ou automne";
      return `Voici 3 pistes pour vous (${primaryDest}, style ${style}) :\n1) Circuit médinas & riads si vous aimez la culture.\n2) Extension désert 3–4 jours depuis Marrakech ou Ouarzazate.\n3) Voyage groupe tout compris — meilleur rapport qualité/prix.\nSaison conseillée : ${season}. Dites-moi si vous préférez l’une de ces options !`;
    }

    const dests = [...new Set([...p.preferredDestinations, ...this.extractDestinationsFromText(last)])];
    if (dests.length > 0) {
      const style = p.travelStyles.join(", ") || "sur mesure";
      const travelers = p.travelersCount ? `${p.travelersCount} voyageur(s)` : "votre groupe";
      return `Merci ! Pour ${dests.join(" / ")}, avec ${travelers} en style ${style}, je recommande de prévoir 7–10 jours. Consultez /voyages pour les départs actuels, ou précisez vos dates pour que j’affine (ex. « en octobre », « 2 semaines »).`;
    }

    return `Je note votre message. Pour affiner : destination, dates approximatives, nombre de voyageurs et budget. Je garde tout en mémoire pour nos prochains échanges !`;
  }

  private static extractDestinationsFromText(text: string): string[] {
    const lower = text.toLowerCase();
    const found: string[] = [];
    const map: Record<string, string> = {
      maroc: "Maroc",
      marrakech: "Marrakech",
      algérie: "Algérie",
      algerie: "Algérie",
      tunisie: "Tunisie",
      sahara: "Sahara",
    };
    for (const [k, v] of Object.entries(map)) {
      if (lower.includes(k) && !found.includes(v)) found.push(v);
    }
    return found;
  }

  // ── Intent extraction engine ────────────────────────────────────────────────

  static extractIntentOffline(
    userMessage: string,
    ctx: SessionContext
  ): IntentResult {
    const msg  = userMessage.toLowerCase().trim();
    const base = this.#blankIntent();

    // History query
    if (/(historique|history|dernier voyage|last trip|j'ai dit|qu'est.ce que j'ai|mes messages|mes conversations)/i.test(msg)) {
      return { ...base, intent: "history_query", action: "fetch_history" };
    }

    // Smalltalk
    if (/^(salam|bonjour|hello|bonsoir|hi|coucou|merci|ok|yes|non|oui|bonne journée|salut)[\s!.?]*$/.test(msg)) {
      return { ...base, intent: "smalltalk", action: "ask_user", missing_information: ["destination"] };
    }

    // Extract destination
    const destMap: Record<string, string> = {
      maroc: "Maroc", marrakech: "Marrakech", fès: "Fès", fez: "Fès",
      casablanca: "Casablanca", algérie: "Algérie", algerie: "Algérie",
      tunisie: "Tunisie", sahara: "Sahara", djerba: "Djerba",
      djanet: "Djanet", tassili: "Tassili", agadir: "Agadir",
      oran: "Oran", alger: "Alger",
    };
    let destination: string | null = null;
    for (const [key, val] of Object.entries(destMap)) {
      if (msg.includes(key)) { destination = val; break; }
    }
    if (!destination && ctx.last_destination) destination = ctx.last_destination;

    // Extract budget
    const budgetMatch = msg.match(/(\d[\d\s]*)(€|eur|euros?|mad|dh|dirham)/i)
      ?? msg.match(/budget[^\d]*(\d[\d\s]*)/i);
    const rawBudget = budgetMatch ? parseInt(budgetMatch[1].replace(/\s/g, ""), 10) : null;
    const budget = rawBudget ?? ctx.last_budget ?? null;

    // Extract people
    const peopleMatch = msg.match(/(\d+)\s*(personne|voyageur|adulte|enfant|pax)/i)
      ?? msg.match(/(couple|seul|solo)/i);
    let people: number | null = null;
    if (peopleMatch) {
      people = peopleMatch[1] ? parseInt(peopleMatch[1], 10) : peopleMatch[0].includes("couple") ? 2 : 1;
    }

    // Extract dates (loose)
    const dateMatch = msg.match(/(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre|jan|fev|mar|avr|jun|jul|aou|sep|oct|nov|dec|\d{1,2}\/\d{1,2}(\/\d{2,4})?)/i);
    const dates: string | null = dateMatch ? dateMatch[0] : null;

    // Extract travel type
    const typeMap: Record<string, string> = {
      aventure: "ADVENTURE", culture: "CULTURE", famille: "FAMILLE",
      luxe: "LUXE", désert: "DESERT", desert: "DESERT",
      détente: "RELAXATION", detente: "RELAXATION", nature: "NATURE",
      religieux: "RELIGIEUX", historique: "HISTORIQUE",
    };
    let travel_type: string | null = null;
    for (const [key, val] of Object.entries(typeMap)) {
      if (msg.includes(key)) { travel_type = val; break; }
    }

    // Determine intent
    let intent: IntentType = "unknown";
    if (/(réserver|reserver|book|je veux partir|je voudrais partir)/i.test(msg)) {
      intent = "booking_request";
    } else if (/(modifier|changer|annuler|repousser|changer la date)/i.test(msg)) {
      intent = "modification_request";
    } else if (/(recommande|conseille|suggestion|idée|que faire|où aller)/i.test(msg)) {
      intent = "recommendation";
    } else if (destination || budget || dates) {
      intent = "travel_plan";
    } else if (ctx.last_intent) {
      intent = (ctx.last_intent as IntentType) ?? "unknown";
    }

    // Determine missing info and action
    const missing: string[] = [];
    if (!destination) missing.push("destination");
    if (!budget)      missing.push("budget");
    if (!people)      missing.push("people");

    const action: IntentAction =
      intent === "history_query"   ? "fetch_history" :
      intent === "booking_request" && destination && budget ? "call_backend" :
      intent === "travel_plan"     && destination           ? "call_backend" :
      "ask_user";

    return { intent, destination, budget, dates, people, travel_type, missing_information: missing, action };
  }

  static #blankIntent(): IntentResult {
    return {
      intent: "unknown",
      destination: null,
      budget: null,
      dates: null,
      people: null,
      travel_type: null,
      missing_information: [],
      action: "ask_user",
    };
  }

  // ── Shared JSON validator for intent results ────────────────────────────────

  static #validateIntentResult(parsed: Partial<IntentResult>): IntentResult {
    const VALID_INTENTS: IntentType[] = [
      "travel_plan", "recommendation", "booking_request",
      "modification_request", "history_query", "smalltalk", "unknown",
    ];
    const VALID_ACTIONS: IntentAction[] = ["ask_user", "call_backend", "fetch_history"];
    return {
      intent:              VALID_INTENTS.includes(parsed.intent as IntentType) ? (parsed.intent as IntentType) : "unknown",
      destination:         typeof parsed.destination === "string"  ? parsed.destination  : null,
      budget:              typeof parsed.budget      === "number"  ? parsed.budget        : null,
      dates:               typeof parsed.dates       === "string"  ? parsed.dates         : null,
      people:              typeof parsed.people      === "number"  ? parsed.people        : null,
      travel_type:         typeof parsed.travel_type === "string"  ? parsed.travel_type   : null,
      missing_information: Array.isArray(parsed.missing_information) ? parsed.missing_information.map(String) : [],
      action:              VALID_ACTIONS.includes(parsed.action as IntentAction) ? (parsed.action as IntentAction) : "ask_user",
    };
  }

  // ── Intent extraction — Gemini primary ──────────────────────────────────────

  static async #intentViaGemini(
    userMessage: string,
    sessionContext: SessionContext
  ): Promise<IntentResult | null> {
    if (!isGeminiConfigured() || isGeminiPaused()) return null;
    const genai = getGeminiClient();
    if (!genai) return null;

    try {
      const model = genai.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        systemInstruction: INTENT_SYSTEM_PROMPT,
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens: 200,
          temperature: 0.1,
        } as object,
      });

      const result = await model.generateContent(
        JSON.stringify({ user_message: userMessage, session_context: sessionContext })
      );
      const raw = result.response.text().trim();
      if (!raw) return null;

      return this.#validateIntentResult(JSON.parse(raw) as Partial<IntentResult>);
    } catch (error) {
      if (isGeminiQuotaError(error)) {
        pauseGemini(60);
        console.warn("Gemini intent quota — fallback to OpenAI");
      } else {
        console.error("Gemini extractIntent error:", error);
      }
      return null;
    }
  }

  // ── Intent extraction — OpenAI fallback ────────────────────────────────────

  static async #intentViaOpenAI(
    userMessage: string,
    sessionContext: SessionContext
  ): Promise<IntentResult | null> {
    if (!isOpenAIConfigured() || isOpenAIPaused()) return null;
    const openai = getOpenAIClient();
    if (!openai) return null;

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: INTENT_SYSTEM_PROMPT },
          {
            role: "user",
            content: JSON.stringify({ user_message: userMessage, session_context: sessionContext }),
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 180,
        temperature: 0.1,
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) return null;

      return this.#validateIntentResult(JSON.parse(raw) as Partial<IntentResult>);
    } catch (error) {
      if (isOpenAIQuotaOrRateLimitError(error)) {
        pauseOpenAI(60);
        console.warn("OpenAI intent quota — mode heuristic");
      } else {
        console.error("OpenAI extractIntent error:", error);
      }
      return null;
    }
  }

  static async extractIntent(
    userMessage: string,
    sessionContext: SessionContext = {}
  ): Promise<IntentResult> {
    // 1. Gemini (free, primary)
    const geminiResult = await this.#intentViaGemini(userMessage, sessionContext);
    if (geminiResult) return geminiResult;

    // 2. OpenAI (paid, fallback)
    const openaiResult = await this.#intentViaOpenAI(userMessage, sessionContext);
    if (openaiResult) return openaiResult;

    // 3. Offline heuristic (always available)
    return this.extractIntentOffline(userMessage, sessionContext);
  }

  // ── Guide chat — Gemini primary ─────────────────────────────────────────────

  static #buildGuideSystem(ctx: ClientGuideContext): string {
    const profile = this.formatContextBlock(ctx);
    const firstName = ctx.userName?.split(" ")[0] ?? "";
    const onboarding = ctx.profile.onboardingComplete
      ? "Profil complet : proposez des suggestions personnalisées et concrètes."
      : "Profil incomplet : posez UNE seule question ciblée (destination, style, budget ou nombre de voyageurs) avant de donner des conseils.";
    return [
      GUIDE_SYSTEM_PROMPT,
      "",
      "Profil mémorisé du client :",
      profile,
      firstName ? `Prénom : ${firstName}.` : "",
      onboarding,
    ].filter(Boolean).join("\n");
  }

  static async #guideChatViaGemini(
    messages: { role: "user" | "assistant"; content: string }[],
    ctx: ClientGuideContext
  ): Promise<string | null> {
    if (!isGeminiConfigured() || isGeminiPaused()) return null;
    const genai = getGeminiClient();
    if (!genai) return null;

    try {
      const model = genai.getGenerativeModel({
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
        systemInstruction: this.#buildGuideSystem(ctx),
        generationConfig: { maxOutputTokens: 700, temperature: 0.75 } as object,
      });

      // Gemini history uses role "user" | "model"
      const history = messages.slice(0, -1).map(m => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }));

      const chat = model.startChat({ history });
      const lastMsg = messages[messages.length - 1].content;
      const result = await chat.sendMessage(lastMsg);
      return result.response.text().trim() || null;
    } catch (error) {
      if (isGeminiQuotaError(error)) {
        pauseGemini(60);
        console.warn("Gemini guideChat quota — fallback to OpenAI");
      } else {
        console.error("Gemini guideChat error:", error);
      }
      return null;
    }
  }

  static async #guideChatViaOpenAI(
    messages: { role: "user" | "assistant"; content: string }[],
    ctx: ClientGuideContext
  ): Promise<string | null> {
    if (!isOpenAIConfigured() || isOpenAIPaused()) return null;
    const openai = getOpenAIClient();
    if (!openai) return null;

    try {
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: this.#buildGuideSystem(ctx) },
          ...messages.slice(-14).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        ],
        max_tokens: 650,
        temperature: 0.75,
      });

      return completion.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
      if (isOpenAIQuotaOrRateLimitError(error)) {
        pauseOpenAI(60);
        console.warn("OpenAI guideChat quota — offline fallback");
      } else {
        console.error("OpenAI guideChat error:", error);
      }
      return null;
    }
  }

  static async guideChat(
    messages: { role: "user" | "assistant"; content: string }[],
    ctx: ClientGuideContext
  ): Promise<{ reply: string; mode: "gemini" | "openai" | "offline" }> {
    // 1. Gemini — free, primary
    const geminiReply = await this.#guideChatViaGemini(messages, ctx);
    if (geminiReply) return { reply: geminiReply, mode: "gemini" };

    // 2. OpenAI — paid, fallback
    const openaiReply = await this.#guideChatViaOpenAI(messages, ctx);
    if (openaiReply) return { reply: openaiReply, mode: "openai" };

    // 3. Offline heuristic — always available
    return { reply: this.guideChatOffline(messages, ctx), mode: "offline" };
  }
}

