import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { BookingsService } from "@/services/bookings.service";
import { isDemoPaymentsAllowed } from "@/lib/payments-config";
import { PaymentsService } from "@/services/payments.service";
import { getAppUrl } from "@/lib/app-url";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`booking-initiate:${ip}`, 5, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `Trop de tentatives. Réessayez dans ${Math.ceil((limited.retryAfterSec || 3600) / 60)} min.`,
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Connexion requise pour réserver un voyage." },
        { status: 401 }
      );
    }
    if (session.user.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Seuls les voyageurs peuvent effectuer des réservations." },
        { status: 403 }
      );
    }

    const clientEmail = String(body.clientEmail || "").trim().toLowerCase();
    const clientName = String(body.clientName || "").trim();

    if (!clientEmail || !clientName) {
      return NextResponse.json(
        { error: "Nom et email sont obligatoires." },
        { status: 400 }
      );
    }

    const userId = session.user.id;

    const booking = await BookingsService.initiate({
      groupTripId: body.groupTripId || body.tripId,
      userId,
      clientName,
      clientEmail,
      clientPhone: body.clientPhone,
      clientCountry: body.clientCountry,
      numberOfSeats: Number(body.numberOfSeats) || 1,
      notes: body.notes,
      travelRequestId: body.travelRequestId,
      acceptCgu: Boolean(body.acceptCgu),
      acceptRgpd: Boolean(body.acceptRgpd),
    });

    const appUrl = getAppUrl();

    if (PaymentsService.isConfigured()) {
      const { url } = await PaymentsService.createCheckoutSession(
        booking,
        appUrl
      );
      return NextResponse.json({ bookingId: booking.id, checkoutUrl: url });
    }

    if (!isDemoPaymentsAllowed()) {
      return NextResponse.json(
        {
          error:
            "Paiement indisponible : configurez Stripe (STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLIC_KEY).",
        },
        { status: 503 }
      );
    }

    const summary = await BookingsService.confirmDemoPayment(booking.id);

    return NextResponse.json({
      bookingId: booking.id,
      demoMode: true,
      message: "Paiement simulé — réservation confirmée.",
      booking: summary,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Réservation impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
