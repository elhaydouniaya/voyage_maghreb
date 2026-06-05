"use client";

import { useEffect, useState } from "react";
import { Mic } from "lucide-react";

/**
 * Bouton vocal VAPI — affiché uniquement si les clés publiques sont configurées.
 * Configurez l'assistant sur https://dashboard.vapi.ai avec les tools :
 * search_trips, save_travel_request → POST /api/vapi/webhook
 */
export default function VapiVoiceButton() {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim();
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID?.trim();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!publicKey || !assistantId) return;

    const existing = document.querySelector('script[data-vapi-widget="1"]');
    if (existing) {
      setReady(true);
      return;
    }

    const script = document.createElement("script");
    script.src =
      "https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js";
    script.async = true;
    script.dataset.vapiWidget = "1";
    script.onload = () => setReady(true);
    document.body.appendChild(script);

    const widget = document.createElement("vapi-widget");
    widget.setAttribute("public-key", publicKey);
    widget.setAttribute("assistant-id", assistantId);
    widget.setAttribute("mode", "voice");
    widget.setAttribute("theme", "light");
    widget.setAttribute("size", "compact");
    widget.setAttribute("color-accent", "#ea580c");
    widget.setAttribute("position", "bottom-right");
    widget.setAttribute("title", "Guide vocal Maghreb");
    widget.setAttribute("cta-title", "Parler au guide");
    widget.style.display = "none";
    document.body.appendChild(widget);

    return () => {
      script.remove();
      widget.remove();
    };
  }, [publicKey, assistantId]);

  if (!publicKey || !assistantId) return null;

  const openVoice = () => {
    const el = document.querySelector("vapi-widget") as HTMLElement & {
      start?: () => void;
      click?: () => void;
    };
    el?.click?.();
    el?.start?.();
  };

  return (
    <button
      type="button"
      onClick={openVoice}
      disabled={!ready}
      title="Guide vocal IA (VAPI)"
      className="fixed bottom-28 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#0F172A] text-white shadow-xl border-2 border-orange-500/30 hover:bg-orange-600 transition-all disabled:opacity-50 md:bottom-32 md:right-8"
      aria-label="Ouvrir le guide vocal"
    >
      <Mic size={22} />
    </button>
  );
}
