"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  Briefcase, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BarChart3, 
  TrendingUp,
  RefreshCcw,
  ArrowRight,
  Sparkles,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import AdminCharts from "@/components/admin/AdminCharts";

type PendingAgency = {
  id: string;
  name: string;
  email: string;
  siret: string;
  createdAt: string;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    monthBookings: 0,
    monthRevenue: 0,
    conversionRate: 0,
    fillingRate: 0,
    activeTrips: 0,
    publishedTrips: 0,
    pendingAgencies: 0,
    pendingRefunds: 0,
    monthTravelRequests: 0,
  });
  const [topDestinations, setTopDestinations] = useState("—");
  const [topAgencies, setTopAgencies] = useState("—");
  const [recentCancellations, setRecentCancellations] = useState<
    { id: string; user: string; amount: string; trip: string; reason: string }[]
  >([]);

  const [pendingAgencies, setPendingAgencies] = useState<PendingAgency[]>([]);

  const [rejectionTarget, setRejectionTarget] = useState<string | null>(null);
  const [rejectionMotif, setRejectionMotif] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [refundingId, setRefundingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/dashboard");
        if (!res.ok) return;
        const data = await res.json();
        if (data.stats) setStats(data.stats);
        if (data.topDestinations) setTopDestinations(data.topDestinations);
        if (data.topAgencies) setTopAgencies(data.topAgencies);
        if (data.pendingAgencies) setPendingAgencies(data.pendingAgencies);
        if (data.recentCancellations) setRecentCancellations(data.recentCancellations);
      } catch {
        /* ignore */
      }
    }
    load();
  }, []);

  const patchAgency = async (id: string, status: string, note?: string) => {
    const res = await fetch(`/api/admin/agencies/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    });
    return res.ok;
  };

  const handleValidate = async (id: string) => {
    setProcessingId(id);
    const ok = await patchAgency(id, "VERIFIED");
    if (ok) {
      setPendingAgencies((prev) => prev.filter((a) => a.id !== id));
      setStats((prev) => ({
        ...prev,
        pendingAgencies: Math.max(0, prev.pendingAgencies - 1),
      }));
    }
    setProcessingId(null);
  };

  const handleReject = async (id: string) => {
    if (rejectionTarget === id && rejectionMotif.length > 5) {
      setProcessingId(id);
      const ok = await patchAgency(id, "REJECTED", rejectionMotif);
      if (ok) {
        setPendingAgencies((prev) => prev.filter((a) => a.id !== id));
        setStats((prev) => ({
          ...prev,
          pendingAgencies: Math.max(0, prev.pendingAgencies - 1),
        }));
        setRejectionTarget(null);
        setRejectionMotif("");
      }
      setProcessingId(null);
    } else {
      setRejectionTarget(id);
    }
  };

  const handleRefund = async (bookingId: string) => {
    if (!confirm("Confirmer le remboursement de l'acompte ?")) return;
    setRefundingId(bookingId);
    try {
      const res = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refund" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Remboursement impossible.");
        return;
      }
      setRecentCancellations((prev) => prev.filter((r) => r.id !== bookingId));
      setStats((s) => ({
        ...s,
        pendingRefunds: Math.max(0, s.pendingRefunds - 1),
      }));
    } catch {
      alert("Erreur réseau.");
    } finally {
      setRefundingId(null);
    }
  };

  const kpiCards = [
    { label: "Réservations totales", value: stats.totalBookings, sub: "Confirmées (toutes périodes)", icon: CheckCircle2, color: "bg-blue-500", highlight: false },
    { label: "Réservations ce mois", value: stats.monthBookings, sub: `${stats.monthTravelRequests} demandes IA ce mois`, icon: TrendingUp, color: "bg-green-500", highlight: true },
    { label: "Acomptes (ce mois)", value: `${stats.monthRevenue.toLocaleString("fr-FR")}€`, sub: "Dépôts confirmés", icon: CreditCard, color: "bg-orange-500", highlight: false },
    { label: "Conversion IA", value: `${stats.conversionRate}%`, sub: "Demandes → réservations", icon: Sparkles, color: "bg-purple-500", highlight: false },
    { label: "Remplissage moyen", value: `${stats.fillingRate}%`, sub: "Voyages actifs", icon: BarChart3, color: "bg-pink-500", highlight: false },
    { label: "Voyages actifs", value: `${stats.activeTrips} / ${stats.publishedTrips}`, sub: "publiés au total", icon: Briefcase, color: "bg-indigo-500", highlight: false },
    { label: "Top Destinations", value: topDestinations, sub: "Les plus proposées", icon: MapPin, color: "bg-teal-500", highlight: false },
    { label: "Top Agences", value: topAgencies, sub: "Les plus actives", icon: Users, color: "bg-yellow-500", highlight: false },
  ];

  return (
    <>
        <AdminCharts />

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
           {kpiCards.map((stat, i) => (
             <div key={i} className={`bg-white p-8 rounded-[3rem] border shadow-sm group hover:shadow-xl transition-all duration-500 ${stat.highlight ? 'border-orange-500/30 ring-4 ring-orange-500/5' : 'border-gray-100'}`}>
                <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                   <stat.icon size={24} />
                </div>
                <div className="text-3xl font-black text-[#0F172A] mb-1">{stat.value}</div>
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</div>
                <div className="mt-6 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                   {stat.sub}
                </div>
             </div>
           ))}
        </div>

        {/* Action Sections */}
        <div className="grid lg:grid-cols-2 gap-12">
           {/* Agency Validation (Module K.2) */}
           <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm p-10">
              <div className="flex justify-between items-center mb-10">
                 <h2 className="text-2xl font-black text-[#0F172A]">Agences à valider</h2>
                 <Link href="/admin/agencies" className="text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline flex items-center gap-2">
                    Voir toutes <ArrowRight size={12} />
                 </Link>
              </div>

              <div className="space-y-6">
                  {pendingAgencies.map(agency => (
                    <div key={agency.id} className={`flex flex-col p-8 bg-[#F8FAFC] rounded-[3rem] border transition-all group ${processingId === agency.id ? 'opacity-50 grayscale' : 'hover:border-orange-500/20'}`}>
                       <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-5">
                             <div className="w-14 h-14 bg-white rounded-2xl border border-gray-100 flex items-center justify-center text-[#0F172A] font-black text-xl shadow-sm">
                                {agency.name[0]}
                             </div>
                             <div>
                                <p className="text-base font-black text-[#0F172A]">{agency.name}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{agency.email}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                  {format(new Date(agency.createdAt), "d MMM yyyy", { locale: fr })}
                                </p>
                                <p className="text-[10px] text-orange-600 font-black mt-1 uppercase tracking-widest">SIRET: {agency.siret}</p>
                             </div>
                          </div>
                          <div className="flex gap-3">
                             <button 
                               onClick={() => handleValidate(agency.id)}
                               disabled={processingId !== null}
                               className="w-12 h-12 bg-white border border-gray-100 rounded-2xl text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-sm flex items-center justify-center disabled:opacity-30" title="Valider">
                                {processingId === agency.id ? <RefreshCcw size={16} className="animate-spin" /> : <CheckCircle2 size={20} />}
                             </button>
                             <button 
                               onClick={() => handleReject(agency.id)}
                               disabled={processingId !== null}
                               className="w-12 h-12 bg-white border border-gray-100 rounded-2xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm flex items-center justify-center disabled:opacity-30" title="Rejeter">
                                <XCircle size={20} />
                             </button>
                          </div>
                       </div>
                       
                       {rejectionTarget === agency.id && (
                         <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 animate-in slide-in-from-top-2">
                            <textarea 
                              placeholder="Motif du rejet (min 5 car.)..." 
                              className="w-full bg-white border border-gray-100 rounded-2xl p-4 text-xs font-medium outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500/20"
                              value={rejectionMotif}
                              onChange={(e) => setRejectionMotif(e.target.value)}
                            />
                            <div className="flex gap-3">
                               <button 
                                 onClick={() => handleReject(agency.id)}
                                 className="flex-1 bg-red-600 text-white py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
                               >
                                 Confirmer le rejet
                               </button>
                               <button 
                                 onClick={() => { setRejectionTarget(null); setRejectionMotif(""); }}
                                 className="px-6 py-3 bg-gray-100 text-gray-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 transition-all"
                               >
                                 Annuler
                               </button>
                            </div>
                         </div>
                       )}
                    </div>
                  ))}
                  {pendingAgencies.length === 0 && (
                    <div className="text-center py-20 bg-[#F8FAFC] rounded-[3rem] border border-dashed border-gray-200">
                       <CheckCircle2 size={40} className="text-green-500 mx-auto mb-4 opacity-20" />
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Toutes les agences sont traitées</p>
                    </div>
                  )}
              </div>
           </div>

           {/* Alerts & Activity (Module K.4 / K.5) */}
           <div className="space-y-12">
              <div className="bg-[#0F172A] rounded-[4rem] shadow-2xl p-10 relative overflow-hidden text-white">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                 <h2 className="text-2xl font-black mb-10 flex items-center gap-3">
                    <RefreshCcw size={24} className="text-orange-500" /> Remboursements
                 </h2>
                 <div className="space-y-6 mb-10">
                    {recentCancellations.length === 0 && (
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center py-8">
                        Aucune annulation récente
                      </p>
                    )}
                    {recentCancellations.map((r) => (
                      <div key={r.id} className="flex items-center justify-between p-6 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all">
                         <div>
                            <p className="text-sm font-black text-white">{r.user}</p>
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">{r.trip}</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">{r.reason}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-lg font-black text-white">{r.amount}</p>
                            <button
                              type="button"
                              disabled={refundingId === r.id}
                              onClick={() => handleRefund(r.id)}
                              className="text-[9px] font-black text-orange-500 uppercase tracking-widest hover:underline mt-1 disabled:opacity-50"
                            >
                              {refundingId === r.id ? "Traitement..." : "Rembourser l'acompte"}
                            </button>
                         </div>
                      </div>
                    ))}
                 </div>
                 <Link
                   href="/admin/bookings?filter=refunds"
                   className="block w-full bg-white text-[#0F172A] py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/20 text-center"
                 >
                    Voir tous les remboursements
                 </Link>
              </div>

           </div>
        </div>
    </>
  );
}
