/**
 * RBAC — Utilitaires côté serveur (Server Components & API Routes)
 *
 * Usage dans un API Route :
 *   const { session, error } = await requireAuth(["CLIENT", "ADMIN"]);
 *   if (error) return error;
 *
 * Usage dans un Server Component :
 *   const session = await getRequiredSession("ADMIN", "/admin/login");
 */

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth-options";

export type UserRole = "CLIENT" | "AGENCY" | "ADMIN";

// ─── API Routes ────────────────────────────────────────────────────────────

/**
 * Vérifie l'authentification et le rôle dans un API Route.
 * Retourne { session, error: null } si autorisé, sinon { session, error: NextResponse }.
 */
export async function requireAuth(allowedRoles?: UserRole[]) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Non authentifié. Veuillez vous connecter." },
        { status: 401 }
      ),
    };
  }

  const role = session.user.role as UserRole;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return {
      session,
      error: NextResponse.json(
        { error: `Accès refusé. Rôle requis : ${allowedRoles.join(" ou ")}.` },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}

// Raccourcis sémantiques
export const requireClient = () => requireAuth(["CLIENT"]);
export const requireAgency = () => requireAuth(["AGENCY"]);
export const requireAdmin  = () => requireAuth(["ADMIN"]);
export const requireClientOrAdmin = () => requireAuth(["CLIENT", "ADMIN"]);

// ─── Server Components ─────────────────────────────────────────────────────

/**
 * Dans un Server Component, récupère la session et redirige si non autorisé.
 */
export async function getRequiredSession(
  allowedRole?: UserRole | UserRole[],
  redirectTo?: string
) {
  const session = await getServerSession(authOptions);
  const roles = Array.isArray(allowedRole) ? allowedRole : allowedRole ? [allowedRole] : null;

  if (!session?.user?.id) {
    const loginPage = redirectTo ?? getLoginPage(roles?.[0]);
    redirect(loginPage);
  }

  const role = session.user.role as UserRole;

  if (roles && !roles.includes(role)) {
    redirect(getDashboard(role));
  }

  return session;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getLoginPage(role?: UserRole): string {
  if (role === "ADMIN") return "/admin/login";
  if (role === "AGENCY") return "/agency/login";
  return "/login";
}

export function getDashboard(role: UserRole): string {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "AGENCY") return "/agency/dashboard";
  return "/profile";
}

/**
 * Vérifie si un utilisateur est propriétaire d'une ressource ou est admin.
 * Utile pour les vérifications resource-level (ex: agence peut modifier seulement ses propres voyages).
 */
export function isOwnerOrAdmin(
  userId: string,
  resourceOwnerId: string,
  role: UserRole
): boolean {
  return role === "ADMIN" || userId === resourceOwnerId;
}

/**
 * Vérifie si une agence est validée (statut VERIFIED).
 * Les agences non validées ne peuvent pas créer/publier des voyages.
 */
export function isAgencyVerified(verificationStatus: string): boolean {
  return verificationStatus === "VERIFIED";
}
