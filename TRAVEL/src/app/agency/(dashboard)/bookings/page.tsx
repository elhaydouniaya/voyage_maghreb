"use client";

import { useState } from "react";
import { Calendar, User, Clock, MapPin, ChevronDown, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

const INITIAL_BOOKINGS = [
  { id: "B1", trip: "Désert & Étoiles", client: "Jean Dupont", date: "12 Mai 2026", status: "CONFIRMÉ", amount: "300€" },
  { id: "B2", trip: "Marrakech Express", client: "Sarah Cohen", date: "15 Juin 2026", status: "EN ATTENTE", amount: "450€" },
  { id: "B3", trip: "Atlas Trek", client: "Marc Lavoine", date: "20 Juil 2026", status: "ANNULÉ", amount: "120€" },
];

export default function AgencyBookingsPage() {
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);

  const updateStatus = (id: string, newStatus: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Gestion des Réservations</h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Suivez vos clients et leurs paiements</p>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F8FAFC] border-b border-gray-50">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Voyage</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Montant</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-6">
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-black text-xs">
                         {booking.client[0]}
                      </div>
                      <span className="text-sm font-bold text-[#0F172A]">{booking.client}</span>
                   </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <MapPin size={14} className="text-orange-500" /> {booking.trip}
                   </div>
                </td>
                <td className="px-8 py-6">
                   <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <Calendar size={14} /> {booking.date}
                   </div>
                </td>
                <td className="px-8 py-6">
                   <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                     booking.status === "CONFIRMÉ" ? "bg-green-50 text-green-600 border border-green-100" :
                     booking.status === "EN ATTENTE" ? "bg-orange-50 text-orange-600 border border-orange-100" :
                     "bg-red-50 text-red-600 border border-red-100"
                   }`}>
                      {booking.status}
                   </span>
                </td>
                <td className="px-8 py-6">
                   <div className="flex gap-2">
                      <button 
                        onClick={() => updateStatus(booking.id, "CONFIRMÉ")}
                        title="Confirmer"
                        className={`p-2 rounded-lg transition-all ${booking.status === 'CONFIRMÉ' ? 'bg-green-500 text-white' : 'bg-gray-50 text-gray-400 hover:text-green-500'}`}
                      >
                         <CheckCircle2 size={16} />
                      </button>
                      <button 
                        onClick={() => updateStatus(booking.id, "EN ATTENTE")}
                        title="Mettre en attente"
                        className={`p-2 rounded-lg transition-all ${booking.status === 'EN ATTENTE' ? 'bg-orange-500 text-white' : 'bg-gray-50 text-gray-400 hover:text-orange-500'}`}
                      >
                         <Clock size={16} />
                      </button>
                      <button 
                        onClick={() => updateStatus(booking.id, "ANNULÉ")}
                        title="Annuler"
                        className={`p-2 rounded-lg transition-all ${booking.status === 'ANNULÉ' ? 'bg-red-500 text-white' : 'bg-gray-50 text-gray-400 hover:text-red-500'}`}
                      >
                         <XCircle size={16} />
                      </button>
                   </div>
                </td>
                <td className="px-8 py-6">
                   <span className="text-sm font-black text-[#0F172A]">{booking.amount}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

