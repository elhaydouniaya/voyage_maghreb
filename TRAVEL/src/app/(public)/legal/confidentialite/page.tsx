import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-600 font-black uppercase tracking-widest text-xs transition-colors">
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>
        
        <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                 <Lock size={24} />
              </div>
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Confidentialité</h1>
           </div>

           <div className="space-y-6 text-gray-600 leading-relaxed font-medium">
              <section className="space-y-4">
                 <h2 className="text-xl font-black text-[#0F172A]">1. Collecte des données</h2>
                 <p>Nous collectons vos informations lors de la création de compte et de la réservation pour assurer le bon déroulement de votre voyage.</p>
              </section>

              <section className="space-y-4">
                 <h2 className="text-xl font-black text-[#0F172A]">2. Utilisation</h2>
                 <p>Vos données sont partagées uniquement avec l'agence organisatrice de votre voyage.</p>
              </section>
           </div>
        </div>
      </div>
    </div>
  );
}
