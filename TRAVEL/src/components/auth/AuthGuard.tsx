"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Globe } from "lucide-react";

type UserRole = "CLIENT" | "AGENCY" | "ADMIN";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Rôle(s) autorisé(s). Omis = tout utilisateur authentifié. */
  requiredRole?: UserRole | UserRole[];
  /** Page de redirection si non autorisé. Déduit du rôle par défaut. */
  redirectTo?: string;
  /** Contenu affiché pendant le chargement */
  loadingFallback?: React.ReactNode;
}

/**
 * Wrappeur côté client qui protège un sous-arbre de composants.
 * Redirige automatiquement si l'utilisateur n'est pas autorisé.
 *
 * Usage :
 *   <AuthGuard requiredRole="CLIENT">
 *     <BookingPage />
 *   </AuthGuard>
 */
export function AuthGuard({
  children,
  requiredRole,
  redirectTo,
  loadingFallback,
}: AuthGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const role = session?.user?.role as UserRole;

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      const roles = Array.isArray(requiredRole) ? requiredRole : requiredRole ? [requiredRole] : [];
      const loginPage =
        redirectTo ??
        (roles.includes("ADMIN")
          ? "/admin/login"
          : roles.includes("AGENCY")
          ? "/agency/login"
          : "/login");
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

  if (status === "loading") {
    return (
      <>
        {loadingFallback ?? (
          <div className="fixed inset-0 bg-white flex flex-col items-center justify-center gap-4 font-outfit">
            <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center shadow-xl animate-pulse">
              <Globe size={28} className="text-white" />
            </div>
            <p className="text-sm font-bold text-gray-400 animate-pulse">Vérification des accès…</p>
          </div>
        )}
      </>
    );
  }

  if (!session) return null;

  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(role)) return null;
  }

  return <>{children}</>;
}
