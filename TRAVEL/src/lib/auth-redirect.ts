/** Safe post-login redirect — internal paths only. */
export function sanitizeCallbackUrl(
  raw: string | null | undefined,
  fallback = "/"
): string {
  if (!raw?.trim()) return fallback;
  try {
    const path = decodeURIComponent(raw.trim());
    if (!path.startsWith("/") || path.startsWith("//")) return fallback;
    if (
      path.startsWith("/login") ||
      path.startsWith("/register") ||
      path.startsWith("/api/")
    ) {
      return fallback;
    }
    return path;
  } catch {
    return fallback;
  }
}

export function buildLoginHref(
  pathname: string,
  search = "",
  fallback?: string
): string {
  const current = fallback ?? `${pathname}${search ? `?${search}` : ""}`;
  const callback = sanitizeCallbackUrl(current);
  return `/login?callbackUrl=${encodeURIComponent(callback)}`;
}

export function appendCallbackToLoginPath(
  loginPath: string,
  returnPath: string
): string {
  const callback = sanitizeCallbackUrl(returnPath);
  const sep = loginPath.includes("?") ? "&" : "?";
  return `${loginPath}${sep}callbackUrl=${encodeURIComponent(callback)}`;
}
