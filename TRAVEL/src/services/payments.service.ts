import { stripe } from "@/lib/stripe";
import { isStripeConfigured } from "@/lib/payments-config";
import type { Booking, GroupTrip } from "@prisma/client";

export class PaymentsService {
  static async createCheckoutSession(
    booking: Booking & { groupTrip: GroupTrip },
    appUrl: string
  ) {
    if (!stripe) {
      throw new Error("Stripe n'est pas configuré.");
    }

    const trip = booking.groupTrip;
    const depositCents = Math.round(Number(booking.depositPaid) * 100);
    const dates = `${trip.startDate.toLocaleDateString("fr-FR")} – ${trip.endDate.toLocaleDateString("fr-FR")}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: trip.currency.toLowerCase(),
            unit_amount: Math.round(Number(trip.depositAmount) * 100),
            product_data: {
              name: `Acompte — ${trip.title}`,
              description: `${trip.destination} · ${dates}`,
            },
          },
          quantity: booking.numberOfSeats,
        },
      ],
      mode: "payment",
      customer_email: booking.clientEmail,
      success_url: `${appUrl}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/trip/${trip.slug}`,
      metadata: {
        bookingId: booking.id,
        groupTripId: trip.id,
        agencyId: booking.agencyId,
        clientEmail: booking.clientEmail,
        numberOfSeats: String(booking.numberOfSeats),
      },
    });

    if (!session.url) {
      throw new Error("Impossible de créer la session Stripe.");
    }

    return { url: session.url, sessionId: session.id, depositCents };
  }

  static isConfigured() {
    return isStripeConfigured();
  }
}
