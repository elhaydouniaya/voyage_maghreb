import prisma from "@/lib/prisma";
import type { ReviewStatus } from "@prisma/client";

export class ReviewsService {
  static async listApproved(limit = 50) {
    const reviews = await prisma.review.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return reviews.map((r) => ({
      id: r.id,
      author: r.authorName,
      rating: r.rating,
      title: r.title,
      content: r.content,
      destination: r.destination,
      tripDate: r.tripDate || "",
      date: r.createdAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      createdAt: r.createdAt.toISOString(),
      helpful: r.helpfulCount,
    }));
  }

  static async getStats() {
    const approved = await prisma.review.findMany({
      where: { status: "APPROVED" },
      select: { rating: true },
    });
    const count = approved.length;
    const avg =
      count > 0
        ? approved.reduce((sum, r) => sum + r.rating, 0) / count
        : 0;
    return { count, average: Math.round(avg * 10) / 10 };
  }

  static async getAgencyStats(agencyId: string) {
    const approved = await prisma.review.findMany({
      where: {
        status: "APPROVED",
        groupTrip: { agencyId },
      },
      select: { rating: true },
    });
    const count = approved.length;
    const average =
      count > 0
        ? Math.round(
            (approved.reduce((sum, r) => sum + r.rating, 0) / count) * 10
          ) / 10
        : 0;
    return { count, average };
  }

  static async hasVerifiedBooking(
    userId: string,
    groupTripId?: string
  ): Promise<boolean> {
    const where = {
      userId,
      status: "CONFIRMED" as const,
      ...(groupTripId ? { groupTripId } : {}),
    };
    const booking = await prisma.booking.findFirst({ where });
    return Boolean(booking);
  }

  static async create(input: {
    userId?: string;
    authorName: string;
    authorEmail: string;
    rating: number;
    title: string;
    content: string;
    destination: string;
    tripDate?: string;
    groupTripId?: string;
    status?: ReviewStatus;
  }) {
    if (input.rating < 1 || input.rating > 5) {
      throw new Error("La note doit être entre 1 et 5.");
    }
    if (!input.title.trim() || !input.content.trim()) {
      throw new Error("Titre et contenu requis.");
    }

    let status: ReviewStatus = input.status || "PENDING";
    if (input.userId && !input.status) {
      const verified = await this.hasVerifiedBooking(
        input.userId,
        input.groupTripId
      );
      status = verified ? "APPROVED" : "PENDING";
    }

    const review = await prisma.review.create({
      data: {
        userId: input.userId,
        authorName: input.authorName.trim(),
        authorEmail: input.authorEmail.toLowerCase().trim(),
        rating: input.rating,
        title: input.title.trim(),
        content: input.content.trim(),
        destination: input.destination.trim(),
        tripDate: input.tripDate?.trim() || null,
        groupTripId: input.groupTripId,
        status,
      },
    });

    return review;
  }

  static async listForAdmin(status?: string) {
    const where =
      status && status !== "ALL"
        ? { status: status as ReviewStatus }
        : undefined;

    const reviews = await prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return reviews.map((r) => ({
      id: r.id,
      author: r.authorName,
      email: r.authorEmail,
      rating: r.rating,
      title: r.title,
      destination: r.destination,
      status: r.status,
      date: r.createdAt.toLocaleDateString("fr-FR"),
    }));
  }

  static async incrementHelpful(id: string) {
    const review = await prisma.review.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!review || review.status !== "APPROVED") {
      throw new Error("Avis introuvable.");
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { helpfulCount: { increment: 1 } },
      select: { helpfulCount: true },
    });

    return updated.helpfulCount;
  }

  static async updateStatus(id: string, status: ReviewStatus) {
    return prisma.review.update({
      where: { id },
      data: { status },
    });
  }

  static async getStatsForAgencies(agencyIds: string[]) {
    if (agencyIds.length === 0) return new Map<string, { count: number; average: number }>();

    const reviews = await prisma.review.findMany({
      where: {
        groupTrip: { agencyId: { in: agencyIds } },
        status: "APPROVED",
      },
      select: {
        rating: true,
        groupTrip: { select: { agencyId: true } },
      },
    });

    const stats = new Map<string, { count: number; total: number }>();
    for (const review of reviews) {
      const agencyId = review.groupTrip?.agencyId;
      if (!agencyId) continue;
      const current = stats.get(agencyId) ?? { count: 0, total: 0 };
      current.count += 1;
      current.total += review.rating;
      stats.set(agencyId, current);
    }

    return new Map(
      [...stats.entries()].map(([agencyId, { count, total }]) => [
        agencyId,
        { count, average: Math.round((total / count) * 10) / 10 },
      ])
    );
  }

  static async listByAgency(agencyId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        groupTrip: { agencyId },
      },
      orderBy: { createdAt: "desc" },
      include: {
        groupTrip: {
          select: { id: true, title: true, slug: true },
        },
      },
    });

    return reviews.map((r) => ({
      id: r.id,
      author: r.authorName,
      email: r.authorEmail,
      rating: r.rating,
      title: r.title,
      content: r.content,
      destination: r.destination,
      tripDate: r.tripDate || "",
      status: r.status,
      date: r.createdAt.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      tripTitle: r.groupTrip?.title || null,
      tripSlug: r.groupTrip?.slug || null,
    }));
  }
}
