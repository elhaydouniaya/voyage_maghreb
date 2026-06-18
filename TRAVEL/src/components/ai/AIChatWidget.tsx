"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, Bot, Sparkles, Compass, LogIn } from "lucide-react";
import Link from "next/link";

type ChatMessage = { role: "bot" | "user"; content: string };

const BASIC_WELCOME =
  "Bonjour ! Je suis votre guide MaghrebVoyage 🌍\n\nJe peux vous donner des infos générales sur nos destinations au Maghreb. Pour un guide personnalisé qui mémorise vos préférences, connectez-vous à votre compte voyageur !";

const AIChatWidget = () => {
  const { data: session, status } = useSession();
  const isClient = status === "authenticated" && session?.user?.role === "CLIENT";
  const isVisitor = status !== "loading" && !isClient;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [guideMode, setGuideMode] = useState<"openai" | "offline" | "loading">("loading");
  const [profileHint, setProfileHint] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadedRef = useRef(false);

  const loadFromServer = useCallback(async () => {
    if (!isClient) return;
    setGuideMode("loading");
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
      setMessages(serverMessages.length > 0 ? serverMessages : []);
      setSuggestions(data.suggestions || []);
      const dests = data.profile?.preferredDestinations || [];
      if (dests.length > 0) setProfileHint(dests.join(" · "));
      setGuideMode("offline");
    } catch {
      setError("Connexion au guide impossible.");
      setGuideMode("offline");
    }
  }, [isClient]);

  useEffect(() => {
    if (loadedRef.current) return;
    if (status === "loading") return;
    loadedRef.current = true;
    if (isClient) {
      loadFromServer();
    } else {
      setMessages([{ role: "bot", content: BASIC_WELCOME }]);
      setSuggestions(["Destinations au Maroc", "Voyager en Algérie", "Que faire en Tunisie ?"]);
      setGuideMode("offline");
    }
  }, [status, isClient, loadFromServer]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = (text || input).trim();
    if (!messageText || isTyping) return;

    setError("");
    const userMsg: ChatMessage = { role: "user", content: messageText };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setIsTyping(true);

    const apiMessages = nextMessages.map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));

    try {
      const endpoint = isClient ? "/api/ai/guide-chat" : "/api/ai/basic-chat";
      const res = await fetch(endpoint, {
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
      if (isClient) {
        setSuggestions(data.suggestions || []);
        setGuideMode(data.mode === "openai" ? "openai" : "offline");
        const dests = data.profile?.preferredDestinations || [];
        if (dests.length > 0) setProfileHint(dests.join(" · "));
      }
    } catch {
      setError("Connexion au guide impossible.");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-outfit">
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Fermer le guide" : "Ouvrir le guide touristique"}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 ${
          isOpen ? "bg-[#0F172A] text-white rotate-90" : "bg-orange-600 text-white"
        }`}
      >
        {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
      </button>

      {isOpen && (
        <div className="absolute bottom-24 right-0 w-[400px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[70vh] bg-white rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
          {/* Header */}
          <div className="bg-[#0F172A] p-6 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h4 className="font-black text-sm">Guide MaghrebVoyage</h4>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                    {isClient
                      ? guideMode === "openai"
                        ? "IA · Profil mémorisé"
                        : "Conseil expert · Profil mémorisé"
                      : "Mode basique · Découverte"}
                  </span>
                </div>
                {isClient && profileHint && (
                  <p className="text-[8px] text-orange-300/90 mt-1 max-w-[200px] truncate">
                    {profileHint}
                  </p>
                )}
              </div>
            </div>
            <Sparkles size={18} className="text-orange-500" />
          </div>

          {/* Login banner for visitors */}
          {isVisitor && (
            <Link
              href="/login"
              className="flex items-center justify-center gap-2 bg-orange-50 border-b border-orange-100 py-2.5 px-4 text-[10px] font-black uppercase tracking-widest text-orange-700 hover:bg-orange-100 transition-colors"
            >
              <LogIn size={12} /> Connectez-vous pour un guide personnalisé
            </Link>
          )}

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]/50 scroll-smooth"
          >
            {guideMode === "loading" && messages.length === 0 && (
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                Chargement de votre historique…
              </p>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in duration-300`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#0F172A] text-white rounded-tr-none"
                      : "bg-white border border-gray-100 text-[#0F172A] rounded-tl-none shadow-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" />
                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
            {error && (
              <p className="text-red-600 text-[10px] font-bold text-center">{error}</p>
            )}
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 border-t border-gray-50 pt-3 bg-white">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSend(s)}
                  disabled={isTyping}
                  className="text-[9px] font-black uppercase tracking-wide px-3 py-2 rounded-full bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-6 bg-white border-t border-gray-100">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={isClient ? "Parlez-moi de votre voyage idéal..." : "Posez votre question sur le Maghreb..."}
                title="Votre message au guide"
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-xl pl-4 pr-12 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/10 transition-all"
              />
              <button
                onClick={() => handleSend()}
                disabled={isTyping}
                title="Envoyer"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0F172A] text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-all disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
            {isClient ? (
              <p className="mt-3 text-[9px] text-gray-400 font-bold text-center uppercase tracking-widest">
                Vos préférences sont enregistrées sur votre compte
              </p>
            ) : (
              <p className="mt-3 text-[9px] text-gray-400 font-bold text-center uppercase tracking-widest">
                Créez un compte gratuit pour un guide personnalisé
              </p>
            )}
            <Link
              href="/recherche"
              className="mt-2 w-full bg-orange-50 text-orange-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border border-orange-100/50 hover:bg-orange-100 transition-all flex items-center justify-center gap-2"
            >
              <Compass size={14} /> Trouver mon voyage
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export { AIChatWidget };
export default AIChatWidget;
