"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

const PLACEHOLDERS = [
  "Sahara en famille, 10 jours, budget 1800 €/pers…",
  "Culture et médinas au Maroc en avril…",
  "Circuit désert Tunisie, 6 voyageurs…",
];

export default function HomeAiLauncher() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [placeholder, setPlaceholder] = useState(PLACEHOLDERS[0]);

  useEffect(() => {
    setPlaceholder(
      PLACEHOLDERS[Math.floor(Date.now() / 8000) % PLACEHOLDERS.length]
    );
  }, []);

  const launch = (mode: "chat" | "form") => {
    const text = prompt.trim();
    if (text) {
      sessionStorage.setItem("home_ai_prompt", text);
    }
    router.push(mode === "chat" ? "/recherche?mode=chat" : "/recherche");
  };

  return (
    <div className="w-full max-w-xl mx-auto lg:mx-0 mt-8 p-6 md:p-8 rounded-[2rem] bg-[#0F172A] text-white shadow-2xl border border-white/10">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400 mb-3">
        Matching IA · catalogue réel
      </p>
      <p className="text-sm text-gray-300 font-medium mb-4 leading-relaxed">
        Décrivez votre voyage en une phrase — notre IA structure la demande et note chaque
        voyage publié (seuil 6/18).
      </p>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={2}
        placeholder={placeholder}
        className="w-full bg-white/10 border border-white/15 rounded-2xl px-5 py-4 text-sm font-medium text-white placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-orange-500/40 resize-none"
      />
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <button
          type="button"
          onClick={() => launch("chat")}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white font-black px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all active:scale-[0.98]"
        >
          <Sparkles size={14} /> Lancer l&apos;assistant
        </button>
        <button
          type="button"
          onClick={() => launch("form")}
          className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 border border-white/15 font-black px-6 py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all"
        >
          Formulaire guidé <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
