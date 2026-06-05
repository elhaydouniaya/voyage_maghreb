"use client";

import { Brain, Gauge, Sparkles, Check } from "lucide-react";

const STEPS = [
  {
    id: 1,
    icon: Brain,
    title: "Structuration IA",
    detail: "LLM extrait destination, budget, style",
  },
  {
    id: 2,
    icon: Gauge,
    title: "Score catalogue",
    detail: "Chaque voyage noté sur 18 pts (CDC)",
  },
  {
    id: 3,
    icon: Sparkles,
    title: "Matches qualifiés",
    detail: "Seuil ≥ 6 pts — sinon suggestions",
  },
] as const;

type Props = {
  /** 0 = avant analyse, 1–3 = étape en cours, 4 = terminé */
  activeStep?: number;
  compact?: boolean;
  matchMode?: "qualified" | "fallback" | null;
  qualifiedCount?: number;
};

export default function AiMatchPipeline({
  activeStep = 0,
  compact = false,
  matchMode = null,
  qualifiedCount,
}: Props) {
  const done = activeStep >= 4;

  return (
    <div
      className={`rounded-[2rem] border ${
        compact ? "p-4 bg-[#F8FAFC] border-gray-100" : "p-6 md:p-8 bg-[#0F172A] border-white/10"
      }`}
    >
      <p
        className={`text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${
          compact ? "text-gray-400" : "text-orange-400"
        }`}
      >
        Chaîne IA → matching
      </p>
      <ol className={`grid gap-3 ${compact ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 md:grid-cols-3"}`}>
        {STEPS.map((step) => {
          const Icon = step.icon;
          const isActive = !done && activeStep === step.id;
          const isComplete = done || activeStep > step.id;
          return (
            <li
              key={step.id}
              className={`flex gap-3 rounded-2xl p-4 transition-all ${
                compact
                  ? isComplete
                    ? "bg-orange-50 border border-orange-100"
                    : isActive
                      ? "bg-white border-2 border-orange-400 shadow-md"
                      : "bg-white border border-gray-100 opacity-60"
                  : isComplete
                    ? "bg-white/10 border border-white/20"
                    : isActive
                      ? "bg-orange-600/30 border border-orange-500/50 ring-2 ring-orange-500/30"
                      : "bg-white/5 border border-white/10 opacity-50"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isComplete
                    ? "bg-orange-600 text-white"
                    : isActive
                      ? "bg-orange-500 text-white animate-pulse"
                      : compact
                        ? "bg-gray-100 text-gray-400"
                        : "bg-white/10 text-gray-500"
                }`}
              >
                {isComplete ? <Check size={18} /> : <Icon size={18} />}
              </div>
              <div className="min-w-0 text-left">
                <p
                  className={`text-xs font-black ${
                    compact ? "text-[#0F172A]" : "text-white"
                  }`}
                >
                  {step.id}. {step.title}
                </p>
                <p
                  className={`text-[10px] mt-0.5 leading-snug ${
                    compact ? "text-gray-500" : "text-gray-400"
                  }`}
                >
                  {step.detail}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
      {done && matchMode && (
        <p
          className={`mt-4 text-xs font-bold ${
            compact ? "text-orange-700" : "text-orange-300"
          }`}
        >
          {matchMode === "qualified"
            ? `✓ ${qualifiedCount ?? "—"} voyage(s) qualifié(s) (score ≥ 6/18)`
            : "○ Mode suggestion — prochains départs (aucun seuil atteint)"}
        </p>
      )}
    </div>
  );
}
