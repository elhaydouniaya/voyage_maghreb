import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { BookingsService } from "@/services/bookings.service";

export async function POST(request: Request) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe non configuré." }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Signature manquante." }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature error:", err);
    return NextResponse.json({ error: "Signature invalide." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    try {
      const result = await BookingsService.confirmFromStripeSession(session.id, {
        bookingId: session.metadata?.bookingId || "",
        groupTripId: session.metadata?.groupTripId || "",
        agencyId: session.metadata?.agencyId || "",
        clientEmail: session.metadata?.clientEmail || session.customer_email || "",
        numberOfSeats: session.metadata?.numberOfSeats || "1",
      });
      if (!result.alreadyProcessed && "bookingId" in result && result.bookingId) {
        void BookingsService.sendConfirmationEmails(result.bookingId);
      }
    } catch (error) {
      console.error("Webhook booking confirm error:", error);
      return NextResponse.json({ error: "Traitement échoué." }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
