"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { buildLoginHref } from "@/lib/auth-redirect";
import { Compass, Bot, ArrowRight } from "lucide-react";

function openGuideProfile() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("profile_tab", "guide-ia");
  }
}

export default function ProductPaths() {
  const { data: session, status } = useSession();
  const isClient =
    status === "authenticated" && session?.user?.role === "CLIENT";

  return (
    <section className="py-20 px-6 bg-[#F8FAFC] border-y border-gray-100">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-6">
        <Link
          href="/recherche"
          className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 md:p-10 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-500"
        >
          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-600/20 group-hover:scale-105 transition-transform">
            <Compass size={24} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2">
            Public · tous les visiteurs
          </p>
          <h3 className="text-2xl font-black text-[#0F172A] mb-3 tracking-tight">
            Trouver mon voyage
          </h3>
          <p className="text-gray-500 font-medium text-sm leading-relaxed mb-6">
            Assistant de matching : formulaire ou chat guidé, score IA sur les voyages
            publiés, réservation directe.
          </p>
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0F172A] group-hover:text-orange-600">
            Lancer la recherche <ArrowRight size={14} />
          </span>
        </Link>

        <Link
          href={
            isClient
              ? "/profile"
              : buildLoginHref("", "", "/profile?tab=guide-ia")
          }
          onClick={isClient ? openGuideProfile : undefined}
          className="group bg-[#0F172A] rounded-[2.5rem] border border-[#0F172A] p-8 md:p-10 shadow-xl hover:shadow-2xl transition-all duration-500"
        >
          <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-105 transition-transform">
            <Bot size={24} />
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-2">
            Compte voyageur
          </p>
          <h3 className="text-2xl font-black text-white mb-3 tracking-tight">
            Guide personnel IA
          </h3>
          <p className="text-gray-400 font-medium text-sm leading-relaxed mb-6">
            {isClient
              ? "Conseils mémorisés et réponses personnalisées — ouvrez le chat depuis votre profil ou le bouton flottant."
              : "Après connexion : conseils mémorisés, catalogue réel injecté, réponses personnalisées."}
          </p>
          <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-400 group-hover:text-orange-300">
            {isClient ? (
              <>
                Ouvrir mon guide <ArrowRight size={14} />
              </>
            ) : (
              <>
                Se connecter <ArrowRight size={14} />
              </>
            )}
          </span>
        </Link>
      </div>
    </section>
  );
}
