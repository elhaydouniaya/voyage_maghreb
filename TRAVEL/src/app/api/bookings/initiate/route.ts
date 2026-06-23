import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { BookingsService } from "@/services/bookings.service";
import { isDemoPaymentsAllowed } from "@/lib/payments-config";
import { PaymentsService } from "@/services/payments.service";
import {
  bookingInitiateSchema,
  formatZodError,
} from "@/lib/api-schemas";
import { resolveAccountEmail } from "@/lib/account-email";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const isDev = process.env.NODE_ENV !== "production";
  const limited = rateLimit(
    `booking-initiate:${ip}`,
    isDev ? 50 : 5,
    60 * 60 * 1000
  );
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: `Trop de tentatives. Réessayez dans ${Math.ceil((limited.retryAfterSec || 3600) / 60)} min.`,
      },
      { status: 429 }
    );
  }

  try {
    const raw = await request.json();
    const parsed = bookingInitiateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const body = parsed.data;
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

    const userId = session.user.id;
    let clientEmail: string;
    try {
      clientEmail = await resolveAccountEmail({ userId });
    } catch {
      return NextResponse.json(
        {
          error:
            "Votre compte n'a pas d'adresse email. Ajoutez-en une dans votre profil avant de réserver.",
        },
        { status: 400 }
      );
    }
    const clientName = body.clientName;
    const groupTripId = body.groupTripId || body.tripId;

    if (!groupTripId) {
      return NextResponse.json(
        { error: "Identifiant du voyage manquant." },
        { status: 400 }
      );
    }

    const booking = await BookingsService.initiate({
      groupTripId,
      userId,
      clientName,
      clientEmail,
      clientPhone: body.clientPhone,
      clientCountry: body.clientCountry,
      numberOfSeats: body.numberOfSeats,
      notes: body.notes,
      travelRequestId: body.travelRequestId,
      acceptCgu: body.acceptCgu,
      acceptRgpd: body.acceptRgpd,
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

    const summary = await BookingsService.confirmDemoPayment(booking.id, userId);

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
