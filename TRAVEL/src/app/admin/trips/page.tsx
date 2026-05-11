"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert,
  Globe,
  Briefcase,
  MapPin,
  Eye,
  AlertTriangle
} from "lucide-react";
import { NavbarAuth } from "@/components/auth/NavbarAuth";

const MOCK_ALL_TRIPS = [
  { id: "T1", agency: "Sahara Tours", title: "Réveillon à Taghit", status: "PUBLISHED", price: "1250€", destination: "Taghit, Algérie" },
  { id: "T2", agency: "Atlas Experts", title: "Sommet Toubkal", status: "PENDING_REVIEW", price: "890€", destination: "Haut Atlas, Maroc" },
  { id: "T3", agency: "Sahara Tours", title: "Dunes & Oasis", status: "PUBLISHED", price: "1100€", destination: "Timimoun, Algérie" },
  { id: "T4", agency: "Djerba Evasion", title: "Sidi Bou Said", status: "SUSPENDED", price: "450€", destination: "Tunisie" },
];

export default function AdminTripsPage() {
  const [trips, setTrips] = useState(MOCK_ALL_TRIPS);
  const [search, setSearch] = useState("");

  const updateStatus = (id: string, newStatus: string) => {
    setTrips(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Navbar */}
      <nav className="w-full bg-[#0F172A] px-6 md:px-12 py-5 flex justify-between items-center text-white sticky top-0 z-50">
        <div className="flex items-center gap-6">
           <Link href="/admin/dashboard" className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <ArrowLeft size={20} />
           </Link>
           <div className="flex items-center gap-3">
              <Briefcase className="text-orange-500" size={24} />
              <span className="text-xl font-black tracking-tight">Admin<span className="text-orange-500">Trips</span></span>
           </div>
        </div>
        <NavbarAuth />
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-1">
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Modération des Voyages</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Surveillance du catalogue global</p>
           </div>
           
           <div className="flex gap-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Voyage, Agence, Pays..." 
                   className="bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold w-64 shadow-sm outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                 />
              </div>
           </div>
        </header>

        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
           <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-gray-50">
                 <tr>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Voyage / Agence</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Destination</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut Actuel</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Modération</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Prix</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {trips.map(trip => (
                    <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-8 py-8">
                          <p className="text-sm font-black text-[#0F172A]">{trip.title}</p>
                          <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1">
                             Par {trip.agency}
                          </p>
                       </td>
                       <td className="px-8 py-8">
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                             <MapPin size={14} className="text-[#2563EB]" /> {trip.destination}
                          </div>
                       </td>
                       <td className="px-8 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             trip.status === 'PUBLISHED' ? 'bg-green-50 text-green-600 border border-green-100' :
                             trip.status === 'PENDING_REVIEW' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                             'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                             {trip.status === 'PENDING_REVIEW' ? 'À valider' : trip.status}
                          </span>
                       </td>
                       <td className="px-8 py-8">
                          <div className="flex gap-2">
                             {trip.status !== 'PUBLISHED' && (
                                <button 
                                  onClick={() => updateStatus(trip.id, "PUBLISHED")}
                                  className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                  title="Publier / Valider"
                                >
                                   <CheckCircle2 size={18} />
                                </button>
                             )}
                             {trip.status === 'PUBLISHED' && (
                                <button 
                                  onClick={() => updateStatus(trip.id, "SUSPENDED")}
                                  className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                  title="Suspendre (Modération)"
                                >
                                   <ShieldAlert size={18} />
                                </button>
                             )}
                             <Link 
                                href={`/trip/${trip.id}`}
                                className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                                title="Voir le voyage"
                             >
                                <Eye size={18} />
                             </Link>
                          </div>
                       </td>
                       <td className="px-8 py-8">
                          <span className="text-base font-black text-[#0F172A]">{trip.price}</span>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </main>
    </div>
  );
}
