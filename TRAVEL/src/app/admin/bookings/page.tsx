"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle,
  MoreVertical,
  Globe,
  Briefcase,
  Users
} from "lucide-react";
import { NavbarAuth } from "@/components/auth/NavbarAuth";

const MOCK_ALL_BOOKINGS = [
  { id: "B101", agency: "Sahara Tours", trip: "Dunes & Oasis", client: "Jean Dupont", status: "CONFIRMÉ", date: "2026-05-12", amount: "350€" },
  { id: "B102", agency: "Atlas Experts", trip: "Sommet Toubkal", client: "Sophie Martin", status: "EN ATTENTE", date: "2026-05-14", amount: "420€" },
  { id: "B103", agency: "Sahara Tours", trip: "Dunes & Oasis", client: "Marc Leroy", status: "ANNULÉ", date: "2026-05-12", amount: "350€" },
  { id: "B104", agency: "Djerba Evasion", trip: "Sidi Bou Said", client: "Julie Bernard", status: "REFUND_PENDING", date: "2026-05-18", amount: "150€" },
];

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState(MOCK_ALL_BOOKINGS);
  const [search, setSearch] = useState("");

  const updateStatus = (id: string, newStatus: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
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
              <Globe className="text-orange-500" size={24} />
              <span className="text-xl font-black tracking-tight">Admin<span className="text-orange-500">Bookings</span></span>
           </div>
        </div>
        <NavbarAuth />
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-1">
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Supervision des Réservations</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Toutes les agences • Temps Réel</p>
           </div>
           
           <div className="flex gap-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Chercher client, agence..." 
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
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client / Agence</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Voyage</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions Admin</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Montant</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-8 py-8">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-600">
                                <Users size={18} />
                             </div>
                             <div>
                                <p className="text-sm font-black text-[#0F172A]">{b.client}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                   <Briefcase size={10} /> {b.agency}
                                </p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-8">
                          <p className="text-sm font-bold text-gray-600">{b.trip}</p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{b.date}</p>
                       </td>
                       <td className="px-8 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             b.status === 'CONFIRMÉ' ? 'bg-green-50 text-green-600 border border-green-100' :
                             b.status === 'ANNULÉ' ? 'bg-red-50 text-red-600 border border-red-100' :
                             b.status === 'REFUND_PENDING' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                             'bg-gray-100 text-gray-400'
                          }`}>
                             {b.status === 'REFUND_PENDING' ? 'Remboursement requis' : b.status}
                          </span>
                       </td>
                       <td className="px-8 py-8">
                          <div className="flex gap-2">
                             <button 
                               onClick={() => updateStatus(b.id, "CONFIRMÉ")}
                               className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-green-500 hover:border-green-500/20 transition-all shadow-sm"
                               title="Forcer Confirmation"
                             >
                                <CheckCircle2 size={16} />
                             </button>
                             <button 
                               onClick={() => updateStatus(b.id, "ANNULÉ")}
                               className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-500/20 transition-all shadow-sm"
                               title="Forcer Annulation"
                             >
                                <XCircle size={16} />
                             </button>
                             {b.status === 'REFUND_PENDING' && (
                                <button 
                                  onClick={() => updateStatus(b.id, "REMBOURSÉ")}
                                  className="px-4 h-10 bg-orange-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-orange-700 transition-all shadow-lg shadow-orange-600/20"
                                >
                                   Rembourser via Stripe
                                </button>
                             )}
                          </div>
                       </td>
                       <td className="px-8 py-8">
                          <span className="text-base font-black text-[#0F172A]">{b.amount}</span>
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
