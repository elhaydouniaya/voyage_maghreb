import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { isStripeConfigured } from "@/lib/payments-config";
import {
  computePlatformFeeCents,
  getPlatformFeePercent,
} from "@/lib/platform-fee";
import prisma from "@/lib/prisma";
import type { Booking, GroupTrip } from "@prisma/client";

export type CheckoutPayoutMode = "platform" | "connect";

export class PaymentsService {
  static async createCheckoutSession(
    booking: Booking & { groupTrip: GroupTrip },
    appUrl: string
  ) {
    if (!stripe) {
      throw new Error("Stripe n'est pas configuré.");
    }

    const trip = booking.groupTrip;
    const unitCents = Math.round(Number(trip.depositAmount) * 100);
    const totalCents = unitCents * booking.numberOfSeats;
    const dates = `${trip.startDate.toLocaleDateString("fr-FR")} – ${trip.endDate.toLocaleDateString("fr-FR")}`;

    const agency = await prisma.agency.findUnique({
      where: { id: booking.agencyId },
      select: {
        name: true,
        stripeConnectAccountId: true,
        stripeConnectChargesEnabled: true,
      },
    });

    const useConnect = Boolean(
      agency?.stripeConnectAccountId && agency.stripeConnectChargesEnabled
    );

    const payoutMode: CheckoutPayoutMode = useConnect ? "connect" : "platform";
    const platformFeeCents = useConnect
      ? computePlatformFeeCents(totalCents)
      : 0;

    const metadata: Record<string, string> = {
      bookingId: booking.id,
      groupTripId: trip.id,
      agencyId: booking.agencyId,
      clientEmail: booking.clientEmail,
      numberOfSeats: String(booking.numberOfSeats),
      payoutMode,
      platformFeePercent: String(getPlatformFeePercent()),
    };

    if (useConnect && agency?.stripeConnectAccountId) {
      metadata.platformFeeCents = String(platformFeeCents);
      metadata.stripeConnectAccountId = agency.stripeConnectAccountId;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: trip.currency.toLowerCase(),
            unit_amount: unitCents,
            product_data: {
              name: `Acompte — ${trip.title}`,
              description: `${trip.destination} · ${dates}${useConnect ? ` · ${agency?.name}` : ""}`,
            },
          },
          quantity: booking.numberOfSeats,
        },
      ],
      mode: "payment",
      customer_email: booking.clientEmail,
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/trip/${trip.slug}`,
      metadata,
    };

    if (useConnect && agency?.stripeConnectAccountId) {
      sessionParams.payment_intent_data = {
        application_fee_amount: platformFeeCents,
        transfer_data: {
          destination: agency.stripeConnectAccountId,
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new Error("Impossible de créer la session Stripe.");
    }

    return {
      url: session.url,
      sessionId: session.id,
      depositCents: totalCents,
      payoutMode,
      platformFeeCents,
    };
  }

  static isConfigured() {
    return isStripeConfigured();
  }
}
