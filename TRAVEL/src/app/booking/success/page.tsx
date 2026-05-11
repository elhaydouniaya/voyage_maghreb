"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, ArrowRight, Calendar, MapPin, Download, Mail, Phone, ExternalLink } from "lucide-react";

export default function BookingSuccessPage() {
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    const data = localStorage.getItem("last_booking");
    if (data) {
      setBooking(JSON.parse(data));
    }
  }, []);

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="animate-pulse text-gray-400 font-black uppercase tracking-widest text-[10px]">Chargement de votre réservation...</div>
      </div>
    );
  }

  const remainingAmount = Number(booking.totalPrice) - Number(booking.depositAmount);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6 py-20 font-outfit">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden">
          {/* Top Banner */}
          <div className="bg-orange-600 p-12 md:p-16 text-center text-white relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full bg-white/10 blur-3xl rounded-full -translate-y-1/2" />
             <div className="relative z-10 space-y-4">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-2 border border-white/30 shadow-xl">
                   <CheckCircle2 size={44} strokeWidth={3} />
                </div>
                <h1 className="text-4xl font-black tracking-tight">Réservation confirmée !</h1>
                <p className="text-orange-100 font-black uppercase tracking-[0.2em] text-[10px]">Votre place est désormais garantie</p>
             </div>
          </div>

          <div className="p-10 md:p-16 grid md:grid-cols-2 gap-12">
            {/* Left Column: Summary */}
            <div className="space-y-10">
               <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">Détails du voyage</h3>
                  <div className="flex items-start gap-5">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 shadow-sm relative">
                       <Image 
                         src={booking.coverImage || "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=200&auto=format&fit=crop"} 
                         alt={booking.tripTitle || "Voyage"}
                         fill
                         sizes="80px"
                         className="object-cover" 
                       />
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-lg font-black text-[#0F172A] leading-tight">{booking.tripTitle}</h4>
                       <div className="flex flex-col gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                          <div className="flex items-center gap-2"><MapPin size={12} className="text-orange-500" /> {booking.destination}</div>
                          <div className="flex items-center gap-2"><Calendar size={12} className="text-orange-500" /> {booking.startDate}</div>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">Paiement</h3>
                  <div className="space-y-3">
                     <div className="bg-[#F8FAFC] p-6 rounded-3xl border border-gray-50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Acompte payé</span>
                        <span className="text-xl font-black text-[#10B981]">{booking.depositAmount}€</span>
                     </div>
                     <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100/50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Reste à régler sur place</span>
                        <span className="text-xl font-black text-orange-600">{remainingAmount}€</span>
                     </div>
                  </div>
                  <div className="text-[9px] text-gray-400 font-bold text-center italic uppercase tracking-widest px-4">
                    Le solde restant est à régler directement auprès de l'agence lors de votre départ.
                  </div>
               </div>
            </div>

            {/* Right Column: Contact & Code */}
            <div className="space-y-10">
               <div className="bg-[#F8FAFC] border border-gray-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-inner">
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Code de confirmation</span>
                  <div className="text-4xl font-black text-[#0F172A] tracking-tighter mb-2">{booking.confirmationCode || "MV-729481"}</div>
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">À présenter à l'agence</div>
               </div>

               <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">Votre Organisateur</h3>
                  <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#0F172A] rounded-2xl flex items-center justify-center text-white font-black text-lg">
                           {booking.agencyName?.[0] || "A"}
                        </div>
                        <div>
                           <div className="text-sm font-black text-[#0F172A]">{booking.agencyName || "Agence Partenaire"}</div>
                           <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Agence Vérifiée MV</div>
                        </div>
                     </div>
                     <div className="space-y-3 pt-2">
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                           <Mail size={16} className="text-orange-500" /> {booking.agencyEmail || "contact@agence.com"}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                           <Phone size={16} className="text-orange-500" /> {booking.agencyPhone || "+33 6 00 00 00 00"}
                        </div>
                     </div>
                     <button className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#F8FAFC] text-[10px] font-black uppercase tracking-widest text-[#0F172A] hover:bg-orange-50 hover:text-orange-600 transition-all border border-gray-100">
                        Contacter via WhatsApp <ExternalLink size={12} />
                     </button>
                  </div>
               </div>
            </div>
          </div>

          <div className="p-10 md:p-16 bg-[#F8FAFC] border-t border-gray-50 flex flex-col md:flex-row items-center gap-6">
             <div className="flex-1 space-y-1">
                <p className="text-xs font-black text-[#0F172A] uppercase tracking-widest">Besoin d'annuler ?</p>
                <p className="text-[10px] text-gray-400 font-medium">Vous pouvez annuler via le lien envoyé dans votre email de confirmation.</p>
             </div>
             <div className="flex gap-4 w-full md:w-auto">
               <Link 
                 href="/"
                 className="flex-1 md:flex-none bg-[#0F172A] text-white font-black px-12 py-5 rounded-full text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95 shadow-xl shadow-black/10"
               >
                 Terminer <ArrowRight size={16} />
               </Link>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}


