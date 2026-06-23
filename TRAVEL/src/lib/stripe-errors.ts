/** User-facing message when Stripe Connect is not enabled on the platform account. */
export function isStripeConnectNotEnabledError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("signed up for connect") ||
    m.includes("signed up for stripe connect") ||
    m.includes("connect is not enabled")
  );
}

export const STRIPE_CONNECT_SETUP_URL =
  "https://dashboard.stripe.com/test/connect/overview";

export function formatStripeConnectError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (isStripeConnectNotEnabledError(message)) {
    return `Stripe Connect n'est pas activé sur votre compte Stripe. Ouvrez ${STRIPE_CONNECT_SETUP_URL} (mode test), activez Connect, puis réessayez.`;
  }
  return message;
}
