import prisma from "@/lib/prisma";
import { AuditLogService } from "@/services/audit-log.service";

export class GdprService {
  static async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        bookings: {
          include: {
            groupTrip: {
              select: {
                title: true,
                destination: true,
                startDate: true,
                endDate: true,
              },
            },
            agency: { select: { name: true } },
          },
        },
        requests: true,
        favorites: {
          include: {
            groupTrip: {
              select: { title: true, destination: true, slug: true },
            },
          },
        },
        reviews: true,
        guideProfile: true,
      },
    });

    if (!user) throw new Error("Utilisateur introuvable.");

    const { passwordHash: _removed, ...safe } = user;

    return {
      exportedAt: new Date().toISOString(),
      platform: "MaghrebVoyage",
      user: safe,
    };
  }

  static async deleteClientAccount(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { agency: true },
    });

    if (!user) throw new Error("Utilisateur introuvable.");
    if (user.role !== "CLIENT") {
      throw new Error(
        "La suppression automatique est réservée aux comptes voyageurs. Contactez le support pour un compte agence ou admin."
      );
    }
    if (user.agency) {
      throw new Error("Ce compte est lié à une agence. Contactez le support.");
    }

    const pending = await prisma.booking.count({
      where: {
        userId,
        status: { in: ["PENDING_PAYMENT"] },
      },
    });
    if (pending > 0) {
      throw new Error(
        "Vous avez une réservation en attente de paiement. Finalisez ou annulez-la avant de supprimer votre compte."
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.travelRequest.deleteMany({ where: { userId } });
      await tx.favorite.deleteMany({ where: { userId } });
      await tx.review.deleteMany({ where: { userId } });
      await tx.guideChatMessage.deleteMany({ where: { userId } });
      await tx.clientGuideProfile.deleteMany({ where: { userId } });
      await tx.session.deleteMany({ where: { userId } });
      await tx.account.deleteMany({ where: { userId } });

      await tx.user.update({
        where: { id: userId },
        data: {
          name: "Compte supprimé",
          email: `deleted-${userId}@removed.local`,
          phone: null,
          passwordHash: null,
          image: null,
        },
      });
    });

    await AuditLogService.record("USER_ACCOUNT_DELETED", { userId }, userId);
  }
}
