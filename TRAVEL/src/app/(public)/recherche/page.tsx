"use client";

import GuideTouristiqueIA from "@/components/ai/GuideTouristiqueIA";
import { NavbarAuth } from "@/components/auth/NavbarAuth";
import { Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import AIChatWidget from "@/components/ai/AIChatWidget";

export default function RecherchePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Navbar Minimalist */}
      <nav className="w-full bg-[#0F172A] px-6 md:px-12 py-5 flex justify-between items-center text-white sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
             <Globe size={18} />
          </div>
          <span className="text-xl font-black tracking-tight">MaghrebVoyage</span>
        </Link>
        <NavbarAuth />
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 md:py-24">
        <div className="mb-12 text-center md:text-left">
           <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-600 font-black uppercase tracking-widest text-[10px] mb-8 transition-colors">
              <ArrowLeft size={14} /> Retour à l'accueil
           </Link>
           <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight mb-4">
              Votre <span className="text-orange-500">Assistant Voyage.</span>
           </h1>
           <p className="text-gray-500 font-medium max-w-xl">
              Laissez notre IA vous guider vers l'expérience parfaite au Maghreb.
           </p>
        </div>

        <GuideTouristiqueIA />
      </main>

      <footer className="py-12 text-center opacity-30">
         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            © 2026 MaghrebVoyage — Propulsé par l'IA
         </p>
      </footer>
      <AIChatWidget />
    </div>
  );
}

