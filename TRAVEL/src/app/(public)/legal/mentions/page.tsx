import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-600 font-black uppercase tracking-widest text-xs transition-colors">
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>
        
        <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                 <Shield size={24} />
              </div>
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Mentions Légales</h1>
           </div>

           <div className="space-y-6 text-gray-600 leading-relaxed font-medium">
              <p>Édité par Maghreb Travel Tech SARL. RCS Paris 123 456 789.</p>
              <p>Hébergé par Vercel Inc.</p>
           </div>
        </div>
      </div>
    </div>
  );
}
