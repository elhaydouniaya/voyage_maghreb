"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Search, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  ShieldAlert,
  MoreVertical,
  Globe,
  Mail,
  Phone,
  Building2,
  RefreshCcw,
  AlertTriangle
} from "lucide-react";
import { NavbarAuth } from "@/components/auth/NavbarAuth";

const MOCK_AGENCIES = [
  { id: "A1", name: "Sahara Tours Expert", manager: "Ahmed Alami", email: "contact@sahara.com", phone: "+212 600 000 000", status: "VERIFIED", siret: "842 123 456", trips: 12 },
  { id: "A2", name: "Atlas Adventure", manager: "Karim Idrissi", email: "info@atlas.ma", phone: "+212 611 111 111", status: "PENDING", siret: "MA-982341", trips: 4 },
  { id: "A3", name: "Djerba Evasion", manager: "Sonia Trabelsi", email: "hello@djerba.tn", phone: "+216 71 000 000", status: "REJECTED", siret: "TN-23421", trips: 0 },
  { id: "A4", name: "Mauritanie Trek", manager: "Oumar Fall", email: "trek@mauritanie.mr", phone: "+222 40 000 000", status: "SUSPENDED", siret: "MR-7823", trips: 8 },
];

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState(MOCK_AGENCIES);
  const [search, setSearch] = useState("");

  const updateStatus = (id: string, newStatus: string) => {
    setAgencies(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
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
              <ShieldCheck className="text-orange-500" size={24} />
              <span className="text-xl font-black tracking-tight">Admin<span className="text-orange-500">Agencies</span></span>
           </div>
        </div>
        <NavbarAuth />
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-1">
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Gestion des Partenaires</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Contrôle de conformité et accès agences</p>
           </div>
           
           <div className="flex gap-4">
              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                 <input 
                   type="text" 
                   placeholder="Nom, SIRET, Email..." 
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
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Agence / Gérant</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">SIRET / Contact</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Modérer</th>
                    <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Voyages</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {agencies.map(agency => (
                    <tr key={agency.id} className="hover:bg-gray-50/50 transition-colors">
                       <td className="px-8 py-8">
                          <div className="flex items-center gap-4">
                             <div className="w-12 h-12 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-[#0F172A] font-black text-xl border border-gray-100 shadow-sm">
                                {agency.name[0]}
                             </div>
                             <div>
                                <p className="text-base font-black text-[#0F172A]">{agency.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                   <Building2 size={10} /> Gérant: {agency.manager}
                                </p>
                             </div>
                          </div>
                       </td>
                       <td className="px-8 py-8">
                          <p className="text-xs font-black text-orange-600 mb-2 uppercase tracking-widest">{agency.siret}</p>
                          <div className="flex flex-col gap-1 text-[10px] text-gray-400 font-bold">
                             <span className="flex items-center gap-2"><Mail size={12} /> {agency.email}</span>
                             <span className="flex items-center gap-2"><Phone size={12} /> {agency.phone}</span>
                          </div>
                       </td>
                       <td className="px-8 py-8">
                          <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             agency.status === 'VERIFIED' ? 'bg-green-50 text-green-600 border border-green-100' :
                             agency.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                             agency.status === 'REJECTED' ? 'bg-red-50 text-red-600 border border-red-100' :
                             'bg-gray-800 text-white'
                          }`}>
                             {agency.status === 'VERIFIED' ? 'Vérifiée' : 
                              agency.status === 'PENDING' ? 'En attente' : 
                              agency.status === 'REJECTED' ? 'Refusée' : 'Suspendue'}
                          </span>
                       </td>
                       <td className="px-8 py-8">
                          <div className="flex gap-2">
                             {agency.status !== 'VERIFIED' && (
                                <button 
                                  onClick={() => updateStatus(agency.id, "VERIFIED")}
                                  className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                  title="Valider l'agence"
                                >
                                   <CheckCircle2 size={18} />
                                </button>
                             )}
                             {agency.status === 'VERIFIED' && (
                                <button 
                                  onClick={() => updateStatus(agency.id, "SUSPENDED")}
                                  className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-800 hover:bg-gray-800 hover:text-white transition-all shadow-sm"
                                  title="Suspendre l'agence"
                                >
                                   <ShieldAlert size={18} />
                                </button>
                             )}
                             {agency.status === 'PENDING' && (
                                <button 
                                  onClick={() => updateStatus(agency.id, "REJECTED")}
                                  className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                  title="Rejeter"
                                >
                                   <XCircle size={18} />
                                </button>
                             )}
                          </div>
                       </td>
                       <td className="px-8 py-8">
                          <div className="text-sm font-black text-[#0F172A]">{agency.trips}</div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Actifs</p>
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
