/**
 * RBAC — Utilitaires côté client (Client Components & hooks)
 *
 * Usage :
 *   const { role, isClient, isAgency, isAdmin, isLoggedIn } = useRole();
 *   const can = usePermissions();
 *   if (can.book) { ... }
 */

"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export type UserRole = "CLIENT" | "AGENCY" | "ADMIN";

// ─── Hook principal ─────────────────────────────────────────────────────────

export function useRole() {
  const { data: session, status } = useSession();
  const role = (session?.user?.role as UserRole) ?? null;

  return {
    role,
    isLoggedIn: !!session?.user,
    isLoading: status === "loading",
    isClient: role === "CLIENT",
    isAgency: role === "AGENCY",
    isAdmin: role === "ADMIN",
    isGuest: !session?.user,
    userId: session?.user?.id ?? null,
    userName: session?.user?.name ?? null,
    userEmail: session?.user?.email ?? null,
  };
}

// ─── Hook de permissions ─────────────────────────────────────────────────────

export function usePermissions() {
  const { role, isLoggedIn } = useRole();

  return {
    // Voyageur
    canBook: isLoggedIn && role === "CLIENT",
    canFavorite: isLoggedIn && role === "CLIENT",
    canReview: isLoggedIn && role === "CLIENT",
    canViewAiHistory: isLoggedIn && role === "CLIENT",
    canUseFullChatbot: isLoggedIn && role === "CLIENT",
    canViewProfile: isLoggedIn && role === "CLIENT",

    // Agence
    canCreateTrip: role === "AGENCY",
    canManageTrips: role === "AGENCY",
    canViewAgencyBookings: role === "AGENCY",
    canGenerateMagicLinks: role === "AGENCY",

    // Admin
    canManageAgencies: role === "ADMIN",
    canManageUsers: role === "ADMIN",
    canViewStats: role === "ADMIN",
    canModerateReviews: role === "ADMIN",

    // Public (tout le monde)
    canViewTrips: true,
    canUseChatbotBasic: true,
  };
}

// ─── Hook de redirection sécurisée ──────────────────────────────────────────

interface UseAuthGuardOptions {
  requiredRole?: UserRole | UserRole[];
  redirectTo?: string;
}

export function useAuthGuard({ requiredRole, redirectTo }: UseAuthGuardOptions = {}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = session?.user?.role as UserRole;

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      const roles = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : [];
      const loginPage = redirectTo ?? (
        roles.includes("ADMIN") ? "/admin/login" :
        roles.includes("AGENCY") ? "/agency/login" : "/login"
      );
      router.push(loginPage);
      return;
    }

    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!roles.includes(role)) {
        if (role === "ADMIN") router.push("/admin/dashboard");
        else if (role === "AGENCY") router.push("/agency/dashboard");
        else router.push("/");
      }
    }
  }, [session, status, requiredRole, redirectTo, router, role]);

  return {
    isLoading: status === "loading",
    isAuthorized: !!session && (!requiredRole || (Array.isArray(requiredRole) ? requiredRole : [requiredRole]).includes(role)),
  };
}
