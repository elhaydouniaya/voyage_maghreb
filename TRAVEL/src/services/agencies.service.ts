import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import type { AgencyStatus } from "@prisma/client";

const ALLOWED_STATUSES: AgencyStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "VERIFIED",
  "REJECTED",
  "SUSPENDED",
];

export class AgenciesService {
  static async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ) {
    if (newPassword.length < 8) {
      throw new Error("Le nouveau mot de passe doit contenir au moins 8 caractères.");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, passwordHash: true },
    });

    if (!user || user.role !== "AGENCY") {
      throw new Error("Compte agence introuvable.");
    }
    if (!user.passwordHash) {
      throw new Error("Compte OAuth — mot de passe non modifiable ici.");
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new Error("Mot de passe actuel incorrect.");
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  static async updateNotificationPrefs(
    userId: string,
    prefs: {
      notifyBookingsEmail?: boolean;
      notifyPaymentsEmail?: boolean;
      notifyPartnerNewsletter?: boolean;
    }
  ) {
    const agency = await prisma.agency.findUnique({ where: { userId } });
    if (!agency) throw new Error("Agence introuvable.");

    return prisma.agency.update({
      where: { id: agency.id },
      data: {
        ...(typeof prefs.notifyBookingsEmail === "boolean"
          ? { notifyBookingsEmail: prefs.notifyBookingsEmail }
          : {}),
        ...(typeof prefs.notifyPaymentsEmail === "boolean"
          ? { notifyPaymentsEmail: prefs.notifyPaymentsEmail }
          : {}),
        ...(typeof prefs.notifyPartnerNewsletter === "boolean"
          ? { notifyPartnerNewsletter: prefs.notifyPartnerNewsletter }
          : {}),
      },
    });
  }

  static async getByUserId(userId: string) {
    return prisma.agency.findUnique({
      where: { userId },
      include: {
        _count: {
          select: {
            trips: true,
            bookings: { where: { status: "CONFIRMED" } },
          },
        },
      },
    });
  }

  static async listForAdmin() {
    const agencies = await prisma.agency.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            trips: { where: { status: { in: ["PUBLISHED", "FULL"] } } },
          },
        },
      },
    });

    return agencies.map((a) => ({
      id: a.id,
      name: a.name,
      manager: a.managerName,
      email: a.email,
      phone: a.phoneNumber,
      status: a.verificationStatus,
      siret: a.siret,
      trips: a._count.trips,
      country: a.country,
      city: a.city,
      createdAt: a.createdAt.toISOString(),
      stripeConnect: {
        accountId: a.stripeConnectAccountId,
        chargesEnabled: a.stripeConnectChargesEnabled,
        payoutsEnabled: a.stripeConnectPayoutsEnabled,
        onboardingComplete: a.stripeConnectOnboardingComplete,
      },
    }));
  }

  static async updateVerificationStatus(
    agencyId: string,
    status: AgencyStatus,
    adminUserId?: string | null,
    note?: string
  ) {
    if (!ALLOWED_STATUSES.includes(status)) {
      throw new Error("Statut invalide.");
    }

    const agency = await prisma.agency.findUnique({ where: { id: agencyId } });
    if (!agency) {
      throw new Error("Agence introuvable.");
    }

    const updated = await prisma.agency.update({
      where: { id: agencyId },
      data: {
        verificationStatus: status,
        verificationNote: note ?? agency.verificationNote,
        verifiedAt: status === "VERIFIED" ? new Date() : agency.verifiedAt,
        verifiedByUserId:
          status === "VERIFIED" ? adminUserId ?? null : agency.verifiedByUserId,
      },
    });

    if (status === "VERIFIED" || status === "REJECTED" || status === "SUSPENDED") {
      try {
        const { sendAgencyStatusEmail } = await import("@/lib/agency-emails");
        await sendAgencyStatusEmail({
          agencyEmail: updated.email,
          agencyName: updated.name,
          status,
          note,
        });
      } catch (e) {
        console.error("Agency status email:", e);
      }
    }

    const { AuditLogService } = await import("@/services/audit-log.service");
    await AuditLogService.record(
      "AGENCY_VERIFICATION_UPDATED",
      { agencyId, status, note: note ?? null },
      adminUserId
    );

    return updated;
  }

  static async getDashboardForUser(userId: string) {
    const agency = await prisma.agency.findUnique({
      where: { userId },
    });
    if (!agency) return null;

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    const [activeTrips, confirmedBookings, depositsSum, recentBookings, upcomingTrips, publishedCount] =
      await Promise.all([
        prisma.groupTrip.findMany({
          where: {
            agencyId: agency.id,
            status: { in: ["PUBLISHED", "FULL"] },
          },
        }),
        prisma.booking.count({
          where: { agencyId: agency.id, status: "CONFIRMED" },
        }),
        prisma.booking.aggregate({
          where: { agencyId: agency.id, status: "CONFIRMED" },
          _sum: { depositPaid: true },
        }),
        prisma.booking.findMany({
          where: { agencyId: agency.id },
          orderBy: { createdAt: "desc" },
          take: 6,
          include: {
            groupTrip: {
              select: {
                title: true,
                coverImage: true,
                startDate: true,
              },
            },
          },
        }),
        prisma.groupTrip.findMany({
          where: {
            agencyId: agency.id,
            status: { in: ["PUBLISHED", "FULL"] },
            startDate: { gt: now, lte: in30Days },
          },
          orderBy: { startDate: "asc" },
          take: 5,
        }),
        prisma.groupTrip.count({
          where: {
            agencyId: agency.id,
            status: { in: ["PUBLISHED", "FULL", "CLOSED"] },
          },
        }),
      ]);

    const remainingSpots = activeTrips.reduce(
      (acc, t) => acc + (t.totalSpots - t.bookedSpots),
      0
    );

    const isVerified = agency.verificationStatus === "VERIFIED";
    const hasPublishedTrip = publishedCount > 0;
    const stripeConnectActive = Boolean(
      agency.stripeConnectAccountId && agency.stripeConnectChargesEnabled
    );
    let completedSteps = 0;
    if (stripeConnectActive) completedSteps += 1;
    if (isVerified) completedSteps += 1;
    if (hasPublishedTrip) completedSteps += 1;
    if (confirmedBookings > 0) completedSteps += 1;
    const progressPercent = Math.round((completedSteps / 4) * 100);

    return {
      stats: {
        activeTrips: activeTrips.length,
        confirmedBookings,
        remainingSpots,
        totalRevenue: Math.round(Number(depositsSum._sum.depositPaid || 0)),
      },
      recentBookings: recentBookings.map((b) => ({
        id: b.id,
        traveler: b.clientName,
        trip: b.groupTrip.title,
        spots: `${b.numberOfSeats} place${b.numberOfSeats > 1 ? "s" : ""}`,
        price: `€${Math.round(Number(b.depositPaid))}`,
        status: b.status,
        coverImage: b.groupTrip.coverImage,
        createdAt: b.createdAt.toISOString(),
      })),
      upcomingTrips: upcomingTrips.map((t) => ({
        id: t.id,
        title: t.title,
        startDate: t.startDate.toISOString(),
        spotsLeft: t.totalSpots - t.bookedSpots,
        coverImage: t.coverImage,
      })),
      onboarding: {
        isVerified,
        hasPublishedTrip,
        hasBookings: confirmedBookings > 0,
        stripeConnectActive,
        progressPercent,
      },
      payments: {
        stripeConnectActive,
        stripeOnboardingComplete: agency.stripeConnectOnboardingComplete,
      },
    };
  }

  static async listBookingsForUser(userId: string) {
    const agency = await prisma.agency.findUnique({ where: { userId } });
    if (!agency) return null;

    const bookings = await prisma.booking.findMany({
      where: { agencyId: agency.id },
      orderBy: { createdAt: "desc" },
      include: {
        groupTrip: {
          select: { title: true, destination: true, startDate: true },
        },
      },
    });

    return bookings.map((b) => ({
      id: b.id,
      confirmationCode: b.confirmationCode,
      trip: b.groupTrip.title,
      destination: b.groupTrip.destination,
      client: b.clientName,
      clientEmail: b.clientEmail,
      date: b.groupTrip.startDate.toISOString(),
      bookedAt: b.createdAt.toISOString(),
      status: b.status,
      seats: b.numberOfSeats,
      amount: Math.round(Number(b.depositPaid)),
      totalAmount: Math.round(Number(b.totalAmount)),
    }));
  }
}
