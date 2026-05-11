"use client";

import { Globe, ArrowLeft, Shield, FileText, Scale, RefreshCw } from "lucide-react";
import Link from "next/link";

const LEGAL_PAGES = [
  { slug: "cgu", title: "Conditions Générales d'Utilisation", icon: Scale },
  { slug: "confidentialite", title: "Politique de Confidentialité", icon: Shield },
  { slug: "remboursements", title: "Politique de Remboursement", icon: RefreshCw },
  { slug: "mentions", title: "Mentions Légales", icon: FileText },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      <nav className="sticky top-0 w-full bg-white/80 backdrop-blur-md px-6 md:px-12 py-5 flex justify-between items-center z-50 border-b border-gray-100">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
             <Globe size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">MaghrebVoyage</span>
        </Link>
        <Link href="/" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors flex items-center gap-2">
           <ArrowLeft size={14} /> Retour
        </Link>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-4 gap-12">
        <aside className="lg:col-span-1 space-y-4">
           <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-6">Centre Légal</h3>
           {LEGAL_PAGES.map(page => (
             <Link 
              key={page.slug}
              href={`/legal/${page.slug}`}
              className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-white border border-gray-100 hover:border-orange-500/20 hover:bg-orange-50/30 transition-all group"
             >
               <page.icon size={18} className="text-gray-400 group-hover:text-orange-600 transition-colors" />
               <span className="text-xs font-black text-[#0F172A]">{page.title}</span>
             </Link>
           ))}
        </aside>

        <main className="lg:col-span-3 bg-white rounded-[3rem] p-10 md:p-16 border border-gray-100 shadow-sm">
           {children}
        </main>
      </div>

      <footer className="py-12 text-center opacity-30">
         <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
            © 2026 MaghrebVoyage — Toutes les pages légales obligatoires sont actives.
         </p>
      </footer>
    </div>
  );
}
