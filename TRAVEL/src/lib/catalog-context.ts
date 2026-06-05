import prisma from "@/lib/prisma";

type CatalogTrip = {
  title: string;
  slug: string;
  destination: string;
  tripType: string;
  totalPrice: number;
  startDate: Date;
  description: string;
};

let cache: { at: number; trips: CatalogTrip[] } | null = null;
const CACHE_MS = 5 * 60 * 1000;

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function loadCatalogTrips(): Promise<CatalogTrip[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) {
    return cache.trips;
  }

  const now = new Date();
  const rows = await prisma.groupTrip.findMany({
    where: {
      status: { in: ["PUBLISHED", "FULL"] },
      isPublic: true,
      startDate: { gt: now },
    },
    select: {
      title: true,
      slug: true,
      destination: true,
      tripType: true,
      totalPrice: true,
      startDate: true,
      description: true,
    },
    orderBy: { startDate: "asc" },
    take: 120,
  });

  const trips = rows.map((t) => ({
    title: t.title,
    slug: t.slug,
    destination: t.destination,
    tripType: t.tripType,
    totalPrice: Number(t.totalPrice),
    startDate: t.startDate,
    description: t.description.slice(0, 280),
  }));

  cache = { at: Date.now(), trips };
  return trips;
}

function scoreTrip(
  trip: CatalogTrip,
  terms: string[],
  budgetMax?: number
): number {
  const hay = normalize(
    `${trip.title} ${trip.destination} ${trip.tripType} ${trip.description}`
  );
  let score = 0;

  for (const term of terms) {
    if (term.length < 2) continue;
    if (hay.includes(term)) score += 3;
  }

  if (budgetMax && trip.totalPrice <= budgetMax * 1.15) {
    score += 1;
  }

  return score;
}

export type CatalogContextOptions = {
  query?: string;
  destinations?: string[];
  tripTypes?: string[];
  budgetMax?: number;
  limit?: number;
};

/**
 * Extrait les voyages publiés les plus pertinents pour enrichir le guide IA (RAG léger).
 */
export async function buildCatalogContext(
  options: CatalogContextOptions
): Promise<string> {
  const trips = await loadCatalogTrips();
  if (trips.length === 0) {
    return "Aucun voyage publié actuellement dans le catalogue.";
  }

  const terms = [
    ...(options.query || "").split(/\s+/),
    ...(options.destinations || []),
    ...(options.tripTypes || []),
  ]
    .map((t) => normalize(t.trim()))
    .filter((t) => t.length >= 2);

  const uniqueTerms = [...new Set(terms)];

  const ranked = trips
    .map((t) => ({
      t,
      score: scoreTrip(t, uniqueTerms, options.budgetMax),
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.t.startDate.getTime() - b.t.startDate.getTime();
    });

  const limit = options.limit ?? 5;
  const picked =
    ranked.some((r) => r.score > 0)
      ? ranked.filter((r) => r.score > 0).slice(0, limit)
      : ranked.slice(0, Math.min(3, limit));

  const lines = picked.map(({ t }) => {
    const date = t.startDate.toLocaleDateString("fr-FR", {
      month: "short",
      year: "numeric",
    });
    return `• ${t.title} (${t.destination}, ${t.tripType}) — départ ${date}, à partir de ${Math.round(t.totalPrice)} MAD — /trip/${t.slug}`;
  });

  return `Voyages publiés pertinents (catalogue réel, ne pas inventer d'autres offres) :\n${lines.join("\n")}`;
}
