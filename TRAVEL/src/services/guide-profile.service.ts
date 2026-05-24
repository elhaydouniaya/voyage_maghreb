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
    const budgetMatch = lower.match(/(\d{3,5})\s*(€|eur|euros?)/);
    if (budgetMatch) budgetMax = Number(budgetMatch[1]);

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
