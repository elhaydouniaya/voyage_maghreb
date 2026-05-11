"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  Sparkles, 
  Users, 
  MapPin, 
  Calendar, 
  Trash2, 
  Eye,
  Bot,
  Globe
} from "lucide-react";
import { NavbarAuth } from "@/components/auth/NavbarAuth";

export default function AdminAIRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Simulated historical data
    setRequests([
      { id: "1", date: "Il y a 10 min", destination: "Sahara / Taghit", travelers: 2, budget: "1200€", status: "MATCHED", matches: 3 },
      { id: "2", date: "Il y a 45 min", destination: "Marrakech", travelers: 4, budget: "800€", status: "MATCHED", matches: 5 },
      { id: "3", date: "Il y a 2h", destination: "Djanet", travelers: 1, budget: "2000€", status: "NO_MATCH", matches: 0 },
      { id: "4", date: "Il y a 4h", destination: "Tunisie / Djerba", travelers: 2, budget: "500€", status: "MATCHED", matches: 2 },
    ]);
  }, []);

  const filteredRequests = requests.filter(r => 
    r.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Navbar */}
      <nav className="w-full bg-[#0F172A] px-6 md:px-12 py-5 flex justify-between items-center text-white sticky top-0 z-50">
        <div className="flex items-center gap-6">
           <Link href="/admin/dashboard" className="p-2 hover:bg-white/10 rounded-xl transition-all">
              <ArrowLeft size={20} />
           </Link>
           <div className="flex items-center gap-3">
              <Sparkles className="text-orange-500" size={24} />
              <span className="text-xl font-black tracking-tight">Admin<span className="text-orange-500">AI</span></span>
           </div>
        </div>
        <NavbarAuth />
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-1">
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Analytique de l'Assistant IA</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Suivi des intentions de voyage des utilisateurs</p>
           </div>
           
           <div className="flex gap-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Filtrer par destination..." 
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
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Moment</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Demande Client</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut IA</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Résultats</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Détails</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {filteredRequests.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-8 py-8 text-xs font-bold text-gray-400">{r.date}</td>
                       <td className="px-8 py-8">
                          <div className="space-y-1">
                             <div className="flex items-center gap-2 text-sm font-black text-[#0F172A]">
                                <MapPin size={14} className="text-orange-500" /> {r.destination}
                             </div>
                             <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1"><Users size={12} /> {r.travelers} pers.</span>
                                <span className="flex items-center gap-1">Budget: {r.budget}</span>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             r.status === 'MATCHED' ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-red-50 text-red-600 border border-red-100'
                          }`}>
                             {r.status === 'MATCHED' ? 'Correspondance trouvée' : 'Aucun match'}
                          </span>
                       </td>
                       <td className="px-8 py-8 text-sm font-black text-[#0F172A]">{r.matches} voyages</td>
                       <td className="px-8 py-8">
                          <button 
                            className="p-3 bg-[#F8FAFC] border border-gray-100 rounded-xl text-gray-400 hover:text-orange-600 transition-all"
                            title="Voir les détails de la demande"
                          >
                             <Eye size={18} />
                          </button>
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
