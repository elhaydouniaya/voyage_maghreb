import prisma from "@/lib/prisma";

export type ClientGuideContext = {
  userName?: string;
  profile: {
    preferredDestinations: string[];
    travelStyles: string[];
    budgetMax: number | null;
    travelersCount: number | null;
    preferredSeason: string | null;
    onboardingComplete: boolean;
    notes: string | null;
    lastSummary?: string | null;
  };
  recentBookings: { title: string; destination: string }[];
  favoriteDestinations: string[];
  pastAiDestinations: string[];
};

const DESTINATION_KEYWORDS: Record<string, string> = {
  maroc: "Maroc",
  marrakech: "Marrakech",
  marrakesh: "Marrakech",
  fes: "Fès",
  fès: "Fès",
  casablanca: "Casablanca",
  sahara: "Sahara",
  merzouga: "Merzouga",
  ouarzazate: "Ouarzazate",
  algérie: "Algérie",
  algerie: "Algérie",
  alger: "Alger",
  djanet: "Djanet",
  taghit: "Taghit",
  timimoun: "Timimoun",
  ghardaïa: "Ghardaïa",
  tunisie: "Tunisie",
  tunis: "Tunis",
  djerba: "Djerba",
  mauritanie: "Mauritanie",
  libye: "Libye",
  atlas: "Atlas",
};

const STYLE_KEYWORDS: Record<string, string> = {
  aventure: "Aventure",
  culture: "Culture",
  culturel: "Culture",
  traditionnel: "Tradition",
  famille: "Famille",
  détente: "Détente",
  detente: "Détente",
  désert: "Désert",
  desert: "Désert",
  randonnée: "Randonnée",
  trekking: "Randonnée",
  gastronomie: "Gastronomie",
  photo: "Photographie",
};

export class GuideProfileService {
  static async getOrCreateProfile(userId: string) {
    return prisma.clientGuideProfile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });
  }

  static async getRecentMessages(userId: string, limit = 24) {
    const rows = await prisma.guideChatMessage.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    return rows.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));
  }

  static async appendMessage(
    userId: string,
    role: "user" | "assistant",
    content: string
  ) {
    await prisma.guideChatMessage.create({
      data: { userId, role, content },
    });

    const count = await prisma.guideChatMessage.count({ where: { userId } });
    if (count > 80) {
      const oldest = await prisma.guideChatMessage.findMany({
        where: { userId },
        orderBy: { createdAt: "asc" },
        take: count - 60,
        select: { id: true },
      });
      if (oldest.length > 0) {
        await prisma.guideChatMessage.deleteMany({
          where: { id: { in: oldest.map((o) => o.id) } },
        });
      }
    }
  }

  static async buildContext(userId: string, userName?: string): Promise<ClientGuideContext> {
    const [profile, bookings, favorites, requests] = await Promise.all([
      this.getOrCreateProfile(userId),
      prisma.booking.findMany({
        where: { userId, status: { in: ["CONFIRMED", "PENDING_PAYMENT"] } },
        take: 5,
        orderBy: { createdAt: "desc" },
        include: { groupTrip: { select: { title: true, destination: true } } },
      }),
      prisma.favorite.findMany({
        where: { userId },
        take: 8,
        include: { groupTrip: { select: { destination: true } } },
      }),
      prisma.travelRequest.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: { destination: true },
      }),
    ]);

    return {
      userName,
      profile: {
        preferredDestinations: profile.preferredDestinations,
        travelStyles: profile.travelStyles,
        budgetMax: profile.budgetMax,
        travelersCount: profile.travelersCount,
        preferredSeason: profile.preferredSeason,
        onboardingComplete: profile.onboardingComplete,
        notes: profile.notes,
        lastSummary: (profile as any).lastSummary ?? null,
      },
      recentBookings: bookings.map((b) => ({
        title: b.groupTrip.title,
        destination: b.groupTrip.destination,
      })),
      favoriteDestinations: [
        ...new Set(favorites.map((f) => f.groupTrip.destination)),
      ],
      pastAiDestinations: requests.map((r) => r.destination),
    };
  }

  static extractFromText(text: string) {
    const lower = text.toLowerCase();
    const destinations: string[] = [];
    const styles: string[] = [];

    for (const [key, label] of Object.entries(DESTINATION_KEYWORDS)) {
      if (lower.includes(key) && !destinations.includes(label)) {
        destinations.push(label);
      }
    }
    for (const [key, label] of Object.entries(STYLE_KEYWORDS)) {
      if (lower.includes(key) && !styles.includes(label)) {
        styles.push(label);
      }
    }

    let budgetMax: number | undefined;
    // Support formats: 1200€, €1200, 2000 MAD, MAD 2000, 3000 DH, DH 3000
    const budgetRegex = /(?:(\d{3,7})\s*(€|eur|euros?|mad|dh|dirham))|(?:(€|eur|euros?|mad|dh|dirham)\s*(\d{3,7}))/i;
    const budgetMatch = lower.match(budgetRegex);
    if (budgetMatch) {
      const num = budgetMatch[1] || budgetMatch[4];
      if (num) budgetMax = Number(num.replace(/\s/g, ""));
    }

    let travelersCount: number | undefined;
    const travelersMatch = lower.match(/(\d+)\s*(personnes?|voyageurs?|adultes?)/);
    if (travelersMatch) travelersCount = Number(travelersMatch[1]);
    if (lower.includes("couple")) travelersCount = 2;
    if (lower.includes("famille")) travelersCount = travelersCount || 4;

    let preferredSeason: string | undefined;
    if (/printemps|mars|avril|mai/.test(lower)) preferredSeason = "Printemps";
    else if (/été|juin|juillet|août|aout/.test(lower)) preferredSeason = "Été";
    else if (/automne|septembre|octobre|novembre/.test(lower)) preferredSeason = "Automne";
    else if (/hiver|décembre|decembre|janvier|février|fevrier/.test(lower))
      preferredSeason = "Hiver";

    return { destinations, styles, budgetMax, travelersCount, preferredSeason };
  }

  static async learnFromConversation(
    userId: string,
    messages: { role: string; content: string }[]
  ) {
    const userTexts = messages
      .filter((m) => m.role === "user")
      .map((m) => m.content)
      .join(" ");

    const extracted = this.extractFromText(userTexts);
    const profile = await this.getOrCreateProfile(userId);

    const destinations = [
      ...new Set([...profile.preferredDestinations, ...extracted.destinations]),
    ];
    const styles = [...new Set([...profile.travelStyles, ...extracted.styles])];

    const onboardingComplete =
      destinations.length > 0 &&
      styles.length > 0 &&
      (extracted.budgetMax != null || profile.budgetMax != null) &&
      (extracted.travelersCount != null || profile.travelersCount != null);

    const summaryParts: string[] = [];
    if (destinations.length) summaryParts.push(`Destinations : ${destinations.join(", ")}`);
    if (styles.length) summaryParts.push(`Style : ${styles.join(", ")}`);
    if (extracted.budgetMax ?? profile.budgetMax) {
      summaryParts.push(`Budget ~${extracted.budgetMax ?? profile.budgetMax}€`);
    }

    await prisma.clientGuideProfile.update({
      where: { userId },
      data: {
        preferredDestinations: destinations,
        travelStyles: styles,
        budgetMax: extracted.budgetMax ?? profile.budgetMax,
        travelersCount: extracted.travelersCount ?? profile.travelersCount,
        preferredSeason: extracted.preferredSeason ?? profile.preferredSeason,
        onboardingComplete,
        lastSummary: summaryParts.join(" · ") || profile.lastSummary,
        notes: userTexts.slice(-500) || profile.notes,
      },
    });
  }

  /**
   * Merge structured entities (from LLM analysis) into the canonical profile.
   * This is deterministic: the backend decides how to apply entity updates.
   */
  static async mergeEntitiesIntoProfile(userId: string, analysisOrEntities: Record<string, any>) {
    // analysisOrEntities can be either the raw entities map or the full analysis object produced by the LLM
    // Normalize input: accept either { analysis: {...} } or { entities: {...} } or a plain entities map
    let analysis: any;
    if (analysisOrEntities && typeof analysisOrEntities === 'object') {
      if ('analysis' in analysisOrEntities) analysis = analysisOrEntities.analysis;
      else if ('entities' in analysisOrEntities) {
        analysis = { conversationAction: analysisOrEntities.conversationAction || analysisOrEntities.action, entities: analysisOrEntities.entities };
      } else {
        analysis = { entities: analysisOrEntities };
      }
    } else {
      analysis = { entities: {} };
    }
    const entities = analysis.entities || {};
    const action = (analysis.conversationAction || analysis.action || '').toString().toUpperCase() || 'UNKNOWN';

    const profile = await this.getOrCreateProfile(userId);
    const updates: any = {};

    if (!entities || typeof entities !== 'object') return;

    // Helper to decide replace vs additive
    const replaceForAction = (fieldsAction: string[]) => fieldsAction.includes(action) || action === 'UPDATE_PROFILE' || action === 'UNKNOWN';

    // DESTINATION
    if (entities.destination) {
      const dest = String(entities.destination);
      if (replaceForAction(['CHANGE_DESTINATION','REMOVE_PREFERENCE','CHANGE_PREFERENCES','CHANGE_DATES','CHANGE_BUDGET','CHANGE_TRAVELERS'])) {
        updates.preferredDestinations = [dest];
      } else {
        const dests = Array.from(new Set([...(profile.preferredDestinations || []), dest]));
        updates.preferredDestinations = dests;
      }
    }

    // BUDGET
    if (entities.budget != null) {
      // budget is a replacement by nature when provided
      updates.budgetMax = Number(entities.budget);
    }

    // TRAVELERS
    if (entities.travelers != null) {
      if (typeof entities.travelers === 'number') updates.travelersCount = Number(entities.travelers);
      else if (Array.isArray(entities.travelers)) {
        const total = entities.travelers.reduce((sum: number, t: any) => sum + (Number(t.count || 1)), 0);
        updates.travelersCount = total;
      }
    }

    // PREFERRED SEASON
    if (entities.preferredSeason) {
      updates.preferredSeason = String(entities.preferredSeason);
    }

    // TRAVEL STYLES - treat as replace on explicit change actions, additive otherwise
    if (entities.travelStyles) {
      const styles = Array.isArray(entities.travelStyles)
        ? entities.travelStyles.map((s: any) => String(s))
        : [String(entities.travelStyles)];

      if (replaceForAction(['CHANGE_PREFERENCES','REMOVE_PREFERENCE','UPDATE_PROFILE'])) {
        updates.travelStyles = Array.from(new Set(styles));
      } else {
        updates.travelStyles = Array.from(new Set([...(profile.travelStyles || []), ...styles]));
      }
    }

    // Handle explicit removals (e.g., user said "no more desert")
    if (entities.removeStyles && Array.isArray(entities.removeStyles)) {
      const toRemove = entities.removeStyles.map((s: any) => String(s));
      const remaining = (profile.travelStyles || []).filter((s: string) => !toRemove.includes(s));
      updates.travelStyles = remaining;
    }

    // Activities or other multi-valued fields should remain additive
    if (entities.activities) {
      const acts = Array.isArray(entities.activities) ? entities.activities.map((a: any) => String(a)) : [String(entities.activities)];
      // just append unique
      const existingActs = (profile as any).activities || [];
      updates['activities'] = Array.from(new Set([...(existingActs || []), ...acts]));
    }

    if (Object.keys(updates).length > 0) {
      await prisma.clientGuideProfile.update({ where: { userId }, data: updates });
    }
  }

  static buildWelcome(ctx: ClientGuideContext): string {
    const firstName = ctx.userName?.split(" ")[0] || "voyageur";
    const dests = ctx.profile.preferredDestinations;

    if (dests.length === 0) {
      return `Salam ${firstName} ! Je suis votre guide personnel MaghrebVoyage. Pour vous proposer des idées sur mesure, commencez par me dire : quelle région du Maghreb vous attire ? (Maroc, Algérie, Tunisie, désert, médinas…)`;
    }

    const style =
      ctx.profile.travelStyles.length > 0
        ? `, style ${ctx.profile.travelStyles.join(" & ")}`
        : "";
    const budget = ctx.profile.budgetMax
      ? `, budget autour de ${Math.round(ctx.profile.budgetMax)}€`
      : "";

    return `Salam ${firstName} ! Je me souviens de vous : vous avez montré de l'intérêt pour ${dests.join(" et ")}${style}${budget}. Comment puis-je vous aider aujourd'hui ? (dates, compagnons, activités, ou idées de circuits)`;
  }

  static buildSuggestions(ctx: ClientGuideContext): string[] {
    const dest = ctx.profile.preferredDestinations[0] || "Maghreb";
    const base = [
      `Me conseiller un circuit ${dest}`,
      "Quelle est la meilleure saison ?",
      "Budget pour une semaine",
    ];
    if (!ctx.profile.onboardingComplete) {
      return [
        "Je rêve du désert",
        "Voyage culture en famille",
        "Maroc ou Algérie ?",
      ];
    }
    if (ctx.recentBookings.length > 0) {
      base.push("Préparer mon prochain départ");
    }
    return base.slice(0, 4);
  }
}
