"use client";

import { useState } from "react";
import Image from "next/image";
import { CreditCard, ShieldCheck, User, Mail, Phone, ArrowRight } from "lucide-react";

import { useSession } from "next-auth/react";

interface BookingFormProps {
  tripId: string;
  tripTitle: string;
  totalPrice: number;
  depositAmount: number;
  destination: string;
  startDate: string;
  coverImage: string;
}

export default function BookingForm({ tripId, tripTitle, totalPrice, depositAmount, destination, startDate, coverImage }: BookingFormProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    numberOfSeats: 1
  });

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }
    setStep(2);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setIsLoading(true);

    const bookingData = {
      ...formData,
      tripId,
      tripTitle,
      totalPrice,
      depositAmount,
      destination,
      startDate,
      coverImage,
    };
    
    localStorage.setItem("pending_booking", JSON.stringify(bookingData));

    setTimeout(() => {
      window.location.href = `/booking/checkout?id=${tripId}`;
    }, 1500);
  };

  return (
    <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-2xl shadow-orange-500/5 space-y-8">
      {/* Trip Mini-Summary */}
      <div className="flex gap-4 p-4 bg-[#F8FAFC] rounded-[2rem] border border-gray-100">
         <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm relative">
          <Image src={coverImage || "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=200&auto=format&fit=crop"} alt={tripTitle} fill sizes="80px" className="object-cover" />
       </div>
         <div className="flex flex-col justify-center">
            <h4 className="text-sm font-black text-[#0F172A] leading-tight mb-1">{tripTitle}</h4>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{destination} • {startDate}</p>
         </div>
      </div>

      <div className="flex justify-between items-end border-b border-gray-50 pb-6">
        <div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Prix Total</span>
          <div className="text-3xl font-black text-[#0F172A] tracking-tighter">{totalPrice}€</div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block mb-1">Acompte</span>
          <div className="text-2xl font-black text-orange-600 tracking-tighter">{depositAmount}€</div>
        </div>
      </div>

      <form onSubmit={step === 1 ? handleNextStep : handleBooking} className="space-y-6">
        {step === 1 ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-3">
              <label htmlFor="numberOfSeats" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de voyageurs</label>
              <select 
                id="numberOfSeats"
                value={formData.numberOfSeats}
                onChange={e => setFormData(prev => ({ ...prev, numberOfSeats: parseInt(e.target.value) }))}
                title="Nombre de voyageurs"
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] appearance-none transition-all"
              >
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} {n > 1 ? 'Personnes' : 'Personne'}</option>)}
              </select>
            </div>
            
            <button 
              type="submit"
              className={`w-full ${!session ? 'bg-orange-600' : 'bg-[#0F172A]'} text-white py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:opacity-90 transition-all flex items-center justify-center gap-3`}
            >
              {!session ? "Se connecter pour réserver" : "Continuer"} <ArrowRight size={18} />
            </button>
            {!session && (
              <p className="text-[9px] text-gray-400 text-center font-bold uppercase tracking-widest">
                Une connexion est requise pour garantir votre réservation.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
               <div className="relative">
                  <User className="absolute left-4 top-4 text-gray-300" size={18} />
                  <input 
                    type="text" 
                    required
                    placeholder="Votre Nom & Prénom"
                    defaultValue={session?.user?.name || ""}
                    onChange={e => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-12 pr-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                  />
               </div>
               <div className="relative">
                  <Mail className="absolute left-4 top-4 text-gray-300" size={18} />
                  <input 
                    type="email" 
                    required
                    placeholder="Votre Email"
                    defaultValue={session?.user?.email || ""}
                    onChange={e => setFormData(prev => ({ ...prev, clientEmail: e.target.value }))}
                    className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-12 pr-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                  />
               </div>
               <div className="relative">
                  <Phone className="absolute left-4 top-4 text-gray-300" size={18} />
                  <input 
                    type="tel" 
                    placeholder="Téléphone (facultatif)"
                    value={formData.clientPhone}
                    onChange={e => setFormData(prev => ({ ...prev, clientPhone: e.target.value }))}
                    className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-12 pr-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                  />
               </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? "CHARGEMENT..." : <>Payer l'acompte ({depositAmount * formData.numberOfSeats}€) <CreditCard size={18} /></>}
            </button>
            
            <button 
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
            >
              ← Modifier le nombre de voyageurs
            </button>
          </div>
        )}
      </form>
      
      <div className="flex flex-col items-center gap-4 pt-4">
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
           <ShieldCheck size={14} className="text-[#10B981]" /> Paiement 100% Sécurisé Stripe
        </div>
        <p className="text-[9px] text-gray-300 text-center leading-relaxed px-4">
          En cliquant, vous acceptez les CGU de MaghrebVoyage et la transmission de vos données à l'agence organisatrice.
        </p>
      </div>
    </div>
  );
}
