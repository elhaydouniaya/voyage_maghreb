/**
 * Helpers de protection pour les API Routes (Next.js App Router).
 *
 * Usage dans un route handler :
 *
 *   import { guardClient, guardAgency, guardAdmin } from "@/lib/api-guard";
 *
 *   export async function POST(req: Request) {
 *     const { session, error } = await guardClient();
 *     if (error) return error;
 *     // session.user est garanti CLIENT ici
 *   }
 *
 *   // Vérification resource-level (agence = son propre voyage) :
 *   const { session, error } = await guardAgency();
 *   if (error) return error;
 *   const trip = await prisma.groupTrip.findUnique({ where: { id } });
 *   if (trip?.agencyId !== session.user.id) {
 *     return forbidden("Ce voyage ne vous appartient pas.");
 *   }
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import type { Session } from "next-auth";

type UserRole = "CLIENT" | "AGENCY" | "ADMIN";

interface GuardResult {
  session: Session & { user: { id: string; role: UserRole; email: string } };
  error: null;
}
interface GuardError {
  session: null;
  error: NextResponse;
}
type GuardReturn = GuardResult | GuardError;

// ─── Réponses d'erreur ────────────────────────────────────────────────────

export function unauthorized(message = "Non authentifié. Veuillez vous connecter.") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Accès refusé. Droits insuffisants.") {
  return NextResponse.json({ error: message }, { status: 403 });
}

// ─── Guards génériques ────────────────────────────────────────────────────

async function guard(allowedRoles?: UserRole[]): Promise<GuardReturn> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return { session: null, error: unauthorized() };
  }

  const role = session.user.role as UserRole;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return {
      session: null,
      error: forbidden(`Rôle requis : ${allowedRoles.join(" ou ")}. Rôle actuel : ${role}.`),
    };
  }

  return {
    session: session as GuardResult["session"],
    error: null,
  };
}

// ─── Exports sémantiques ──────────────────────────────────────────────────

/** Tout utilisateur authentifié (CLIENT, AGENCY ou ADMIN) */
export const guardAuth = () => guard();

/** Voyageur uniquement */
export const guardClient = () => guard(["CLIENT"]);

/** Agence uniquement */
export const guardAgency = () => guard(["AGENCY"]);

/** Administrateur uniquement */
export const guardAdmin = () => guard(["ADMIN"]);

/** Voyageur ou Administrateur */
export const guardClientOrAdmin = () => guard(["CLIENT", "ADMIN"]);

/** Agence ou Administrateur */
export const guardAgencyOrAdmin = () => guard(["AGENCY", "ADMIN"]);

// ─── Vérification resource-level ─────────────────────────────────────────

/**
 * Vérifie que l'utilisateur est soit le propriétaire de la ressource, soit admin.
 * À utiliser après un guard() réussi.
 */
export function assertOwnerOrAdmin(
  session: GuardResult["session"],
  resourceOwnerId: string,
  message = "Vous n'êtes pas autorisé à modifier cette ressource."
): NextResponse | null {
  if (session.user.role !== "ADMIN" && session.user.id !== resourceOwnerId) {
    return forbidden(message);
  }
  return null;
}
