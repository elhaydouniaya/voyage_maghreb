"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, Bot, Compass } from "lucide-react";
import Link from "next/link";
import { trackBehaviorEvent } from "@/components/analytics/BehaviorTracker";

type ChatMessage = { role: "bot" | "user"; content: string };

type GuideEngine = {
  label: string;
  model: string | null;
  provider: string;
};

type AIChatWidgetProps = {
  variant?: "floating" | "embedded";
};

const AIChatWidget = ({ variant = "floating" }: AIChatWidgetProps) => {
  const embedded = variant === "embedded";
  const [isOpen, setIsOpen] = useState(embedded);
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [guideMode, setGuideMode] = useState<"llm" | "offline" | "loading">("loading");
  const [engine, setEngine] = useState<GuideEngine | null>(null);
  const [profileHint, setProfileHint] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const applyEngine = useCallback((data: Partial<GuideEngine> | undefined) => {
    if (!data?.label) return;
    setEngine({
      label: String(data.label),
      model: data.model ? String(data.model) : null,
      provider: String(data.provider || "offline"),
    });
  }, []);

  const loadFromServer = useCallback(async () => {
    if (status !== "authenticated" || session?.user?.role !== "CLIENT") return;

    setGuideMode("loading");
    setError("");
    try {
      const res = await fetch("/api/ai/guide-chat", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de charger le guide.");
        setGuideMode("offline");
        return;
      }

      const serverMessages: ChatMessage[] = (data.messages || []).map(
        (m: { role: string; content: string }) => ({
          role: m.role === "user" ? "user" : "bot",
          content: m.content,
        })
      );

      setMessages(serverMessages);
      setSuggestions(data.suggestions || []);

      const dests = data.profile?.preferredDestinations || [];
      if (dests.length > 0) {
        setProfileHint(dests.join(" · "));
      }

      setGuideMode(data.mode === "llm" ? "llm" : "offline");
      applyEngine(data.engine);
    } catch {
      setError("Connexion au guide impossible.");
      setGuideMode("offline");
    }
  }, [session?.user?.role, status, applyEngine]);

  useEffect(() => {
    if (status !== "authenticated" || session?.user?.role !== "CLIENT") return;

    let cancelled = false;
    fetch("/api/user/ai-status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        applyEngine({
          label: data.providerLabel,
          model: data.model,
          provider: data.activeProvider,
        });
        if (data.configured) setGuideMode("llm");
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.role, session?.user?.id, applyEngine]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "authenticated" && session?.user?.role === "CLIENT") {
      void loadFromServer();
      return;
    }

    if (status === "unauthenticated") {
      setMessages([
        {
          role: "bot",
          content:
            "Connectez-vous avec un compte voyageur pour un guide personnalisé qui mémorise vos préférences.",
        },
      ]);
      setSuggestions([]);
      setProfileHint("");
      setGuideMode("offline");
      setEngine(null);
    }
  }, [status, session?.user?.role, session?.user?.id, loadFromServer]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isTyping) return;

    if (status !== "authenticated" || session?.user?.role !== "CLIENT") {
      setError("Connectez-vous en tant que voyageur pour utiliser le guide.");
      return;
    }

    setError("");
    const userMsg: ChatMessage = { role: "user", content: messageText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    try {
      const apiMessages = nextMessages.map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("assistant" as const),
        content: m.content,
      }));

      const res = await fetch("/api/ai/guide-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Réponse impossible.");
        setIsTyping(false);
        return;
      }

      setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
      setSuggestions(data.suggestions || []);
      setGuideMode(data.mode === "llm" ? "llm" : "offline");
      applyEngine(data.engine);
      trackBehaviorEvent("GUIDE_CHAT", {
        mode: data.mode ?? "offline",
        provider: data.engine?.provider,
      });

      const dests = data.profile?.preferredDestinations || [];
      if (dests.length > 0) setProfileHint(dests.join(" · "));
    } catch {
      setError("Connexion au guide impossible.");
    } finally {
      setIsTyping(false);
    }
  };

  const statusLine =
    guideMode === "loading"
      ? "Connexion…"
      : guideMode === "llm"
        ? engine?.label
          ? `IA ${engine.label}`
          : "Conseiller en ligne"
        : "Mode local";

  const panel = (
    <div
      className={
        embedded
          ? "w-full min-h-[520px] h-[min(680px,72vh)] bg-white rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col overflow-hidden relative"
          : "absolute bottom-24 right-0 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[70vh] bg-white rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 duration-500"
      }
    >
      {embedded && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.04]"
          aria-hidden
        >
          <Compass size={200} className="text-orange-600" />
        </div>
      )}

      <div className="relative z-10 bg-[#0F172A] px-6 py-5 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <Bot size={22} />
          </div>
          <div className="min-w-0">
            <h4 className="font-black text-sm tracking-tight">Conseiller Maghreb</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  guideMode === "llm"
                    ? "bg-emerald-400 animate-pulse"
                    : guideMode === "loading"
                      ? "bg-amber-400 animate-pulse"
                      : "bg-sky-400"
                }`}
              />
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 truncate">
                {statusLine}
              </span>
            </div>
            {profileHint && (
              <p className="text-[9px] text-orange-300/90 mt-1 truncate max-w-[240px]">
                {profileHint}
              </p>
            )}
            {guideMode === "llm" && engine?.model && (
              <p className="text-[8px] text-gray-500 mt-0.5 truncate max-w-[240px] font-mono">
                {engine.model}
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto p-6 space-y-4 bg-[#F8FAFC]/80 scroll-smooth"
      >
        {guideMode === "loading" && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.15s]" />
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce [animation-delay:0.3s]" />
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Ouverture de la conversation…
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-300`}
          >
            {msg.role === "bot" && (
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mr-2 shrink-0 self-end mb-1">
                <Bot size={16} />
              </div>
            )}
            <div
              className={`max-w-[82%] px-4 py-3.5 text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-[#0F172A] text-white rounded-[1.25rem] rounded-br-md"
                  : "bg-white border border-gray-100 text-[#0F172A] rounded-[1.25rem] rounded-bl-md shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mr-2 shrink-0">
              <Bot size={16} />
            </div>
            <div className="bg-white border border-gray-100 px-5 py-4 rounded-[1.25rem] rounded-bl-md flex gap-1.5 shadow-sm">
              <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        {error && (
          <p className="text-red-600 text-xs font-semibold text-center bg-red-50 py-2 px-3 rounded-xl">
            {error}
          </p>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="relative z-10 px-5 pb-2 flex flex-wrap gap-2 border-t border-gray-50 pt-4 bg-white">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSend(s)}
              disabled={isTyping}
              className="text-[9px] font-black uppercase tracking-wide px-3 py-2 rounded-full bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100 disabled:opacity-50 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="relative z-10 p-5 md:p-6 bg-white border-t border-gray-100 shrink-0">
        <div className="relative max-w-3xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ex. : circuit Sahara en famille, budget 2000 €/pers…"
            title="Votre message au guide"
            className="w-full bg-[#F8FAFC] border border-gray-200 rounded-2xl pl-5 pr-14 py-4 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300 transition-all"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isTyping || !input.trim()}
            title="Envoyer"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-orange-600 text-white rounded-xl flex items-center justify-center hover:bg-orange-700 transition-all disabled:opacity-40 shadow-lg shadow-orange-600/20"
          >
            <Send size={16} />
          </button>
        </div>
        <p className="mt-3 text-[9px] text-gray-400 font-bold text-center uppercase tracking-widest">
          Vos préférences sont enregistrées sur votre compte
        </p>
        <Link
          href="/recherche"
          prefetch={false}
          className="mt-3 w-full max-w-3xl mx-auto flex bg-[#F8FAFC] text-[#0F172A] py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center border border-gray-100 hover:border-orange-300 hover:text-orange-600 transition-all items-center justify-center gap-2"
        >
          <Compass size={14} /> Trouver mon voyage (matching)
        </Link>
      </div>
    </div>
  );

  if (embedded) {
    return <div className="font-outfit">{panel}</div>;
  }

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-outfit">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Fermer le guide" : "Ouvrir le guide touristique"}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 ${
          isOpen ? "bg-[#0F172A] text-white rotate-90" : "bg-orange-600 text-white"
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>
      {isOpen && panel}
    </div>
  );
};

export { AIChatWidget };
export default AIChatWidget;
