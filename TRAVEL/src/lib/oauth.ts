/** Google OAuth is enabled only when real credentials are configured (not mock placeholders). */
export function isGoogleOAuthEnabled(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!id || !secret) return false;
  if (id.includes("mock") || secret.includes("mock")) return false;
  return true;
}
