"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MoreHorizontal, Eye, Pencil, TrendingUp, Users, Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { getMergedTrips } from "@/lib/trips";
import { getFallbackImage } from "@/lib/images";

export default function AgencyDashboardPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeTrips: 8,
    confirmedBookings: 24,
    remainingSpots: 37,
    totalRevenue: "4,320"
  });

  useEffect(() => {
    const loadData = () => {
      const merged = getMergedTrips();
      setTrips([...merged].reverse());
    };
    loadData();
  }, []);

  const statsConfig = [
    { label: "Voyages actifs", val: stats.activeTrips, color: "bg-blue-50 text-blue-600" },
    { label: "Réservations confirmées", val: stats.confirmedBookings, color: "bg-green-50 text-green-600" },
    { label: "Places restantes", val: stats.remainingSpots, color: "bg-orange-50 text-orange-600" },
    { label: "Acomptes reçus", val: `€${stats.totalRevenue}`, color: "bg-gray-50 text-[#0F172A]", isCurrency: true },
  ];

  const recentBookings = [
    { traveler: "Jean Dupont", trip: "Aventure dans le Sahara", spots: "2 places", price: "€320", status: "Confirmée", statusColor: "text-green-500", img: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=200" },
    { traveler: "Sophie Martin", trip: "Trésors du Maroc", spots: "1 place", price: "€200", status: "Confirmée", statusColor: "text-green-500", img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=200" },
    { traveler: "Marc Leroy", trip: "Atlas & Vallées Berbères", spots: "2 places", price: "€300", status: "En attente", statusColor: "text-orange-500", img: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=200" },
    { traveler: "Julie Bernard", trip: "Évasion en Tunisie", spots: "1 place", price: "€150", status: "Confirmée", statusColor: "text-green-500", img: "https://images.unsplash.com/photo-1549877452-9c387954fbc2?q=80&w=200" },
  ];

  return (
    <div className="space-y-10">
      {/* Onboarding Checklist (Module J.3) */}
      <div className="bg-[#0F172A] rounded-[3rem] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
         <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
               <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight">Bienvenue sur MaghrebVoyage ! 🚀</h2>
                  <p className="text-gray-400 font-medium text-sm">Complétez ces 3 étapes pour commencer à recevoir des réservations.</p>
               </div>
               <div className="flex items-center gap-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-orange-500">Progression</div>
                  <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                     <div className="w-1/3 h-full bg-orange-500" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest">33%</div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
               {[
                 { title: "Compléter le profil", sub: "Stripe & Coordonnées", status: "completed", link: "/agency/settings" },
                 { title: "Publier un voyage", sub: "Créez votre première offre", status: "pending", link: "/agency/trips/new" },
                 { title: "Partager le lien", sub: "Attirez vos premiers clients", status: "locked", link: "#" },
               ].map((step, i) => (
                 <Link key={i} href={step.link} className={`p-6 rounded-[2rem] border transition-all flex flex-col gap-4 group ${
                   step.status === "completed" ? "bg-white/5 border-white/10" : 
                   step.status === "pending" ? "bg-orange-600 border-orange-500 shadow-xl shadow-orange-600/20" : 
                   "bg-white/5 border-white/5 opacity-40 cursor-not-allowed"
                 }`}>
                    <div className="flex justify-between items-start">
                       <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                         step.status === "completed" ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white"
                       }`}>
                          {step.status === "completed" ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                       </div>
                       <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">Étape {i + 1}</span>
                    </div>
                    <div>
                       <div className="text-[13px] font-black">{step.title}</div>
                       <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-0.5">{step.sub}</div>
                    </div>
                 </Link>
               ))}
            </div>
         </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-between h-40">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.label}</div>
            <div className="flex items-end justify-between">
               <div className={`text-4xl font-black tracking-tighter ${s.isCurrency ? 'text-[#0F172A]' : ''}`}>{s.val}</div>
               <Link href={i === 0 ? "/agency/trips" : i === 1 ? "/agency/bookings" : "#"} className="text-[10px] font-bold text-blue-600 hover:underline">Voir</Link>
            </div>
            {s.isCurrency && <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">Ce mois</div>}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        {/* Recent Bookings */}
        <div className="lg:col-span-3 bg-white rounded-[3rem] p-10 border border-gray-50 shadow-sm">
           <h3 className="text-lg font-black text-[#0F172A] mb-8">Dernières réservations</h3>
           <div className="space-y-6">
              {recentBookings.map((b, i) => (
                <div key={i} className="flex items-center justify-between group">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md">
                         <img 
                            src={b.img} 
                            alt={b.trip} 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getFallbackImage(b.trip);
                            }}
                         />
                      </div>
                      <div>
                         <div className="text-[13px] font-black text-[#0F172A]">{b.trip}</div>
                         <div className="text-[11px] text-gray-400 font-bold">{b.traveler}</div>
                      </div>
                   </div>
                   <div className="flex items-center gap-8">
                      <div className="text-[11px] font-bold text-gray-500 w-16">{b.spots}</div>
                      <div className="text-[11px] font-black text-[#0F172A] w-16">{b.price}</div>
                      <div className={`text-[10px] font-black uppercase tracking-widest w-20 text-right ${b.statusColor}`}>{b.status}</div>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* Upcoming Departures */}
        <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-gray-50 shadow-sm">
           <h3 className="text-lg font-black text-[#0F172A] mb-8">Départs dans les 30 prochains jours</h3>
           <div className="space-y-6 mb-8">
              {recentBookings.slice(0, 3).map((b, i) => (
                <div key={i} className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md">
                       <img 
                          src={b.img} 
                          alt={b.trip} 
                          className="w-full h-full object-cover" 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getFallbackImage(b.trip);
                          }}
                       />
                   </div>
                   <div>
                      <div className="text-[12px] font-black text-[#0F172A]">{b.trip}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">12 juin 2025</div>
                      <div className="text-[9px] text-orange-600 font-bold uppercase tracking-widest mt-0.5">8 places restantes</div>
                   </div>
                </div>
              ))}
           </div>
           <Link href="/agency/trips" className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline">
              Voir tous les départs
           </Link>
        </div>
      </div>
    </div>
  );
}
