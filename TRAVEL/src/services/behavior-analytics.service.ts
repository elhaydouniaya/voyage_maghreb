import prisma from "@/lib/prisma";
import { JOURNEY_FUNNEL } from "@/lib/behavior-events";
import type { JourneyStep, Prisma } from "@prisma/client";

type PeriodRange = { start: Date; end: Date; prevStart: Date; prevEnd: Date };

function getPeriodRange(monthsBack = 0): PeriodRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
  const end = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0, 23, 59, 59, 999);
  const prevStart = new Date(start.getFullYear(), start.getMonth() - 1, 1);
  const prevEnd = new Date(start.getFullYear(), start.getMonth(), 0, 23, 59, 59, 999);
  return { start, end, prevStart, prevEnd };
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function eventRoleWhere(roleFilter?: string | null) {
  if (!roleFilter || roleFilter === "ALL") return {};
  return { role: roleFilter };
}

export class BehaviorAnalyticsService {
  static async recordEvent(input: {
    step: JourneyStep;
    path?: string;
    sessionId?: string;
    userId?: string;
    role?: string;
    metadata?: Prisma.InputJsonValue;
    ipHash?: string;
    durationMs?: number;
  }) {
    return prisma.behaviorEvent.create({
      data: {
        step: input.step,
        path: input.path,
        sessionId: input.sessionId,
        userId: input.userId,
        role: input.role,
        metadata: input.metadata ?? undefined,
        ipHash: input.ipHash,
        durationMs: input.durationMs,
      },
    });
  }

  static async getDecisionDashboard(periodOffset = 0, roleFilter?: string | null) {
    const { start, end, prevStart, prevEnd } = getPeriodRange(periodOffset);
    const roleWhere = eventRoleWhere(roleFilter);

    const [
      monthBookings,
      prevBookings,
      monthRevenue,
      prevRevenue,
      monthRequests,
      prevRequests,
      newUsers,
      prevNewUsers,
      monthEvents,
      prevEvents,
      funnelCounts,
      monthlyTrend,
      segmentBreakdown,
      topTrips,
      avgMatchScore,
      uniqueSessions,
      prevUniqueSessions,
    ] = await Promise.all([
      prisma.booking.count({
        where: { status: "CONFIRMED", createdAt: { gte: start, lte: end } },
      }),
      prisma.booking.count({
        where: { status: "CONFIRMED", createdAt: { gte: prevStart, lte: prevEnd } },
      }),
      prisma.booking.aggregate({
        where: { status: "CONFIRMED", createdAt: { gte: start, lte: end } },
        _sum: { depositPaid: true },
      }),
      prisma.booking.aggregate({
        where: { status: "CONFIRMED", createdAt: { gte: prevStart, lte: prevEnd } },
        _sum: { depositPaid: true },
      }),
      prisma.travelRequest.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.travelRequest.count({ where: { createdAt: { gte: prevStart, lte: prevEnd } } }),
      prisma.user.count({ where: { createdAt: { gte: start, lte: end }, role: "CLIENT" } }),
      prisma.user.count({ where: { createdAt: { gte: prevStart, lte: prevEnd }, role: "CLIENT" } }),
      prisma.behaviorEvent.count({
        where: { createdAt: { gte: start, lte: end }, ...roleWhere },
      }),
      prisma.behaviorEvent.count({
        where: { createdAt: { gte: prevStart, lte: prevEnd }, ...roleWhere },
      }),
      this.getFunnelCounts(start, end, roleFilter),
      this.getMonthlyActivityTrend(6, roleFilter),
      this.getSegmentBreakdown(start, end, roleFilter),
      this.getTopTripsByViews(start, end, roleFilter),
      this.getAverageMatchScore(start, end),
      this.countUniqueSessions(start, end, roleFilter),
      this.countUniqueSessions(prevStart, prevEnd, roleFilter),
    ]);

    const revenue = Number(monthRevenue._sum.depositPaid ?? 0);
    const prevRevenueAmount = Number(prevRevenue._sum.depositPaid ?? 0);
    const conversionRate =
      monthRequests > 0 ? Math.round((monthBookings / monthRequests) * 1000) / 10 : 0;
    const prevConversion =
      prevRequests > 0 ? Math.round((prevBookings / prevRequests) * 1000) / 10 : 0;

    const tripsWithSpots = await prisma.groupTrip.findMany({
      where: { status: { in: ["PUBLISHED", "FULL"] } },
      select: { totalSpots: true, bookedSpots: true },
    });
    const fillingRate =
      tripsWithSpots.length > 0
        ? Math.round(
            (tripsWithSpots.reduce(
              (acc, t) => acc + t.bookedSpots / Math.max(t.totalSpots, 1),
              0
            ) /
              tripsWithSpots.length) *
              100
          )
        : 0;

    const platformFees = await prisma.payment.aggregate({
      where: { status: "SUCCEEDED", paidAt: { gte: start, lte: end } },
      _sum: { platformFeeCents: true },
    });
    const grossMargin =
      revenue > 0
        ? Math.round(((Number(platformFees._sum.platformFeeCents ?? 0) / 100) / revenue) * 1000) / 10
        : 0;

    const avgEventsPerSession =
      uniqueSessions > 0 ? Math.round((monthEvents / uniqueSessions) * 10) / 10 : 0;
    const prevAvgEventsPerSession =
      prevUniqueSessions > 0 ? Math.round((prevEvents / prevUniqueSessions) * 10) / 10 : 0;

    const kpis = [
      {
        id: "sessions",
        label: "Sessions actives",
        value: String(uniqueSessions),
        change: pctChange(uniqueSessions, prevUniqueSessions),
        unit: "%",
      },
      {
        id: "events",
        label: "Événements comportementaux",
        value: String(monthEvents),
        change: pctChange(monthEvents, prevEvents),
        unit: "%",
      },
      {
        id: "engagement",
        label: "Év. / session",
        value: String(avgEventsPerSession),
        change: Math.round((avgEventsPerSession - prevAvgEventsPerSession) * 10) / 10,
        unit: "pts",
      },
      {
        id: "conversion",
        label: "Taux de conversion",
        value: `${conversionRate}%`,
        change: Math.round((conversionRate - prevConversion) * 10) / 10,
        unit: "pts",
      },
      {
        id: "bookings",
        label: "Réservations",
        value: String(monthBookings),
        change: pctChange(monthBookings, prevBookings),
        unit: "%",
      },
      {
        id: "revenue",
        label: "CA acomptes",
        value: `${Math.round(revenue)} €`,
        change: pctChange(revenue, prevRevenueAmount),
        unit: "%",
      },
      {
        id: "new_users",
        label: "Nouveaux voyageurs",
        value: String(newUsers),
        change: pctChange(newUsers, prevNewUsers),
        unit: "%",
      },
    ];

    const objectives = [
      {
        metric: "Demandes IA qualifiées",
        actual: monthRequests,
        target: Math.max(prevRequests, 10),
        unit: "",
      },
      {
        metric: "Réservations confirmées",
        actual: monthBookings,
        target: Math.max(prevBookings, 5),
        unit: "",
      },
      {
        metric: "Taux de remplissage voyages",
        actual: fillingRate,
        target: 70,
        unit: "%",
      },
      {
        metric: "Score matching moyen",
        actual: avgMatchScore,
        target: 75,
        unit: "%",
      },
      {
        metric: "Événements comportementaux",
        actual: monthEvents,
        target: Math.max(prevEvents, 50),
        unit: "",
      },
    ].map((o) => {
      const rate = o.target > 0 ? Math.round((o.actual / o.target) * 100) : 0;
      const status =
        rate >= 90 ? "En bonne voie" : rate >= 60 ? "À surveiller" : "À améliorer";
      return { ...o, achievementRate: Math.min(rate, 150), status };
    });

    return {
      period: {
        label: start.toLocaleDateString("fr-FR", { month: "long", year: "numeric" }),
        start: start.toISOString(),
        end: end.toISOString(),
      },
      kpis,
      funnel: funnelCounts,
      monthlyTrend,
      segmentBreakdown,
      topTrips,
      objectives,
      engagement: {
        totalEvents: monthEvents,
        eventsChange: pctChange(monthEvents, prevEvents),
        uniqueSessions,
        avgEventsPerSession,
        revenue,
        revenueChange: pctChange(revenue, prevRevenueAmount),
        grossMargin,
        newUsers,
        newUsersChange: pctChange(newUsers, prevNewUsers),
      },
    };
  }

  private static async getFunnelCounts(
    start: Date,
    end: Date,
    roleFilter?: string | null
  ) {
    const steps = JOURNEY_FUNNEL.map((f) => f.step);
    const groups = await prisma.behaviorEvent.groupBy({
      by: ["step"],
      where: {
        step: { in: steps },
        createdAt: { gte: start, lte: end },
        ...eventRoleWhere(roleFilter),
      },
      _count: { step: true },
    });
    const countMap = new Map(groups.map((g) => [g.step, g._count.step]));

    const dbFallbacks = await Promise.all([
      prisma.travelRequest.count({ where: { createdAt: { gte: start, lte: end } } }),
      prisma.booking.count({ where: { status: "CONFIRMED", createdAt: { gte: start, lte: end } } }),
    ]);

    return JOURNEY_FUNNEL.map((f, i) => {
      let count = countMap.get(f.step) ?? 0;
      if (count === 0) {
        if (f.step === "AI_MATCH_SUBMIT") count = dbFallbacks[0];
        if (f.step === "BOOKING_CONFIRMED") count = dbFallbacks[1];
      }
      const prevStep = i > 0 ? JOURNEY_FUNNEL[i - 1] : null;
      const prevCount = prevStep ? (countMap.get(prevStep.step) ?? count) : count;
      const dropOff = prevCount > 0 ? Math.round((1 - count / prevCount) * 100) : 0;
      return { step: f.step, label: f.label, count, dropOff: i === 0 ? 0 : dropOff };
    });
  }

  private static async getMonthlyActivityTrend(months: number, roleFilter?: string | null) {
    const now = new Date();
    const rows: { label: string; events: number; bookings: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const [events, bookings] = await Promise.all([
        prisma.behaviorEvent.count({
          where: { createdAt: { gte: start, lte: end }, ...eventRoleWhere(roleFilter) },
        }),
        prisma.booking.count({
          where: { status: "CONFIRMED", createdAt: { gte: start, lte: end } },
        }),
      ]);
      rows.push({
        label: start.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
        events,
        bookings,
      });
    }
    return rows;
  }

  private static async getSegmentBreakdown(
    start: Date,
    end: Date,
    roleFilter?: string | null
  ) {
    const byRole = await prisma.behaviorEvent.groupBy({
      by: ["role"],
      where: {
        createdAt: { gte: start, lte: end },
        role: { not: null },
        ...eventRoleWhere(roleFilter),
      },
      _count: { role: true },
    });

    if (byRole.length === 0) {
      const [clients, agencies, admins] = await Promise.all([
        prisma.user.count({ where: { role: "CLIENT" } }),
        prisma.agency.count(),
        prisma.user.count({ where: { role: "ADMIN" } }),
      ]);
      return [
        { name: "Voyageurs", value: clients },
        { name: "Agences", value: agencies },
        { name: "Admins", value: admins },
      ];
    }

    const labels: Record<string, string> = {
      CLIENT: "Voyageurs",
      AGENCY: "Agences",
      ADMIN: "Admins",
    };
    return byRole.map((r) => ({
      name: labels[r.role ?? ""] ?? r.role ?? "Autre",
      value: r._count.role,
    }));
  }

  private static async getTopTripsByViews(
    start: Date,
    end: Date,
    roleFilter?: string | null
  ) {
    const events = await prisma.behaviorEvent.findMany({
      where: {
        step: "TRIP_VIEW",
        createdAt: { gte: start, lte: end },
        ...eventRoleWhere(roleFilter),
      },
      select: { path: true },
      take: 500,
    });

    const slugCounts = new Map<string, number>();
    for (const e of events) {
      const slug = e.path?.match(/\/trip\/([^/?#]+)/)?.[1];
      if (slug) slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
    }

    const slugs = [...slugCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    if (slugs.length === 0) {
      const trips = await prisma.groupTrip.findMany({
        where: { status: "PUBLISHED" },
        select: { title: true, bookedSpots: true },
        orderBy: { bookedSpots: "desc" },
        take: 5,
      });
      return trips.map((t) => ({ name: t.title.slice(0, 28), views: t.bookedSpots }));
    }

    const trips = await prisma.groupTrip.findMany({
      where: { slug: { in: slugs.map(([s]) => s) } },
      select: { slug: true, title: true },
    });
    const titleMap = new Map(trips.map((t) => [t.slug, t.title]));

    return slugs.map(([slug, views]) => ({
      name: (titleMap.get(slug) ?? slug).slice(0, 28),
      views,
    }));
  }

  private static async getAverageMatchScore(start: Date, end: Date) {
    const leads = await prisma.agencyLead.findMany({
      where: { createdAt: { gte: start, lte: end }, bestCompatibility: { not: null } },
      select: { bestCompatibility: true },
    });
    if (leads.length === 0) return 0;
    const avg =
      leads.reduce((acc, l) => acc + (l.bestCompatibility ?? 0), 0) / leads.length;
    return Math.round(avg);
  }

  private static async countUniqueSessions(
    start: Date,
    end: Date,
    roleFilter?: string | null
  ) {
    const sessions = await prisma.behaviorEvent.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        sessionId: { not: null },
        ...eventRoleWhere(roleFilter),
      },
      distinct: ["sessionId"],
      select: { sessionId: true },
    });
    return sessions.length;
  }
}
