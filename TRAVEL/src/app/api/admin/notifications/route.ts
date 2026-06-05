import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé." }, { status: 403 });
  }

  try {
    const [pendingAgencies, pendingBookings, recentAi] = await Promise.all([
      prisma.agency.count({
        where: { verificationStatus: { in: ["PENDING", "UNDER_REVIEW"] } },
      }),
      prisma.booking.count({
        where: {
          status: "PENDING_PAYMENT",
          createdAt: { gte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
        },
      }),
      prisma.travelRequest.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    const items: {
      id: string;
      title: string;
      detail: string;
      href: string;
      unread: boolean;
    }[] = [];

    if (pendingAgencies > 0) {
      items.push({
        id: "pending-agencies",
        title: "Agences à valider",
        detail: `${pendingAgencies} dossier(s) en attente`,
        href: "/admin/agencies",
        unread: true,
      });
    }
    if (pendingBookings > 0) {
      items.push({
        id: "pending-bookings",
        title: "Paiements en attente",
        detail: `${pendingBookings} réservation(s) récente(s)`,
        href: "/admin/bookings",
        unread: true,
      });
    }
    if (recentAi > 0) {
      items.push({
        id: "recent-ai",
        title: "Demandes IA (24h)",
        detail: `${recentAi} nouvelle(s) demande(s)`,
        href: "/admin/ai-requests",
        unread: true,
      });
    }

    return NextResponse.json({
      count: items.length,
      items,
    });
  } catch (error) {
    console.error("GET /api/admin/notifications", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
