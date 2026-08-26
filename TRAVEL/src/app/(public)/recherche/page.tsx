"use client";

import ChatConversation from "@/components/ai/ChatConversation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function RecherchePage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 md:py-16">
      <div className="mb-8 text-center md:text-left">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-600 font-black uppercase tracking-widest text-[10px] mb-4 transition-colors"
        >
          <ArrowLeft size={14} /> Retour à l&apos;accueil
        </Link>
        <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight mb-2">
          Recherche IA — <span className="text-orange-500">Assistant conversationnel</span>
        </h1>
        <p className="text-gray-500 font-medium max-w-xl">Discutez en français avec l'assistant pour construire votre voyage. Entrez simplement ce que vous souhaitez et l'IA s'occupe du reste.</p>
      </div>

      <ChatConversation />
    </div>
  );
}
