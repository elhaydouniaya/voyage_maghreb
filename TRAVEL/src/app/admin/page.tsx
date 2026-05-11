"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, Users, Target, CheckCircle2, AlertCircle, ChevronRight, Filter } from "lucide-react";

// Fausses données pour l'interface visuelle (MVP)
const MOCK_LEADS = [
  {
    id: "lead_1",
    client: "Thomas Dubois",
    destination: "Désert Algérien (Taghit)",
    budget: 1200,
    travelType: "Aventure & Découverte",
    date: "Aujourd'hui, 14:30",
    status: "REVIEW_ADMIN",
    matchScore: 92,
    matchedAgencies: 3
  },
  {
    id: "lead_2",
    client: "Sarah Martin",
    destination: "Sud Tunisien",
    budget: 850,
    travelType: "Culturel",
    date: "Aujourd'hui, 11:15",
    status: "SENT_TO_AGENCIES",
    matchScore: 88,
    matchedAgencies: 2
  },
  {
    id: "lead_3",
    client: "Karim Benali",
    destination: "Marrakech & Atlas",
    budget: 2500,
    travelType: "Famille (Luxe)",
    date: "Hier",
    status: "REVIEW_ADMIN",
    matchScore: 95,
    matchedAgencies: 5
  },
  {
    id: "lead_4",
    client: "Emma Leroux",
    destination: "Mauritanie (Adrar)",
    budget: 1500,
    travelType: "Trek",
    date: "Hier",
    status: "PENDING_AI",
    matchScore: 0,
    matchedAgencies: 0
  }
];

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filteredLeads = MOCK_LEADS.filter(lead => {
    if (activeTab === "pending") return lead.status === "REVIEW_ADMIN" || lead.status === "PENDING_AI";
    if (activeTab === "sent") return lead.status === "SENT_TO_AGENCIES";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-12 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Supervision Admin</h1>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">Pilotage des requêtes IA et assignation</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white border border-gray-100 text-[#0F172A] px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center gap-2">
            <Filter size={16} />
            Filtres
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Leads générés (30j)", val: "142", icon: Target, color: "text-[#2563EB]" },
          { label: "À valider", val: "12", icon: AlertCircle, color: "text-[#F59E0B]" },
          { label: "Agences partenaires", val: "48", icon: Users, color: "text-[#10B981]" },
          { label: "Taux de conversion", val: "24%", icon: Activity, color: "text-[#8B5CF6]" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
               <s.icon size={16} className={s.color} /> {s.label}
            </div>
            <div className="text-4xl font-black text-[#0F172A] tracking-tighter">{s.val}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        
        {/* Tabs */}
        <div className="px-10 py-6 border-b border-gray-50 flex gap-8">
          {[
            { id: "all", label: "Tous les Leads" },
            { id: "pending", label: "À valider" },
            { id: "sent", label: "Envoyés aux agences" },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-xs font-black uppercase tracking-widest pb-2 transition-colors relative ${activeTab === tab.id ? 'text-[#2563EB]' : 'text-gray-400 hover:text-[#0F172A]'}`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#2563EB] rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Leads Table */}
        <div className="overflow-x-auto">
           <table className="w-full text-left">
              <thead>
                 <tr className="bg-[#F8FAFC]">
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Client & Demande</th>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget</th>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Score IA</th>
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                    <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Action</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                 {filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-[#F8FAFC]/50 transition-colors group">
                       <td className="px-10 py-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-[#0F172A] font-bold text-sm">
                              {lead.client.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-[#0F172A]">{lead.client}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{lead.destination}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{lead.travelType}</span>
                              </div>
                            </div>
                          </div>
                       </td>
                       <td className="px-6 py-6">
                          <div className="text-sm font-bold text-[#0F172A]">{lead.budget} €</div>
                       </td>
                       <td className="px-6 py-6 text-center">
                          {lead.status === "PENDING_AI" ? (
                            <span className="text-xs font-bold text-gray-400">En calcul...</span>
                          ) : (
                            <div className="flex flex-col items-center gap-1">
                               <div className={`text-xs font-black ${lead.matchScore >= 90 ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                                 {lead.matchScore}% Match
                               </div>
                               <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                 {lead.matchedAgencies} Agences
                               </div>
                            </div>
                          )}
                       </td>
                       <td className="px-6 py-6">
                          <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                            lead.status === 'SENT_TO_AGENCIES' ? 'bg-[#10B981]/10 text-[#10B981]' :
                            lead.status === 'REVIEW_ADMIN' ? 'bg-[#F59E0B]/10 text-[#F59E0B]' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {lead.status === 'SENT_TO_AGENCIES' ? 'Envoyé' : 
                             lead.status === 'REVIEW_ADMIN' ? 'À valider' : 'Traitement IA'}
                          </span>
                       </td>
                       <td className="px-10 py-6 text-right">
                          <button title="Voir les détails du lead" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 text-gray-400 hover:bg-[#2563EB] hover:text-white transition-all">
                             <ChevronRight size={18} />
                          </button>
                       </td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
