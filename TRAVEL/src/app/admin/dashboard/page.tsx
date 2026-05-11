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
  Globe, 
  ShieldCheck,
  TrendingUp,
  MoreVertical,
  AlertTriangle,
  RefreshCcw,
  ArrowRight,
  Sparkles,
  LogOut,
  MapPin
} from "lucide-react";
import { signOut } from "next-auth/react";
import { NavbarAuth } from "@/components/auth/NavbarAuth";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalBookings: 2840,
    monthBookings: 142,
    totalRevenue: 142500,
    conversionRate: 12.4,
    fillingRate: 78,
    activeTrips: 45,
    pendingAgencies: 3,
    pendingRefunds: 2
  });

  const [pendingAgencies, setPendingAgencies] = useState([
    { id: 1, name: "Sahara Tours Expert", email: "contact@sahara.com", date: "Il y a 2h", siret: "842 123 456" },
    { id: 2, name: "Atlas Adventure", email: "info@atlas.ma", date: "Il y a 14h", siret: "MA-982341" },
    { id: 3, name: "Djerba Evasion", email: "hello@djerba.tn", date: "Il y a 1j", siret: "TN-23421" },
  ]);

  const [rejectionTarget, setRejectionTarget] = useState<number | null>(null);
  const [rejectionMotif, setRejectionMotif] = useState("");
  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleValidate = (id: number) => {
    setProcessingId(id);
    setTimeout(() => {
      setPendingAgencies(prev => prev.filter(a => a.id !== id));
      setStats(prev => ({ ...prev, pendingAgencies: prev.pendingAgencies - 1 }));
      setProcessingId(null);
    }, 1000);
  };

  const handleReject = (id: number) => {
    if (rejectionTarget === id && rejectionMotif.length > 5) {
      setProcessingId(id);
      setTimeout(() => {
        setPendingAgencies(prev => prev.filter(a => a.id !== id));
        setStats(prev => ({ ...prev, pendingAgencies: prev.pendingAgencies - 1 }));
        setRejectionTarget(null);
        setRejectionMotif("");
        setProcessingId(null);
      }, 1000);
    } else {
      setRejectionTarget(id);
    }
  };

  const kpiCards = [
    { label: "Réservations totales", value: stats.totalBookings, sub: "Confirmées (Toutes périodes)", icon: CheckCircle2, color: "bg-blue-500", highlight: false },
    { label: "Réservations ce mois", value: stats.monthBookings, sub: "+12% vs mois dernier", icon: TrendingUp, color: "bg-green-500", highlight: true },
    { label: "Acomptes (ce mois)", value: `12,450€`, sub: "Cumulé: 142k€", icon: CreditCard, color: "bg-orange-500", highlight: false },
    { label: "Conversion IA", value: `${stats.conversionRate}%`, sub: "Demandes -> Bookings", icon: Sparkles, color: "bg-purple-500", highlight: false },
    { label: "Remplissage moyen", value: `${stats.fillingRate}%`, sub: "Voyages actifs", icon: BarChart3, color: "bg-pink-500", highlight: false },
    { label: "Voyages actifs", value: `${stats.activeTrips} / 52`, sub: "52 publiés au total", icon: Briefcase, color: "bg-indigo-500", highlight: false },
    { label: "Top Destinations", value: "Taghit, Marrakech", sub: "Les plus réservées", icon: MapPin, color: "bg-teal-500", highlight: false },
    { label: "Top Agences", value: "Sahara Tours, Atlas", sub: "Les plus actives", icon: Users, color: "bg-yellow-500", highlight: false },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-80 bg-[#0F172A] p-8 hidden lg:flex flex-col z-20">
         <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white">
               <Globe size={24} />
            </div>
            <span className="text-2xl font-black tracking-tight text-white">AdminPanel</span>
         </div>

         <nav className="space-y-2 flex-1">
            <div className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 ml-4">Supervision</div>
            <Link href="/admin/dashboard" className="flex items-center gap-4 text-gray-400 hover:text-white px-6 py-4 rounded-2xl font-bold transition-all hover:bg-white/5 group">
               <BarChart3 size={20} className="group-hover:text-orange-500" /> Dashboard
            </Link>
            <Link href="/admin/agencies" className="flex items-center gap-4 text-gray-400 hover:text-white px-6 py-4 rounded-2xl font-bold transition-all hover:bg-white/5 group">
               <Briefcase size={20} className="group-hover:text-orange-500" /> Agences
               {stats.pendingAgencies > 0 && <span className="ml-auto w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px]">{stats.pendingAgencies}</span>}
            </Link>
            <Link href="/admin/trips" className="flex items-center gap-4 text-gray-400 hover:text-white px-6 py-4 rounded-2xl font-bold transition-all hover:bg-white/5 group">
               <Globe size={20} className="group-hover:text-orange-500" /> Voyages
            </Link>
            <Link href="/admin/bookings" className="flex items-center gap-4 text-gray-400 hover:text-white px-6 py-4 rounded-2xl font-bold transition-all hover:bg-white/5 group">
               <CreditCard size={20} className="group-hover:text-orange-500" /> Réservations
            </Link>
            <Link href="/admin/ai-requests" className="flex items-center gap-4 text-gray-400 hover:text-white px-6 py-4 rounded-2xl font-bold transition-all hover:bg-white/5 group">
               <Sparkles size={20} className="group-hover:text-orange-500" /> Demandes IA
            </Link>
         </nav>

         <div className="mt-auto space-y-4">
            <div className="p-6 bg-white/5 rounded-[2.5rem] border border-white/10">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
                     <ShieldCheck size={16} />
                  </div>
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Stripe Production</span>
               </div>
               <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Connecté • v1.0.4</p>
            </div>

            <button 
              onClick={() => signOut({ callbackUrl: "/" })}
              className="w-full flex items-center gap-4 px-6 py-4 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded-2xl transition-all"
            >
              <LogOut size={20} />
              <span className="text-sm font-bold">Déconnexion</span>
            </button>
         </div>
      </aside>

      <main className="lg:ml-80 p-6 md:p-12">
        {/* Header */}
        <header className="flex justify-between items-center mb-12">
           <div>
              <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Tableau de bord Admin</h1>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1 ml-1">Analyse et supervision de MaghrebVoyage</p>
           </div>
           <NavbarAuth />
        </header>

        {/* KPI Grid (Module K.7) */}
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
                    {[
                      { user: "Jean Dupont", amount: "300€", trip: "Désert Oasis", reason: "Annulation client" },
                      { user: "Sarah Cohen", amount: "250€", trip: "Marrakech Express", reason: "Voyage annulé par agence" },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-6 bg-white/5 rounded-[2.5rem] border border-white/5 hover:bg-white/10 transition-all">
                         <div>
                            <p className="text-sm font-black text-white">{r.user}</p>
                            <p className="text-[10px] text-orange-500 font-black uppercase tracking-widest">{r.trip}</p>
                            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">{r.reason}</p>
                         </div>
                         <div className="text-right">
                            <p className="text-lg font-black text-white">{r.amount}</p>
                            <button className="text-[9px] font-black text-orange-500 uppercase tracking-widest hover:underline mt-1">Traiter sur Stripe</button>
                         </div>
                      </div>
                    ))}
                 </div>
                 <button className="w-full bg-white text-[#0F172A] py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/20">
                    Voir tous les remboursements
                 </button>
              </div>

              <div className="bg-white rounded-[3rem] border border-gray-100 p-10 flex items-center justify-between group cursor-pointer hover:border-orange-500/30 transition-all shadow-sm">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-all">
                       <ShieldCheck size={28} />
                    </div>
                    <div>
                       <h4 className="text-lg font-black text-[#0F172A]">Audit de sécurité</h4>
                       <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Tout est sous contrôle</p>
                    </div>
                 </div>
                 <ArrowRight size={20} className="text-gray-300 group-hover:text-[#0F172A] transition-colors" />
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
