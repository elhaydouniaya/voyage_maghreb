"use client";

import { useSession } from "next-auth/react";

type UserRole = "CLIENT" | "AGENCY" | "ADMIN" | "guest";

interface RoleGateProps {
  children: React.ReactNode;
  /** Rôles autorisés à voir le contenu. "guest" = non authentifié. */
  allowedRoles: UserRole[];
  /** Contenu affiché si le rôle n'est pas autorisé (optionnel) */
  fallback?: React.ReactNode;
}

/**
 * Affiche/masque un bloc selon le rôle de l'utilisateur.
 * Ne redirige PAS — utiliser <AuthGuard> pour les redirections.
 *
 * Usage :
 *   <RoleGate allowedRoles={["CLIENT"]}>
 *     <BookButton />
 *   </RoleGate>
 *
 *   <RoleGate allowedRoles={["guest", "CLIENT"]} fallback={<AgencyView />}>
 *     <ClientView />
 *   </RoleGate>
 */
export function RoleGate({ children, allowedRoles, fallback }: RoleGateProps) {
  const { data: session } = useSession();
  const role: UserRole = (session?.user?.role as UserRole) ?? "guest";

  if (!allowedRoles.includes(role)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// ─── Raccourcis ──────────────────────────────────────────────────────────────

interface SimpleGateProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/** Visible uniquement pour les voyageurs connectés (CLIENT) */
export function ClientOnly({ children, fallback }: SimpleGateProps) {
  return (
    <RoleGate allowedRoles={["CLIENT"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/** Visible uniquement pour les agences connectées */
export function AgencyOnly({ children, fallback }: SimpleGateProps) {
  return (
    <RoleGate allowedRoles={["AGENCY"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/** Visible uniquement pour les administrateurs */
export function AdminOnly({ children, fallback }: SimpleGateProps) {
  return (
    <RoleGate allowedRoles={["ADMIN"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/** Visible uniquement pour les visiteurs non connectés */
export function GuestOnly({ children, fallback }: SimpleGateProps) {
  return (
    <RoleGate allowedRoles={["guest"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}

/** Visible pour tout utilisateur authentifié (peu importe le rôle) */
export function AuthenticatedOnly({ children, fallback }: SimpleGateProps) {
  return (
    <RoleGate allowedRoles={["CLIENT", "AGENCY", "ADMIN"]} fallback={fallback}>
      {children}
    </RoleGate>
  );
}
