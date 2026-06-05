import prisma from "@/lib/prisma";

export type AnomalySeverity = "info" | "warning" | "critical";
export type AnomalyStatus = "good" | "watch" | "alert";

export type AnomalyAlert = {
  id: string;
  title: string;
  description: string;
  severity: AnomalySeverity;
  status: AnomalyStatus;
  metric?: string;
  value?: string;
};

export class AnomalyDetectionService {
  static async detectAlerts(): Promise<AnomalyAlert[]> {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      weekBookings,
      weekCancellations,
      dayBookingsByEmail,
      weekFailedPayments,
      pendingReviews,
      pendingAgencies,
      weekRequests,
      prevWeekRequests,
      duplicateSessions,
    ] = await Promise.all([
      prisma.booking.count({
        where: { createdAt: { gte: weekAgo }, status: "CONFIRMED" },
      }),
      prisma.booking.count({
        where: { cancelledAt: { gte: weekAgo } },
      }),
      prisma.booking.groupBy({
        by: ["clientEmail"],
        where: { createdAt: { gte: dayAgo } },
        _count: { clientEmail: true },
        having: { clientEmail: { _count: { gt: 2 } } },
      }),
      prisma.payment.count({
        where: { status: "FAILED", createdAt: { gte: weekAgo } },
      }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.agency.count({
        where: { verificationStatus: { in: ["PENDING", "UNDER_REVIEW"] } },
      }),
      prisma.travelRequest.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.travelRequest.count({
        where: {
          createdAt: {
            gte: new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000),
            lt: weekAgo,
          },
        },
      }),
      this.detectSuspiciousSessionBursts(dayAgo),
    ]);

    const alerts: AnomalyAlert[] = [];

    const cancelRate =
      weekBookings + weekCancellations > 0
        ? weekCancellations / (weekBookings + weekCancellations)
        : 0;

    alerts.push({
      id: "conversion-trend",
      title: "Taux de conversion",
      description:
        weekRequests > 0 && weekBookings / weekRequests >= 0.15
          ? "Le parcours recherche → réservation reste performant."
          : "Le funnel conversion mérite une optimisation UX.",
      severity: "info",
      status: weekRequests > 0 && weekBookings / weekRequests >= 0.15 ? "good" : "watch",
      metric: "Conversion 7j",
      value:
        weekRequests > 0
          ? `${Math.round((weekBookings / weekRequests) * 100)}%`
          : "—",
    });

    alerts.push({
      id: "cancellation-rate",
      title: "Annulations",
      description:
        cancelRate > 0.2
          ? "Taux d'annulation élevé sur 7 jours — vérifier les motifs."
          : "Volume d'annulations dans la norme.",
      severity: cancelRate > 0.3 ? "critical" : cancelRate > 0.2 ? "warning" : "info",
      status: cancelRate > 0.2 ? "alert" : "good",
      metric: "Annulations 7j",
      value: `${weekCancellations} (${Math.round(cancelRate * 100)}%)`,
    });

    if (dayBookingsByEmail.length > 0) {
      alerts.push({
        id: "multi-booking-email",
        title: "Réservations multiples",
        description: `${dayBookingsByEmail.length} email(s) avec plus de 2 réservations en 24h.`,
        severity: "warning",
        status: "watch",
        metric: "Emails suspects",
        value: String(dayBookingsByEmail.length),
      });
    }

    if (weekFailedPayments >= 3) {
      alerts.push({
        id: "failed-payments",
        title: "Paiements échoués",
        description: "Pic de paiements Stripe échoués — vérifier webhook et fraude.",
        severity: weekFailedPayments >= 8 ? "critical" : "warning",
        status: "alert",
        metric: "Échecs 7j",
        value: String(weekFailedPayments),
      });
    } else {
      alerts.push({
        id: "failed-payments-ok",
        title: "Paiements",
        description: "Peu ou pas d'échecs de paiement récents.",
        severity: "info",
        status: "good",
        metric: "Échecs 7j",
        value: String(weekFailedPayments),
      });
    }

    if (pendingReviews >= 5) {
      alerts.push({
        id: "review-backlog",
        title: "Modération avis",
        description: `${pendingReviews} avis en attente de modération.`,
        severity: pendingReviews >= 15 ? "warning" : "info",
        status: pendingReviews >= 10 ? "watch" : "good",
        metric: "Avis pending",
        value: String(pendingReviews),
      });
    }

    if (pendingAgencies >= 3) {
      alerts.push({
        id: "agency-verification",
        title: "Agences en attente",
        description: `${pendingAgencies} agences à valider — risque de fraude documentaire.`,
        severity: pendingAgencies >= 8 ? "warning" : "info",
        status: pendingAgencies >= 5 ? "watch" : "good",
        metric: "En attente",
        value: String(pendingAgencies),
      });
    }

    const requestSpike =
      prevWeekRequests > 0 ? weekRequests / prevWeekRequests : weekRequests > 20 ? 2 : 1;
    if (requestSpike >= 2) {
      alerts.push({
        id: "ai-request-spike",
        title: "Pic demandes IA",
        description: "Volume de demandes IA anormalement élevé vs semaine précédente.",
        severity: requestSpike >= 3 ? "warning" : "info",
        status: "watch",
        metric: "Variation",
        value: `+${Math.round((requestSpike - 1) * 100)}%`,
      });
    }

    if (duplicateSessions.length > 0) {
      alerts.push({
        id: "session-burst",
        title: "Comportement suspect",
        description: `${duplicateSessions.length} session(s) avec activité intensive (>80 événements/24h).`,
        severity: "warning",
        status: "alert",
        metric: "Sessions",
        value: String(duplicateSessions.length),
      });
    }

    const avgRating = await prisma.review.aggregate({
      where: { status: "APPROVED" },
      _avg: { rating: true },
    });
    const rating = avgRating._avg.rating ?? 0;
    alerts.push({
      id: "satisfaction",
      title: "Satisfaction voyageurs",
      description:
        rating >= 4 ? "Note moyenne des avis approuvés satisfaisante." : "Qualité perçue à améliorer.",
      severity: "info",
      status: rating >= 4 ? "good" : rating >= 3 ? "watch" : "alert",
      metric: "Note moyenne",
      value: rating > 0 ? `${rating.toFixed(1)}/5` : "—",
    });

    return alerts;
  }

  private static async detectSuspiciousSessionBursts(since: Date) {
    const groups = await prisma.behaviorEvent.groupBy({
      by: ["sessionId"],
      where: { createdAt: { gte: since }, sessionId: { not: null } },
      _count: { sessionId: true },
      having: { sessionId: { _count: { gt: 80 } } },
    });
    return groups.filter((g) => g.sessionId);
  }
}
