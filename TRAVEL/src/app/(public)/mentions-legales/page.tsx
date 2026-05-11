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
              <section className="space-y-4">
                 <h2 className="text-xl font-black text-[#0F172A]">1. Éditeur du site</h2>
                 <p>Le site MaghrebVoyage est édité par la société Maghreb Travel Tech SARL, au capital de 10 000€, immatriculée au RCS de Paris sous le numéro 123 456 789.</p>
              </section>

              <section className="space-y-4">
                 <h2 className="text-xl font-black text-[#0F172A]">2. Hébergement</h2>
                 <p>Le site est hébergé par Vercel Inc., situé au 340 S Lemon Ave #1135, Walnut, CA 91789, USA.</p>
              </section>

              <section className="space-y-4">
                 <h2 className="text-xl font-black text-[#0F172A]">3. Propriété intellectuelle</h2>
                 <p>L'ensemble du contenu (textes, images, logos) est la propriété exclusive de MaghrebVoyage. Toute reproduction est interdite sans accord préalable.</p>
              </section>
           </div>
        </div>
      </div>
    </div>
  );
}
