"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { MapPin, Calendar, CheckCircle2, ChevronRight, Users, Check, Sparkles, Heart } from "lucide-react";
import { getFallbackImage } from "@/lib/images";

interface TripCardProps {
  trip: any; // Simplified for demo
}

export default function TripCard({ trip }: TripCardProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const fillingPercentage = (trip.bookedSpots / trip.totalSpots) * 100;
  const isAlmostFull = (trip.totalSpots - trip.bookedSpots) <= 2;

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("mv_favorites") || "[]");
    setIsFavorited(favorites.some((f: any) => f.id === trip.id));
  }, [trip.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    const favorites = JSON.parse(localStorage.getItem("mv_favorites") || "[]");
    let newFavorites;
    
    if (isFavorited) {
      newFavorites = favorites.filter((f: any) => f.id !== trip.id);
    } else {
      newFavorites = [...favorites, trip];
    }
    
    localStorage.setItem("mv_favorites", JSON.stringify(newFavorites));
    setIsFavorited(!isFavorited);
  };

  return (
    <div className="group bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col lg:flex-row transition-all duration-1000 hover:shadow-[0_40px_80px_-15px_rgba(234,88,12,0.1)] hover:-translate-y-2 relative">
      {/* Heart Button Overlay */}
      <button 
        onClick={toggleFavorite}
        title={isFavorited ? "Retirer des favoris" : "Ajouter aux favoris"}
        className={`absolute top-8 right-8 z-20 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 backdrop-blur-md border ${
          isFavorited 
            ? "bg-red-500 text-white border-red-500 shadow-xl shadow-red-500/30" 
            : "bg-white/50 text-[#0F172A] border-white/20 hover:bg-white hover:scale-110"
        }`}
      >
        <Heart size={24} fill={isFavorited ? "currentColor" : "none"} strokeWidth={isFavorited ? 0 : 2} />
      </button>

      {/* Premium Badge Overlay */}
      <div className="absolute top-8 left-8 z-20 flex flex-col gap-3">
         <div className="bg-[#0F172A]/80 backdrop-blur-xl text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2 border border-white/10">
            <Sparkles size={12} className="text-orange-500" /> {trip.tripType}
         </div>
         {isAlmostFull && (
           <div className="bg-orange-500 text-white px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl animate-pulse border border-white/10">
              Presque complet
           </div>
         )}
      </div>

      {/* Image Section */}
      <div className="w-full lg:w-[500px] h-80 lg:h-auto overflow-hidden relative shrink-0">
        <img 
          src={trip.coverImage || getFallbackImage(trip.destination)} 
          alt={trip.title} 
          className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = getFallbackImage(trip.destination);
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent mix-blend-overlay" />
      </div>

      {/* Content Section */}
      <div className="p-12 lg:p-16 flex-1 flex flex-col justify-between bg-gradient-to-br from-white to-[#F8FAFC]/30">
        <div>
          <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-10">
            <div className="space-y-4">
              <h3 className="text-4xl font-black text-[#0F172A] leading-[1.1] tracking-tighter group-hover:text-orange-600 transition-colors duration-500 max-w-lg">
                {trip.title}
              </h3>
              <div className="flex flex-wrap items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500/5 rounded-xl flex items-center justify-center text-orange-600">
                    <MapPin size={14} />
                  </div>
                  {trip.destination}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500/5 rounded-xl flex items-center justify-center text-orange-600">
                    <Calendar size={14} />
                  </div>
                  {trip.startDate}
                </div>
              </div>
            </div>
            <div className="lg:text-right bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm min-w-[180px]">
              <div className="text-4xl font-black text-orange-600 tracking-tighter leading-none mb-1">{trip.totalPrice}€</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Par personne</div>
            </div>
          </div>

          {/* Inclusions Chips */}
          <div className="flex flex-wrap gap-3 mb-12">
            {trip.inclusions?.map((item: string, i: number) => (
              <div key={i} className="flex items-center gap-2 bg-white px-5 py-3 rounded-2xl border border-gray-100 shadow-sm hover:border-orange-500/20 transition-all cursor-default">
                <div className="w-5 h-5 bg-[#10B981]/10 rounded-full flex items-center justify-center text-[#10B981]">
                  <Check size={12} strokeWidth={4} />
                </div>
                <span className="text-[10px] font-black text-[#0F172A] uppercase tracking-widest">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer: Progress & Actions */}
        <div className="flex flex-col xl:flex-row items-center gap-10 pt-10 border-t border-gray-100">
           <div className="flex-1 w-full space-y-4">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em]">
                 <span className="text-gray-400">Remplissage</span>
                 <span className={`${isAlmostFull ? "text-orange-600" : "text-gray-400"} bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm`}>
                    {trip.bookedSpots} / {trip.totalSpots} places
                 </span>
              </div>
               <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5">
                  <div 
                    ref={(el) => { if (el) el.style.width = `${fillingPercentage}%`; }}
                    className={`h-full rounded-full transition-all duration-[1500ms] ${isAlmostFull ? "bg-orange-500" : "bg-orange-600"}`}
                  />
               </div>
           </div>

           <div className="flex items-center gap-4 w-full xl:w-auto">
             <Link 
               href={`/trip/${trip.slug}#booking-section`} 
               className="flex-1 xl:flex-none bg-[#0F172A] hover:bg-black text-white px-12 py-6 rounded-full text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all duration-500 active:scale-95 shadow-2xl shadow-gray-200 group/btn"
             >
               Voir le voyage <ChevronRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
             </Link>
           </div>
        </div>
      </div>
    </div>
  );
}
