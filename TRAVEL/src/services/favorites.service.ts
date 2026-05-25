import prisma from "@/lib/prisma";
import { formatTrip } from "@/lib/trip-format";

export class FavoritesService {
  static async listForUser(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        groupTrip: { include: { agency: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return favorites
      .filter((f) => f.groupTrip)
      .map((f) => formatTrip(f.groupTrip!));
  }

  static async add(userId: string, groupTripId: string) {
    const trip = await prisma.groupTrip.findUnique({
      where: { id: groupTripId },
    });
    if (!trip) throw new Error("Voyage introuvable.");

    await prisma.favorite.upsert({
      where: {
        userId_groupTripId: { userId, groupTripId },
      },
      create: { userId, groupTripId },
      update: {},
    });
  }

  static async remove(userId: string, groupTripId: string) {
    await prisma.favorite.deleteMany({
      where: { userId, groupTripId },
    });
  }

  static async tripIdsForUser(userId: string) {
    const rows = await prisma.favorite.findMany({
      where: { userId },
      select: { groupTripId: true },
    });
    return rows.map((r) => r.groupTripId);
  }
}
