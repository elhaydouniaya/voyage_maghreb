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
              <div className="w-12 h-12 bg-[#0F172A] rounded-2xl flex items-center justify-center text-orange-500">
                 <Lock size={24} />
              </div>
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Confidentialité</h1>
           </div>

           <div className="space-y-6 text-gray-600 leading-relaxed font-medium">
              <p>Chez MaghrebVoyage, nous prenons la protection de vos données personnelles très au sérieux. Cette page détaille comment nous collectons et utilisons vos informations.</p>
              
              <section className="space-y-4">
                 <h2 className="text-xl font-black text-[#0F172A]">1. Données collectées</h2>
                 <p>Nous collectons votre nom, email et numéro de téléphone uniquement pour faciliter vos réservations et la communication avec les agences.</p>
              </section>

              <section className="space-y-4">
                 <h2 className="text-xl font-black text-[#0F172A]">2. Utilisation de Stripe</h2>
                 <p>Vos données de paiement sont traitées directement par Stripe. MaghrebVoyage ne stocke aucune information bancaire sur ses serveurs.</p>
              </section>

              <section className="space-y-4">
                 <h2 className="text-xl font-black text-[#0F172A]">3. Vos droits</h2>
                 <p>Vous disposez d'un droit d'accès, de rectification et de suppression de vos données en nous contactant à support@maghrebvoyage.com.</p>
              </section>
           </div>
        </div>
      </div>
    </div>
  );
}
