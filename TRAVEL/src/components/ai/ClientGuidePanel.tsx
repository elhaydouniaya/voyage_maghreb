"use client";

import { useEffect, useState } from "react";
import { Bot, MapPin, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import AIChatWidget from "@/components/ai/AIChatWidget";

type AiStatus = {
  configured: boolean;
  providerLabel: string;
  model: string | null;
};

export default function ClientGuidePanel() {
  const [aiStatus, setAiStatus] = useState<AiStatus | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadAiStatus() {
      try {
        const res = await fetch("/api/user/ai-status", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        if (cancelled) return;
        setAiStatus({
          configured: Boolean(data.configured),
          providerLabel: String(data.providerLabel || "Conseiller local"),
          model: data.model ? String(data.model) : null,
        });
      } catch {
        /* non-blocking */
      }
    }

    loadAiStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/25">
            <Bot size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">
              Votre conseiller voyage
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1 max-w-lg leading-relaxed">
              Posez vos questions sur le Maghreb — le guide retient vos préférences et
              vous oriente vers les bons départs.
            </p>
          </div>
        </div>

        {aiStatus && (
          <div
            className={`shrink-0 px-4 py-2.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${
              aiStatus.configured
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-amber-50 text-amber-700 border-amber-100"
            }`}
            title={aiStatus.model ? `${aiStatus.providerLabel} (${aiStatus.model})` : aiStatus.providerLabel}
          >
            {aiStatus.configured ? "Moteur IA actif" : "Mode local"}
          </div>
        )}

        <Link
          href="/recherche"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 bg-orange-50 border border-orange-100 px-4 py-2.5 rounded-full transition-colors shrink-0"
        >
          Trouver un voyage <ArrowRight size={14} />
        </Link>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: <Sparkles size={16} className="text-orange-500" />,
            title: "Sur mesure",
            text: "Budget, style et destinations mémorisés sur votre compte.",
          },
          {
            icon: <MapPin size={16} className="text-emerald-500" />,
            title: "Catalogue réel",
            text: "Conseils basés sur les voyages publiés par nos agences.",
          },
          {
            icon: <Bot size={16} className="text-sky-500" />,
            title: "Disponible 24h/24",
            text: "Réponses instantanées, où que vous soyez dans votre réflexion.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center gap-2 mb-2">
              {item.icon}
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                {item.title}
              </span>
            </div>
            <p className="text-sm text-gray-600 font-medium leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>

      <AIChatWidget variant="embedded" />
    </div>
  );
}
