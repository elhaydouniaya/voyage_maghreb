/**
 * Resolve the public application URL for links generated on the server.
 *
 * Vercel exposes VERCEL_URL automatically, while production deployments
 * should set NEXT_PUBLIC_APP_URL to the canonical custom domain.
 */
export function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return `https://${vercelUrl}`;

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL or VERCEL_URL must be configured in production."
    );
  }

  return "http://localhost:3000";
}
