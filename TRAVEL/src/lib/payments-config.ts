import { stripe } from "@/lib/stripe";

/** True when Stripe checkout can run (secret + public key + app URL). */
export function isStripeConfigured(): boolean {
  return Boolean(
    stripe &&
      process.env.NEXT_PUBLIC_APP_URL?.trim() &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY?.trim()
  );
}

/** Demo instant-confirm payments — dev only unless explicitly allowed. */
export function isDemoPaymentsAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_DEMO_PAYMENTS === "true"
  );
}
