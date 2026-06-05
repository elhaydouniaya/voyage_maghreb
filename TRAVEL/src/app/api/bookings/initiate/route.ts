import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { findOrCreateGuestUser } from "@/lib/guest-user";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { BookingsService } from "@/services/bookings.service";
import { isDemoPaymentsAllowed } from "@/lib/payments-config";
import { PaymentsService } from "@/services/payments.service";
import {
  bookingInitiateSchema,
  formatZodError,
} from "@/lib/api-schemas";

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

    const clientEmail = body.clientEmail.toLowerCase();
    const clientName = body.clientName;

    const userId =
      session?.user?.id ||
      (await findOrCreateGuestUser(clientEmail, clientName));

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
