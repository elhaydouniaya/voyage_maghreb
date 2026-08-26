"use client";

import React, { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Bot, Send, Compass, Sparkles } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Message = { role: "assistant" | "user"; content: string };

export default function ChatConversation() {
  const { data: session, status } = useSession();
  const isClient = status === "authenticated" && session?.user?.role === "CLIENT";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    // Load server-driven initial messages, profile and suggestions
    const load = async () => {
      try {
        const res = await fetch("/api/ai/guide-chat", { cache: "no-store" });
        const data = await res.json();
        if (res.ok) {
          setSuggestions(data.suggestions || []);
          setProfile(data.profile || null);
          // If backend provided initial messages (assistant welcome), use them so conversation is server-driven
          if (Array.isArray(data.messages) && data.messages.length > 0) {
            const serverMessages = data.messages.map((m: any) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
            setMessages(serverMessages as Message[]);
          }
        }
      } catch (e) {
        // ignore; sidebar can remain empty
      }
    };
    load();
  }, [isClient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isTyping) return;
    setError("");

    const userMsg: Message = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setIsTyping(true);

    const apiMessages = next.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));

    try {
      const res = await fetch("/api/ai/guide-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur serveur");
        setIsTyping(false);
        return;
      }

      // Append assistant reply (do not re-add the user message — it was added optimistically)
      const reply = data.reply || "";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // Update sidebar
      if (data.suggestions) setSuggestions(data.suggestions);
      if (data.profile) setProfile(data.profile);

      // If structuredDemand present, call match endpoint to refresh recommendations
      if (data.structuredDemand) {
        try {
          const matchRes = await fetch("/api/ai/match", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data.structuredDemand),
          });
          const matchJson = await matchRes.json();
          if (matchRes.ok && matchJson.results) {
            setResults(matchJson.results);
          }
        } catch (e) {
          // ignore match error; recommendations optional
        }
      }
    } catch (e) {
      setError("Connexion impossible");
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-6 py-10">
      {/* Chat column */}
      <div className="md:col-span-2 bg-white rounded-[2rem] shadow-2xl border border-gray-100 flex flex-col h-[75vh] overflow-hidden font-outfit">
        <div className="bg-[#0F172A] p-6 text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-black text-lg">Assistant IA — Planificateur de voyage</h3>
            <p className="text-xs text-gray-300">Discutez librement en français. L'IA comprend corrections et références.</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]/50">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 font-medium">Commencez la conversation en tapant votre demande ci-dessous.</div>
          )}

          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-[#0F172A] text-white rounded-tr-none" : "bg-white border border-gray-100 text-[#0F172A] rounded-tl-none shadow-sm"}`}>
                {m.content}
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

          {error && <div className="text-red-600 text-sm text-center">{error}</div>}
        </div>

        {/* Input */}
        <div className="p-6 bg-white border-t border-gray-100">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ex: Je voudrais partir une semaine en septembre avec un budget de 1200€..."
              className="w-full h-20 resize-none bg-[#F8FAFC] border border-gray-100 rounded-xl pl-4 pr-12 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-orange-500/10"
            />
            <button
              onClick={() => sendMessage()}
              disabled={isTyping}
              className="absolute right-2 top-2 w-10 h-10 bg-[#0F172A] text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-all disabled:opacity-50"
            >
              <Send size={14} />
            </button>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400">
            <div>Entrée = envoyer · Shift+Entrée = saut de ligne</div>
            <div className="flex gap-2">
              {suggestions.slice(0,3).map((s) => (
                <button key={s} onClick={() => sendMessage(s)} className="text-[10px] font-black uppercase px-3 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100">{s}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right column: Current Trip + Recommendations */}
      <aside className="md:col-span-1 space-y-6">
        <div className="bg-white rounded-[1.5rem] border border-gray-100 p-6 shadow-sm">
          <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Votre profil voyage</h4>
          {profile ? (
            <div className="mt-3 space-y-2 text-sm text-[#0F172A]">
              <div><strong>Destinations :</strong> {(profile.preferredDestinations || []).join(", ") || "—"}</div>
              <div><strong>Style :</strong> {(profile.travelStyles || []).join(", ") || "—"}</div>
              <div><strong>Budget :</strong> {profile.budgetMax ? `${profile.budgetMax}€` : "—"}</div>
              <div><strong>Voyageurs :</strong> {profile.travelersCount || "—"}</div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-400">Connectez-vous pour enregistrer vos préférences.</p>
          )}
        </div>

        <div className="bg-white rounded-[1.5rem] border border-gray-100 p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Recommandations</h4>
            <div className="text-[10px] font-black text-orange-600">{results.length} trouvées</div>
          </div>

          <div className="mt-3 space-y-4">
            {results.length === 0 ? (
              <div className="text-sm text-gray-400">Les recommandations apparaîtront ici après votre message.</div>
            ) : (
              results.slice(0,3).map((trip: any) => (
                <div key={trip.id} className="flex gap-3 items-center">
                  <div className="w-16 h-12 relative rounded-md overflow-hidden bg-gray-100">
                    {trip.coverImage ? <Image src={trip.coverImage} alt={trip.title} fill className="object-cover" /> : <div />}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-black text-[#0F172A]">{trip.title}</div>
                    <div className="text-xs text-gray-400">{trip.destination}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link href="/voyages?matched=true" className="mt-4 self-stretch inline-flex items-center justify-center gap-2 bg-orange-600 text-white py-2 rounded-lg text-[12px] font-black uppercase tracking-widest hover:bg-[#0F172A] transition-all">Voir toutes les offres</Link>
        </div>
      </aside>
    </div>
  );
}
