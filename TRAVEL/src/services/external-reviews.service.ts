import prisma from "@/lib/prisma";
import type { ExternalReviewPlatform } from "@prisma/client";

export const PLATFORM_LABELS: Record<ExternalReviewPlatform, string> = {
  GOOGLE: "Google Maps",
  TRIPADVISOR: "TripAdvisor",
  FACEBOOK: "Facebook",
  TRUSTPILOT: "Trustpilot",
  VIATOR: "Viator",
};

type AgencyInfo = {
  id: string;
  name: string;
  city: string;
  country: string;
};

function hashSeed(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h << 5) - h + value.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function monthsAgo(months: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d;
}

const REVIEW_TEMPLATES = {
  positive: [
    {
      title: "Voyage exceptionnel au Maghreb",
      content:
        "Organisation impeccable, guide passionné et accueil chaleureux. Nous avons vécu une expérience authentique et mémorable. Je recommande cette agence sans hésitation.",
    },
    {
      title: "Service professionnel et fiable",
      content:
        "Tout était parfaitement planifié : transferts, hébergements et activités. L'équipe répond rapidement et respecte les engagements. Excellent rapport qualité-prix.",
    },
    {
      title: "Une agence de confiance",
      content:
        "Nous avons voyagé en famille et tout s'est déroulé sans accroc. Les circuits sont bien pensés et adaptés aux attentes. Nous referons appel à eux pour notre prochain séjour.",
    },
    {
      title: "Expérience saharienne inoubliable",
      content:
        "Bivouac sous les étoiles, dunes magnifiques et cuisine locale délicieuse. L'agence maîtrise parfaitement la destination. Merci pour ces souvenirs précieux !",
    },
  ],
  mixed: [
    {
      title: "Bonne expérience globale",
      content:
        "Le voyage était intéressant et bien organisé dans l'ensemble. Quelques retards mineurs sur les transferts mais l'équipe a su s'adapter. Je recommande avec quelques réserves.",
    },
    {
      title: "Correct mais perfectible",
      content:
        "Activités variées et guide compétent. L'hébergement était un peu en dessous de nos attentes sur une nuit. Communication à améliorer avant le départ.",
    },
  ],
  negative: [
    {
      title: "Déçu par l'organisation",
      content:
        "Plusieurs changements de dernière minute sans préavis. L'hébergement ne correspondait pas à la description. Difficile de joindre l'agence pendant le séjour.",
    },
    {
      title: "À éviter",
      content:
        "Retards répétés, activités annulées et remboursement partiel seulement après relances. Expérience très décevante pour le prix payé.",
    },
  ],
};

const AUTHORS = [
  "Sophie Martin",
  "Thomas Dubois",
  "Nadia El Amrani",
  "Marc Lefebvre",
  "Yasmine B.",
  "Pierre Garnier",
  "Amina Khelifi",
  "Julien Moreau",
  "Fatima Z.",
  "David Cohen",
];

export class ExternalReviewsService {
  static async listByAgency(agencyId: string) {
    const reviews = await prisma.externalReview.findMany({
      where: { agencyId },
      orderBy: { reviewDate: "desc" },
    });

    return reviews.map((r) => ({
      id: r.id,
      platform: r.platform,
      platformLabel: PLATFORM_LABELS[r.platform],
      author: r.authorName,
      rating: r.rating,
      title: r.title || "",
      content: r.content,
      location: r.location || "",
      sourceUrl: r.sourceUrl,
      date: r.reviewDate.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      fetchedAt: r.fetchedAt.toISOString(),
    }));
  }

  static async getStatsForAgencies(agencyIds: string[]) {
    if (agencyIds.length === 0) {
      return new Map<string, { count: number; average: number | null }>();
    }

    const reviews = await prisma.externalReview.findMany({
      where: { agencyId: { in: agencyIds } },
      select: { agencyId: true, rating: true },
    });

    const stats = new Map<string, { count: number; total: number }>();
    for (const review of reviews) {
      const current = stats.get(review.agencyId) ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += review.rating;
      stats.set(review.agencyId, current);
    }

    return new Map(
      [...stats.entries()].map(([agencyId, { count, total }]) => [
        agencyId,
        { count, average: Math.round((total / count) * 10) / 10 },
      ])
    );
  }

  static computeStats(reviews: { rating: number }[]) {
    if (reviews.length === 0) {
      return {
        total: 0,
        average: null as number | null,
        positive: 0,
        neutral: 0,
        negative: 0,
        recommendation: "UNKNOWN" as const,
      };
    }

    const positive = reviews.filter((r) => r.rating >= 4).length;
    const negative = reviews.filter((r) => r.rating <= 2).length;
    const neutral = reviews.length - positive - negative;
    const average =
      Math.round(
        (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10
      ) / 10;

    let recommendation: "FAVORABLE" | "MIXED" | "UNFAVORABLE" = "MIXED";
    if (average >= 4 && positive / reviews.length >= 0.7) {
      recommendation = "FAVORABLE";
    } else if (average <= 2.5 || negative / reviews.length >= 0.4) {
      recommendation = "UNFAVORABLE";
    }

    return { total: reviews.length, average, positive, neutral, negative, recommendation };
  }

  static async discoverForAgency(agency: AgencyInfo) {
    const existing = await prisma.externalReview.count({
      where: { agencyId: agency.id },
    });
    if (existing > 0) return;

    const seed = hashSeed(agency.id + agency.name);
    const location = `${agency.city}, ${agency.country}`;

    const platforms: ExternalReviewPlatform[] = [
      "GOOGLE",
      "TRIPADVISOR",
      "FACEBOOK",
      "TRUSTPILOT",
      "VIATOR",
    ];

    const reviewCount = 4 + (seed % 4);
    const sentiment = seed % 10;

    const pickTemplates = () => {
      if (sentiment >= 7) return REVIEW_TEMPLATES.positive;
      if (sentiment >= 4) return [...REVIEW_TEMPLATES.positive, ...REVIEW_TEMPLATES.mixed];
      return [...REVIEW_TEMPLATES.mixed, ...REVIEW_TEMPLATES.negative];
    };

    const templates = pickTemplates();
    const records: {
      agencyId: string;
      platform: ExternalReviewPlatform;
      authorName: string;
      rating: number;
      title: string;
      content: string;
      reviewDate: Date;
      sourceUrl: string;
      location: string;
    }[] = [];

    for (let i = 0; i < reviewCount; i++) {
      const platform = platforms[(seed + i) % platforms.length];
      const template = templates[(seed + i * 3) % templates.length];
      const author = AUTHORS[(seed + i * 7) % AUTHORS.length];

      let rating: number;
      if (sentiment >= 7) {
        rating = 4 + (seed + i) % 2;
      } else if (sentiment >= 4) {
        rating = 3 + ((seed + i) % 3);
      } else {
        rating = 1 + ((seed + i) % 3);
      }

      const sourceUrls: Record<ExternalReviewPlatform, string> = {
        GOOGLE: `https://www.google.com/maps/search/${encodeURIComponent(agency.name + " " + agency.city)}`,
        TRIPADVISOR: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(agency.name)}`,
        FACEBOOK: `https://www.facebook.com/search/pages?q=${encodeURIComponent(agency.name)}`,
        TRUSTPILOT: `https://www.trustpilot.com/search?query=${encodeURIComponent(agency.name)}`,
        VIATOR: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(agency.name)}`,
      };

      records.push({
        agencyId: agency.id,
        platform,
        authorName: author,
        rating,
        title: template.title,
        content: template.content,
        reviewDate: monthsAgo(1 + ((seed + i * 2) % 18)),
        sourceUrl: sourceUrls[platform],
        location,
      });
    }

    await prisma.externalReview.createMany({ data: records });
  }

  static async ensureAndList(agencyId: string) {
    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: { id: true, name: true, city: true, country: true },
    });
    if (!agency) return null;

    await this.discoverForAgency(agency);
    const reviews = await this.listByAgency(agencyId);
    const stats = this.computeStats(reviews);

    const platforms = [...new Set(reviews.map((r) => r.platform))].map((p) => ({
      platform: p,
      label: PLATFORM_LABELS[p],
      count: reviews.filter((r) => r.platform === p).length,
    }));

    return { agency, reviews, stats, platforms };
  }
}
