"use client";

import { useEffect } from "react";

const WIDGET_SCRIPT =
  "https://unpkg.com/@vapi-ai/client-sdk-react/dist/embed/widget.umd.js";

/**
 * Guide vocal VAPI — widget officiel (mode voice, bas-gauche pour ne pas chevaucher le chat).
 * Prérequis dans .env :
 *   NEXT_PUBLIC_VAPI_PUBLIC_KEY, NEXT_PUBLIC_VAPI_ASSISTANT_ID
 * Assistant VAPI → Server URL : {NEXT_PUBLIC_APP_URL}/api/vapi/webhook
 * Tools : search_trips, save_travel_request
 */
export default function VapiVoiceButton() {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY?.trim();
  const assistantId = process.env.NEXT_PUBLIC_VAPI_ASSISTANT_ID?.trim();

  useEffect(() => {
    if (!publicKey || !assistantId) return;

    let widget: HTMLElement | null = null;

    const mountWidget = () => {
      if (document.querySelector("vapi-widget[data-maghreb-voice='1']")) return;

      widget = document.createElement("vapi-widget");
      widget.setAttribute("data-maghreb-voice", "1");
      widget.setAttribute("public-key", publicKey);
      widget.setAttribute("assistant-id", assistantId);
      widget.setAttribute("mode", "voice");
      widget.setAttribute("theme", "light");
      widget.setAttribute("size", "compact");
      widget.setAttribute("color-accent", "#ea580c");
      widget.setAttribute("position", "bottom-left");
      widget.setAttribute("title", "Guide vocal Maghreb");
      widget.setAttribute("cta-title", "Parler au guide");
      widget.setAttribute("cta-subtitle", "FR · MaghrebVoyage");
      document.body.appendChild(widget);
    };

    const existingScript = document.querySelector('script[data-vapi-widget="1"]');
    if (existingScript) {
      mountWidget();
      return () => {
        widget?.remove();
      };
    }

    const script = document.createElement("script");
    script.src = WIDGET_SCRIPT;
    script.async = true;
    script.type = "text/javascript";
    script.dataset.vapiWidget = "1";
    script.onload = mountWidget;
    script.onerror = () => {
      console.error("[VAPI] Failed to load widget script");
    };
    document.body.appendChild(script);

    return () => {
      widget?.remove();
    };
  }, [publicKey, assistantId]);

  return null;
}
