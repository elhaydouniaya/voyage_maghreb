"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShieldOff, Globe, ArrowLeft, LogIn } from "lucide-react";

interface UnauthorizedPageProps {
  title?: string;
  description?: string;
}

/**
 * Page d'accès refusé générique.
 * Affiche un message clair avec les bonnes actions selon l'état de l'utilisateur.
 *
 * Usage dans un layout ou page :
 *   if (!hasAccess) return <UnauthorizedPage />;
 */
export function UnauthorizedPage({
  title = "Accès non autorisé",
  description = "Vous n'avez pas les droits nécessaires pour accéder à cette page.",
}: UnauthorizedPageProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;

  function getActionLabel() {
    if (!session) return "Se connecter";
    if (role === "AGENCY") return "Mon espace agence";
    if (role === "ADMIN") return "Mon panel admin";
    return "Retour à l'accueil";
  }

  function getActionHref() {
    if (!session) return "/login";
    if (role === "AGENCY") return "/agency/dashboard";
    if (role === "ADMIN") return "/admin/dashboard";
    return "/";
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 font-outfit">
      <div className="max-w-md w-full text-center">
        {/* Icône */}
        <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <ShieldOff size={36} className="text-orange-600" />
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-8 h-8 bg-orange-600 rounded-xl flex items-center justify-center">
            <Globe size={16} className="text-white" />
          </div>
          <span className="text-lg font-black text-[#0F172A]">
            Maghreb<span className="text-orange-600">Voyage</span>
          </span>
        </div>

        <h1 className="text-3xl font-black text-[#0F172A] mb-3">{title}</h1>
        <p className="text-gray-500 font-medium mb-8 leading-relaxed">{description}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-bold text-sm hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
          <button
            onClick={() => router.push(getActionHref())}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/25"
          >
            <LogIn size={16} />
            {getActionLabel()}
          </button>
        </div>

        {/* Liens portails si non connecté */}
        {!session && (
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col gap-2">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">
              Accéder à votre espace
            </p>
            <div className="flex justify-center gap-6">
              <button
                onClick={() => router.push("/login")}
                className="text-xs font-bold text-gray-500 hover:text-orange-600 transition-colors"
              >
                Voyageur
              </button>
              <button
                onClick={() => router.push("/agency/login")}
                className="text-xs font-bold text-gray-500 hover:text-orange-600 transition-colors"
              >
                Agence
              </button>
              <button
                onClick={() => router.push("/admin/login")}
                className="text-xs font-bold text-gray-500 hover:text-orange-600 transition-colors"
              >
                Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
