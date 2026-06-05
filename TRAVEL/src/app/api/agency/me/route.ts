import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AgenciesService } from "@/services/agencies.service";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const agency = await AgenciesService.getByUserId(session.user.id);
    if (!agency) {
      return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });
    }

    const unreadLeads = await prisma.agencyLead.count({
      where: { agencyId: agency.id, readAt: null },
    });

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const newBookings24h = await prisma.booking.count({
      where: {
        agencyId: agency.id,
        status: "CONFIRMED",
        createdAt: { gte: since },
      },
    });

    return NextResponse.json({
      agency: {
        id: agency.id,
        slug: agency.slug || agency.id,
        name: agency.name,
        managerName: agency.managerName,
        email: agency.email,
        city: agency.city,
        country: agency.country,
        siret: agency.siret,
        verificationStatus: agency.verificationStatus,
        verificationNote: agency.verificationNote,
        tripCount: agency._count.trips,
        confirmedBookings: agency._count.bookings,
        unreadLeads,
        newBookings24h,
        notifyBookingsEmail: agency.notifyBookingsEmail,
        notifyPaymentsEmail: agency.notifyPaymentsEmail,
        notifyPartnerNewsletter: agency.notifyPartnerNewsletter,
      },
    });
  } catch (error) {
    console.error("GET /api/agency/me", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = await req.json();

    if (body.action === "notifications" || "notifyBookingsEmail" in body) {
      const updated = await AgenciesService.updateNotificationPrefs(
        session.user.id,
        {
          notifyBookingsEmail:
            typeof body.notifyBookingsEmail === "boolean"
              ? body.notifyBookingsEmail
              : undefined,
          notifyPaymentsEmail:
            typeof body.notifyPaymentsEmail === "boolean"
              ? body.notifyPaymentsEmail
              : undefined,
          notifyPartnerNewsletter:
            typeof body.notifyPartnerNewsletter === "boolean"
              ? body.notifyPartnerNewsletter
              : undefined,
        }
      );
      return NextResponse.json({
        ok: true,
        notifications: {
          notifyBookingsEmail: updated.notifyBookingsEmail,
          notifyPaymentsEmail: updated.notifyPaymentsEmail,
          notifyPartnerNewsletter: updated.notifyPartnerNewsletter,
        },
      });
    }

    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Mot de passe actuel et nouveau requis." },
        { status: 400 }
      );
    }

    await AgenciesService.updatePassword(
      session.user.id,
      currentPassword,
      newPassword
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la mise à jour.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
