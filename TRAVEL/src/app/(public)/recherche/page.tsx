"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import MultiStepSearch from "@/components/ai/MultiStepSearch";
import GuideTouristiqueIA from "@/components/ai/GuideTouristiqueIA";
import { LoginLink } from "@/components/auth/LoginLink";
import { ArrowLeft, ListChecks, MessageCircle, Bot } from "lucide-react";
import Link from "next/link";

function RechercheContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"form" | "chat">("form");
  const isClient = session?.user?.role === "CLIENT";

  useEffect(() => {
    if (searchParams.get("mode") === "chat") {
      setMode("chat");
    }
  }, [searchParams]);

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
      <div className="mb-12 text-center md:text-left">
        <Link
          href="/"
          prefetch={false}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-600 font-black uppercase tracking-widest text-[10px] mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Retour à l&apos;accueil
        </Link>
        <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight mb-4">
          Trouver mon <span className="text-orange-500">voyage.</span>
        </h1>
        <p className="text-gray-500 font-medium max-w-xl">
          {mode === "chat"
            ? "Assistant de matching : il structure votre demande et propose les voyages publiés qui correspondent (score IA)."
            : "Formulaire guidé — même moteur de matching, avec enregistrement de votre demande par email."}
        </p>
        {isClient ? (
          <Link
            href="/profile"
            prefetch={false}
            onClick={() => {
              if (typeof window !== "undefined") {
                sessionStorage.setItem("profile_tab", "guide-ia");
              }
            }}
            className="inline-flex items-center gap-2 mt-4 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700"
          >
            <Bot size={14} />
            Guide personnel → onglet Profil
          </Link>
        ) : (
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-4">
            <LoginLink className="text-orange-600 hover:underline">
              Connectez-vous
            </LoginLink>{" "}
            pour le conseiller mémorisé dans votre profil.
          </p>
        )}
      </div>

      <div className="flex gap-3 mb-10">
        <button
          type="button"
          onClick={() => setMode("form")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === "form"
              ? "bg-orange-600 text-white shadow-lg"
              : "bg-white text-gray-400 border border-gray-100"
          }`}
        >
          <ListChecks size={14} /> Formulaire guidé
        </button>
        <button
          type="button"
          onClick={() => setMode("chat")}
          className={`flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
            mode === "chat"
              ? "bg-orange-600 text-white shadow-lg"
              : "bg-white text-gray-400 border border-gray-100"
          }`}
        >
          <MessageCircle size={14} /> Assistant conversationnel
        </button>
      </div>

      {mode === "form" ? <MultiStepSearch /> : <GuideTouristiqueIA />}
    </div>
  );
}

export default function RecherchePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto px-6 py-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
          Chargement…
        </div>
      }
    >
      <RechercheContent />
    </Suspense>
  );
}
