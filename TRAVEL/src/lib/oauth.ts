/** Google OAuth is enabled only when real credentials are configured (not mock placeholders). */
export function isGoogleOAuthEnabled(): boolean {
  const id = process.env.GOOGLE_CLIENT_ID?.trim();
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!id || !secret) return false;
  if (id.includes("mock") || secret.includes("mock")) return false;
  return true;
}

function appBaseUrls(): string[] {
  const urls = new Set<string>();
  for (const key of ["NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"]) {
    const v = process.env[key]?.trim().replace(/\/$/, "");
    if (v) urls.add(v);
  }
  return [...urls];
}

/** Redirect URIs to register in Google Cloud Console → Credentials → OAuth client. */
export function getGoogleOAuthRedirectUris(): string[] {
  return appBaseUrls().map((base) => `${base}/api/auth/callback/google`);
}

export function getGoogleOAuthConfigStatus() {
  const id = process.env.GOOGLE_CLIENT_ID?.trim() || "";
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim() || "";
  const enabled = isGoogleOAuthEnabled();
  const redirectUris = getGoogleOAuthRedirectUris();
  const issues: string[] = [];

  if (!id) issues.push("GOOGLE_CLIENT_ID manquant");
  else if (!id.endsWith(".apps.googleusercontent.com"))
    issues.push("GOOGLE_CLIENT_ID : format invalide (attendu *.apps.googleusercontent.com)");

  if (!secret) issues.push("GOOGLE_CLIENT_SECRET manquant");
  else if (!secret.startsWith("GOCSPX-"))
    issues.push("GOOGLE_CLIENT_SECRET : format inhabituel (attendu GOCSPX-...)");

  if (enabled && redirectUris.length === 0)
    issues.push("NEXTAUTH_URL ou NEXT_PUBLIC_APP_URL requis pour les redirect URIs");

  return {
    enabled,
    clientIdSet: Boolean(id),
    clientSecretSet: Boolean(secret),
    redirectUris,
    issues,
  };
}
