import prisma from "@/lib/prisma";
import type { TripStatus } from "@prisma/client";
import { stripe } from "@/lib/stripe";
import { sendRefundProcessedEmail } from "@/lib/booking-emails";

const TRIP_STATUSES: TripStatus[] = [
  "DRAFT",
  "PUBLISHED",
  "FULL",
  "CLOSED",
  "CANCELLED",
];

export class AdminService {
  static async listTrips() {
    const trips = await prisma.groupTrip.findMany({
      orderBy: { createdAt: "desc" },
      include: { agency: { select: { name: true } } },
    });

    return trips.map((t) => ({
      id: t.id,
      slug: t.slug,
      agency: t.agency.name,
      title: t.title,
      status: t.status,
      price: `${Math.round(Number(t.totalPrice))}€`,
      destination: t.destination,
    }));
  }

  static async updateTripStatus(tripId: string, status: TripStatus) {
    if (!TRIP_STATUSES.includes(status)) {
      throw new Error("Statut invalide.");
    }
    const trip = await prisma.groupTrip.findUnique({ where: { id: tripId } });
    if (!trip) throw new Error("Voyage introuvable.");

    return prisma.groupTrip.update({
      where: { id: tripId },
      data: { status },
    });
  }

  static async listBookings() {
    const bookings = await prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        agency: { select: { name: true } },
        groupTrip: { select: { title: true } },
      },
    });

    return bookings.map((b) => ({
      id: b.id,
      confirmationCode: b.confirmationCode,
      agency: b.agency.name,
      trip: b.groupTrip.title,
      client: b.clientName,
      clientEmail: b.clientEmail,
      status: b.status,
      date: b.createdAt.toISOString(),
      amount: Math.round(Number(b.depositPaid)),
      canRefund: b.status === "CANCELLED",
    }));
  }

  static async processRefund(
    bookingId: string,
    adminNote?: string,
    adminUserId?: string
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        groupTrip: { select: { title: true, destination: true, id: true, status: true, bookedSpots: true, totalSpots: true } },
      },
    });

    if (!booking) throw new Error("Réservation introuvable.");
    if (booking.status === "REFUNDED") {
      throw new Error("Cette réservation est déjà remboursée.");
    }
    if (booking.status !== "CANCELLED" && booking.status !== "CONFIRMED") {
      throw new Error("Seules les réservations annulées ou confirmées peuvent être remboursées.");
    }

    let stripeRefundOk = false;
    if (stripe && booking.payment?.stripeSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(
          booking.payment.stripeSessionId
        );
        const paymentIntent =
          booking.payment.stripePaymentIntentId ||
          (typeof session.payment_intent === "string"
            ? session.payment_intent
            : null);

        if (paymentIntent) {
          const isConnect = booking.payment.payoutMode === "connect";
          await stripe.refunds.create({
            payment_intent: paymentIntent,
            ...(isConnect
              ? {
                  reverse_transfer: true,
                  refund_application_fee: true,
                }
              : {}),
          });
          stripeRefundOk = true;
        }
      } catch (e) {
        console.error("Stripe refund error:", e);
      }
    }

    await prisma.$transaction(async (tx) => {
      if (booking.status === "CONFIRMED") {
        const trip = await tx.groupTrip.update({
          where: { id: booking.groupTripId },
          data: { bookedSpots: { decrement: booking.numberOfSeats } },
        });
        if (trip.status === "FULL" && trip.bookedSpots < trip.totalSpots) {
          await tx.groupTrip.update({
            where: { id: trip.id },
            data: { status: "PUBLISHED" },
          });
        }
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: "REFUNDED",
          cancellationReason:
            adminNote?.trim() || booking.cancellationReason || "Remboursement traité",
        },
      });

      if (booking.payment) {
        await tx.payment.update({
          where: { id: booking.payment.id },
          data: { status: "REFUNDED" },
        });
      }
    });

    try {
      await sendRefundProcessedEmail({
        to: booking.clientEmail,
        clientName: booking.clientName,
        confirmationCode: booking.confirmationCode,
        tripTitle: booking.groupTrip.title,
        amount: Math.round(Number(booking.depositPaid)),
        stripeProcessed: stripeRefundOk,
      });
    } catch (e) {
      console.error("Refund email:", e);
    }

    const { AuditLogService } = await import("@/services/audit-log.service");
    await AuditLogService.record(
      "BOOKING_REFUNDED",
      {
        bookingId,
        confirmationCode: booking.confirmationCode,
        stripeRefundOk,
      },
      adminUserId
    );

    return { stripeRefundOk };
  }

  static async listPendingAgencies() {
    const agencies = await prisma.agency.findMany({
      where: { verificationStatus: { in: ["PENDING", "UNDER_REVIEW"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return agencies.map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      siret: a.siret,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  static async getStripeConnectOverview() {
    const agencies = await prisma.agency.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        country: true,
        verificationStatus: true,
        stripeConnectAccountId: true,
        stripeConnectChargesEnabled: true,
        stripeConnectPayoutsEnabled: true,
        stripeConnectOnboardingComplete: true,
      },
      orderBy: { name: "asc" },
    });

    const withAccount = agencies.filter((a) => a.stripeConnectAccountId);
    const active = agencies.filter((a) => a.stripeConnectChargesEnabled);

    return {
      summary: {
        totalAgencies: agencies.length,
        withStripeAccount: withAccount.length,
        payoutsActive: active.length,
        pendingOnboarding: withAccount.filter(
          (a) => !a.stripeConnectOnboardingComplete
        ).length,
      },
      agencies: agencies.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        country: a.country,
        verificationStatus: a.verificationStatus,
        connectStatus: !a.stripeConnectAccountId
          ? "not_started"
          : a.stripeConnectChargesEnabled
            ? "active"
            : a.stripeConnectOnboardingComplete
              ? "restricted"
              : "onboarding",
      })),
    };
  }

  static async listPayments() {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        booking: { select: { confirmationCode: true, clientName: true } },
        agency: { select: { name: true } },
        groupTrip: { select: { title: true } },
      },
    });

    return payments.map((p) => ({
      id: p.id,
      amount: Math.round(Number(p.amount)),
      currency: p.currency,
      status: p.status,
      payoutMode: p.payoutMode,
      platformFeeCents: p.platformFeeCents,
      agencyNetCents: p.agencyNetCents,
      paidAt: p.paidAt?.toISOString() || null,
      createdAt: p.createdAt.toISOString(),
      stripeSessionId: p.stripeSessionId,
      stripeDashboardUrl: p.stripeSessionId
        ? `https://dashboard.stripe.com/payments?query=${encodeURIComponent(p.stripeSessionId)}`
        : null,
      confirmationCode: p.booking.confirmationCode,
      clientName: p.booking.clientName,
      agency: p.agency.name,
      trip: p.groupTrip.title,
    }));
  }

  static async getChartData() {
    const weeks = 8;
    const weeklyBookings: { label: string; count: number }[] = [];
    const now = new Date();

    for (let i = weeks - 1; i >= 0; i--) {
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - i * 7);
      weekEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const count = await prisma.booking.count({
        where: {
          status: "CONFIRMED",
          createdAt: { gte: weekStart, lte: weekEnd },
        },
      });

      weeklyBookings.push({
        label: weekStart.toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "short",
        }),
        count,
      });
    }

    const agencyGroups = await prisma.booking.groupBy({
      by: ["agencyId"],
      where: { status: "CONFIRMED" },
      _count: { agencyId: true },
      orderBy: { _count: { agencyId: "desc" } },
      take: 5,
    });

    const agencyPerformance = await Promise.all(
      agencyGroups.map(async (g) => {
        const ag = await prisma.agency.findUnique({
          where: { id: g.agencyId },
          select: { name: true },
        });
        return {
          name: ag?.name?.slice(0, 18) || "Agence",
          bookings: g._count.agencyId,
        };
      })
    );

    const topDestinationsRaw = await prisma.groupTrip.groupBy({
      by: ["destination"],
      where: { status: { in: ["PUBLISHED", "FULL", "CLOSED"] } },
      _count: { destination: true },
      orderBy: { _count: { destination: "desc" } },
      take: 5,
    });

    const topDestinations = topDestinationsRaw.map((d) => ({
      name: d.destination.slice(0, 20),
      trips: d._count.destination,
    }));

    return { weeklyBookings, agencyPerformance, topDestinations };
  }

  static async getDashboardOverview() {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalBookings,
      monthBookings,
      monthRevenue,
      activeTrips,
      publishedTrips,
      pendingAgencies,
      totalTravelRequests,
      monthTravelRequests,
      topDestinations,
      topAgencies,
    ] = await Promise.all([
      prisma.booking.count({ where: { status: "CONFIRMED" } }),
      prisma.booking.count({
        where: { status: "CONFIRMED", createdAt: { gte: monthStart } },
      }),
      prisma.booking.aggregate({
        where: { status: "CONFIRMED", createdAt: { gte: monthStart } },
        _sum: { depositPaid: true },
      }),
      prisma.groupTrip.count({
        where: { status: { in: ["PUBLISHED", "FULL"] } },
      }),
      prisma.groupTrip.count({ where: { status: "PUBLISHED" } }),
      prisma.agency.count({
        where: { verificationStatus: { in: ["PENDING", "UNDER_REVIEW"] } },
      }),
      prisma.travelRequest.count(),
      prisma.travelRequest.count({ where: { createdAt: { gte: monthStart } } }),
      prisma.groupTrip.groupBy({
        by: ["destination"],
        _count: { destination: true },
        orderBy: { _count: { destination: "desc" } },
        take: 3,
      }),
      prisma.booking.groupBy({
        by: ["agencyId"],
        where: { status: "CONFIRMED" },
        _count: { agencyId: true },
        orderBy: { _count: { agencyId: "desc" } },
        take: 3,
      }),
    ]);

    const conversionRate =
      totalTravelRequests > 0
        ? Math.round((totalBookings / totalTravelRequests) * 1000) / 10
        : 0;

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

    const agencyNames = await Promise.all(
      topAgencies.map(async (a) => {
        const ag = await prisma.agency.findUnique({
          where: { id: a.agencyId },
          select: { name: true },
        });
        return ag?.name || "—";
      })
    );

    const cancelledPending = await prisma.booking.count({
      where: { status: "CANCELLED" },
    });

    const recentCancellations = await prisma.booking.findMany({
      where: { status: "CANCELLED" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { groupTrip: { select: { title: true } } },
    });

    return {
      recentCancellations: recentCancellations.map((b) => ({
        id: b.id,
        user: b.clientName,
        amount: `${Math.round(Number(b.depositPaid))}€`,
        trip: b.groupTrip.title,
        reason: b.cancellationReason || "Annulation",
      })),
      stats: {
        totalBookings,
        monthBookings,
        monthRevenue: Math.round(Number(monthRevenue._sum.depositPaid || 0)),
        conversionRate,
        fillingRate,
        activeTrips,
        publishedTrips,
        pendingAgencies,
        pendingRefunds: cancelledPending,
        monthTravelRequests,
      },
      topDestinations: topDestinations.map((d) => d.destination).join(", ") || "—",
      topAgencies: agencyNames.join(", ") || "—",
    };
  }

  static async listClients() {
    const users = await prisma.user.findMany({
      where: { role: "CLIENT" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        _count: {
          select: {
            bookings: true,
            requests: true,
            reviews: true,
            favorites: true,
          },
        },
        bookings: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            status: true,
            createdAt: true,
            groupTrip: { select: { title: true } },
          },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name || "—",
      email: u.email || "—",
      phone: u.phone || "—",
      registeredAt: u.createdAt.toISOString(),
      bookingsCount: u._count.bookings,
      travelRequestsCount: u._count.requests,
      reviewsCount: u._count.reviews,
      favoritesCount: u._count.favorites,
      lastBooking: u.bookings[0]
        ? {
            trip: u.bookings[0].groupTrip.title,
            status: u.bookings[0].status,
            date: u.bookings[0].createdAt.toISOString(),
          }
        : null,
    }));
  }
}
