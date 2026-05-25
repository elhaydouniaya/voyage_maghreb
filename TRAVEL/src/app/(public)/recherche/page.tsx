"use client";

import { useState } from "react";
import MultiStepSearch from "@/components/ai/MultiStepSearch";
import GuideTouristiqueIA from "@/components/ai/GuideTouristiqueIA";
import { ArrowLeft, ListChecks, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function RecherchePage() {
  const [mode, setMode] = useState<"form" | "chat">("chat");

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
      <div className="mb-12 text-center md:text-left">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-600 font-black uppercase tracking-widest text-[10px] mb-8 transition-colors"
        >
          <ArrowLeft size={14} /> Retour à l&apos;accueil
        </Link>
        <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight mb-4">
          Trouver mon <span className="text-orange-500">voyage.</span>
        </h1>
        <p className="text-gray-500 font-medium max-w-xl">
          {mode === "chat"
            ? "Échangez avec notre assistant — il comprend votre projet et vous propose les voyages disponibles à la réservation."
            : "Remplissez le formulaire en quelques étapes — notre IA vous propose les meilleurs voyages disponibles à la réservation."}
        </p>
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
