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
        status: input.userId ? "APPROVED" : input.status || "PENDING",
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

  static async updateStatus(id: string, status: ReviewStatus) {
    return prisma.review.update({
      where: { id },
      data: { status },
    });
  }
}
