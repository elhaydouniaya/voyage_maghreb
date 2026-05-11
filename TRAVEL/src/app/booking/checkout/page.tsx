"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  ShieldCheck, 
  CreditCard, 
  Lock, 
  CheckCircle2,
  Globe,
  ChevronRight
} from "lucide-react";
import { NavbarAuth } from "@/components/auth/NavbarAuth";
import { updateTripSpots } from "@/lib/trips";

export default function CheckoutPage() {
  const [step, setStep] = useState(1); // 1: Reservation, 2: Payment
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const data = localStorage.getItem("pending_booking");
    if (data) setBooking(JSON.parse(data));
  }, []);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePayment = () => {
    setIsLoading(true);
    // Simulate payment
    setTimeout(() => {
      if (booking) {
         updateTripSpots(booking.tripId);
         const confirmation = {
            ...booking,
            confirmationCode: `MAG-${Math.floor(100000 + Math.random() * 900000)}`
         };
         localStorage.setItem("last_booking", JSON.stringify(confirmation));
      }
      window.location.href = "/booking/success";
    }, 2000);
  };

  if (!booking) return <div className="min-h-screen flex items-center justify-center font-black text-gray-300">CHARGEMENT...</div>;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Navbar */}
      <nav className="w-full bg-white border-b border-gray-100 px-6 md:px-12 py-5 flex justify-between items-center fixed top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
             <Globe size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">MaghrebVoyage</span>
        </Link>
        <div className="hidden md:flex items-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">
           <span className={step >= 1 ? "text-orange-600" : ""}>1. Voyageur</span>
           <ChevronRight size={12} />
           <span className={step >= 2 ? "text-orange-600" : ""}>2. Paiement</span>
        </div>
        <NavbarAuth />
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-xl mx-auto">
          
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <h1 className="text-3xl font-black text-[#0F172A] mb-2 tracking-tight">Réservation</h1>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10">Informations du voyageur</p>

               <form onSubmit={handleNext} className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom complet</label>
                     <input 
                       required
                       type="text" 
                       placeholder="Jean Dupont" 
                       className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 transition-all"
                     />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                     <input 
                       required
                       type="email" 
                       placeholder="jean.dupont@email.com" 
                       className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 transition-all"
                     />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                        <input 
                          required
                          type="tel" 
                          placeholder="+33 6 12 34 56 78" 
                          className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 transition-all"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nationalité</label>
                        <select id="nationality" title="Nationalité" className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 transition-all appearance-none cursor-pointer">
                           <option>France</option>
                           <option>Algérie</option>
                           <option>Maroc</option>
                           <option>Tunisie</option>
                        </select>
                     </div>
                  </div>

                  <div className="pt-6">
                     <button 
                       type="submit"
                       className="w-full bg-[#0F172A] text-white py-5 rounded-full font-black text-lg shadow-xl shadow-black/10 hover:bg-black transition-all"
                     >
                        Continuer
                     </button>
                  </div>
               </form>
            </div>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-4 mb-10">
                  <button onClick={() => setStep(1)} title="Retour à l'étape précédente" className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-600 transition-all">
                     <ArrowLeft size={18} />
                  </button>
                  <div>
                     <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Paiement sécurisé</h1>
                     <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Étape finale</p>
                  </div>
               </div>

               <div className="bg-white rounded-[3rem] border border-gray-50 shadow-xl overflow-hidden mb-8">
                  <div className="p-10 border-b border-gray-50 bg-[#F8FAFC]/50">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                           <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Montant à payer</p>
                           <p className="text-4xl font-black text-[#0F172A]">€{booking.depositAmount}.00</p>
                        </div>
                        <div className="bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                           Acompte (30%)
                        </div>
                     </div>
                     <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0 relative">
                           <Image src={booking.coverImage || "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=200&auto=format&fit=crop"} alt={booking.tripTitle} fill sizes="48px" className="object-cover" />
                        </div>
                        <div>
                           <p className="text-[12px] font-black text-[#0F172A] leading-tight">{booking.tripTitle}</p>
                           <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{booking.destination}</p>
                        </div>
                     </div>
                  </div>

                  <div className="p-10 space-y-6">
                     <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-black text-[#0F172A] uppercase tracking-widest">Paiement via Stripe</p>
                        <div className="flex gap-2">
                           <div className="w-10 h-6 bg-gray-50 border border-gray-100 rounded-md flex items-center justify-center text-[8px] font-black">VISA</div>
                           <div className="w-10 h-6 bg-gray-50 border border-gray-100 rounded-md flex items-center justify-center text-[8px] font-black">MC</div>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Numéro de carte</label>
                           <div className="relative">
                              <input type="text" placeholder="#### #### #### ####" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none" />
                              <CreditCard size={18} className="absolute right-6 top-4 text-gray-300" />
                           </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">MM / AA</label>
                              <input type="text" placeholder="MM / AA" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">CVC</label>
                              <input type="text" placeholder="123" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none" />
                           </div>
                        </div>
                     </div>

                     <div className="pt-6">
                        <button 
                          onClick={handlePayment}
                          disabled={isLoading}
                          className="w-full bg-orange-600 text-white py-5 rounded-full font-black text-lg shadow-xl shadow-orange-500/20 hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                        >
                           {isLoading ? "TRAITEMENT..." : <>Payer €{booking.depositAmount}.00 <Lock size={20} /></>}
                        </button>
                     </div>

                     <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        <ShieldCheck size={14} className="text-[#10B981]" /> Paiement 100% sécurisé
                     </div>
                  </div>
               </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
