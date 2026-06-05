import { getSession, signIn, signOut } from "next-auth/react";
import { sanitizeCallbackUrl } from "@/lib/auth-redirect";

export type UserRole = "CLIENT" | "AGENCY" | "ADMIN";

const ROLE_HOME: Record<UserRole, string> = {
  CLIENT: "/profile",
  AGENCY: "/agency/dashboard",
  ADMIN: "/admin/dashboard",
};

function readRole(session: Awaited<ReturnType<typeof getSession>>): UserRole | null {
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (role === "CLIENT" || role === "AGENCY" || role === "ADMIN") return role;
  return null;
}

/**
 * Clears stale JWT, signs in, waits for session cookie, redirects to the right home.
 */
export async function loginWithFreshSession(
  email: string,
  password: string,
  options?: { requiredRole?: UserRole; openGuide?: boolean; callbackUrl?: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  await signOut({ redirect: false });
  await new Promise((r) => setTimeout(r, 150));

  const result = await signIn("credentials", {
    email: email.trim().toLowerCase(),
    password: password.trim(),
    redirect: false,
  });

  if (result?.error || result?.ok === false) {
    return { ok: false, error: "Identifiants incorrects." };
  }

  let role: UserRole | null = null;
  for (let i = 0; i < 20; i++) {
    const session = await getSession();
    role = readRole(session);
    if (role && (!options?.requiredRole || role === options.requiredRole)) {
      break;
    }
    await new Promise((r) => setTimeout(r, 250));
  }

  if (!role) {
    await signOut({ redirect: false });
    return { ok: false, error: "Session invalide. Réessayez." };
  }

  if (options?.requiredRole && role !== options.requiredRole) {
    await signOut({ redirect: false });
    if (options.requiredRole === "CLIENT") {
      if (role === "ADMIN") {
        return {
          ok: false,
          error: "Compte administrateur. Utilisez la page de connexion admin.",
        };
      }
      if (role === "AGENCY") {
        return {
          ok: false,
          error: "Compte agence. Utilisez l'espace agence pour vous connecter.",
        };
      }
    }
    if (options.requiredRole === "AGENCY") {
      if (role === "ADMIN") {
        return {
          ok: false,
          error:
            "Compte administrateur. Utilisez /admin/login — pas l'espace agence.",
        };
      }
      return {
        ok: false,
        error:
          "Compte voyageur. Inscrivez-vous sur « Devenir partenaire » avec le même email.",
      };
    }
    if (options.requiredRole === "ADMIN") {
      if (role === "CLIENT") {
        return {
          ok: false,
          error: "Compte voyageur. Utilisez /login (client@test.com).",
        };
      }
      if (role === "AGENCY") {
        return {
          ok: false,
          error: "Compte agence. Utilisez /agency/login.",
        };
      }
    }
    return { ok: false, error: "Type de compte non autorisé sur cette page." };
  }

  const roleHome = options?.requiredRole ? ROLE_HOME[options.requiredRole] : ROLE_HOME[role];
  const guideDest = "/profile?tab=guide-ia";
  const destination = options?.callbackUrl
    ? sanitizeCallbackUrl(options.callbackUrl, roleHome)
    : options?.requiredRole === "CLIENT" && options.openGuide
      ? guideDest
      : roleHome;

  if (destination.includes("tab=guide-ia") && typeof window !== "undefined") {
    sessionStorage.setItem("profile_tab", "guide-ia");
  } else if (options?.openGuide && typeof window !== "undefined") {
    sessionStorage.setItem("profile_tab", "guide-ia");
  }

  window.location.href = destination;
  return { ok: true };
}
