import Link from "next/link";
import { ArrowLeft, CreditCard } from "lucide-react";

export default function RemboursementsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-12">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-orange-600 font-black uppercase tracking-widest text-xs transition-colors">
          <ArrowLeft size={16} /> Retour à l'accueil
        </Link>
        
        <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-sm space-y-8">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white">
                 <CreditCard size={24} />
              </div>
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Politique de Remboursement</h1>
           </div>

           <div className="space-y-6 text-gray-600 leading-relaxed font-medium">
              <section className="space-y-4">
                 <h2 className="text-xl font-black text-[#0F172A]">1. Annulation par le voyageur</h2>
                 <p>Les conditions de remboursement dépendent de la politique de l'agence organisatrice. En général, l'acompte est non-remboursable à moins de 30 jours du départ.</p>
              </section>

              <section className="space-y-4">
                 <h2 className="text-xl font-black text-[#0F172A]">2. Annulation par l'agence</h2>
                 <p>En cas d'annulation par l'agence (faute de participants ou cas de force majeure), le voyageur est remboursé à 100% via Stripe.</p>
              </section>

              <section className="space-y-4">
                 <h2 className="text-xl font-black text-[#0F172A]">3. Délais</h2>
                 <p>Les remboursements sont traités sous 5 à 10 jours ouvrés directement sur la carte ayant servi au paiement.</p>
              </section>
           </div>
        </div>
      </div>
    </div>
  );
}
