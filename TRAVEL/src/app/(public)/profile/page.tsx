"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { NavbarAuth } from "@/components/auth/NavbarAuth";
import AIChatWidget from "@/components/ai/AIChatWidget";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Tag,
  Globe,
  ChevronRight,
  Heart,
  MessageSquare,
  Settings,
  ShieldCheck,
  LayoutDashboard,
  Trash2,
  Save,
  History,
  Sparkles
} from "lucide-react";
import TripCard from "@/components/trips/TripCard";
import { INITIAL_TRIPS } from "@/lib/trips";

// Mock data for new sections
const MOCK_FAVORITES = [INITIAL_TRIPS[0], INITIAL_TRIPS[2]];
const MOCK_CHATS = [
  { id: "c1", date: "Hier", summary: "Recherche voyage Algérie / Sud", messages: 8 },
  { id: "c2", date: "15 Mai", summary: "Conseils pour Marrakech avec enfants", messages: 5 },
];

// Mock bookings for the logged-in client
const MOCK_BOOKINGS = [
  {
    id: "bk1",
    confirmationCode: "MV-038241",
    tripTitle: "Réveillon à Taghit 2025",
    destination: "Taghit, Algérie",
    startDate: "27 Déc 2024",
    endDate: "02 Jan 2025",
    seats: 2,
    depositPaid: 600,
    totalAmount: 2500,
    status: "CONFIRMED",
    agency: "Sahara Tours Expert",
    bookedAt: "14 Novembre 2024",
  },
  {
    id: "bk2",
    confirmationCode: "MV-019847",
    tripTitle: "Découverte de Marrakech",
    destination: "Marrakech, Maroc",
    startDate: "05 Avr 2025",
    endDate: "12 Avr 2025",
    seats: 1,
    depositPaid: 200,
    totalAmount: 890,
    status: "CONFIRMED",
    agency: "Maroc Experience",
    bookedAt: "02 Janvier 2025",
  },
];

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED:       { label: "Confirmée",        color: "text-green-700",  bg: "bg-green-50 border-green-100" },
  PENDING_PAYMENT: { label: "En attente",        color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-100" },
  CANCELLED:       { label: "Annulée",           color: "text-red-700",    bg: "bg-red-50 border-red-100" },
  REFUNDED:        { label: "Remboursée",         color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
};

export default function ClientProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Define these early for usage in both roles
  const name = session?.user?.name || "Voyageur";
  const email = session?.user?.email || "";
  const role = (session?.user as any)?.role || "CLIENT";
  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const [activeTab, setActiveTab] = useState("bookings");
  const [favorites, setFavorites] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: name,
    email: email,
    phone: "+213 6 12 34 56 78",
    address: "Alger, Algérie"
  });
  const [aiHistory, setAiHistory] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === "favorites") {
      const stored = JSON.parse(localStorage.getItem("mv_favorites") || "[]");
      setFavorites(stored);
    }
    if (activeTab === "ai-history") {
      const stored = JSON.parse(localStorage.getItem("travel_ai_history") || "[]");
      setAiHistory(stored);
    }
  }, [activeTab]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const totalSpent = MOCK_BOOKINGS.reduce((acc, b) => acc + b.depositPaid, 0);
  const confirmedCount = MOCK_BOOKINGS.filter(b => b.status === "CONFIRMED").length;

  if (role === "AGENCY") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-outfit">
        <nav className="sticky top-0 w-full bg-white/80 backdrop-blur-md px-6 md:px-12 py-5 flex justify-between items-center z-50">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
               <Globe size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F172A]">MaghrebVoyage</span>
          </Link>
          <NavbarAuth />
        </nav>
        <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-8">
          <div className="w-24 h-24 bg-orange-500/10 rounded-[2rem] flex items-center justify-center text-orange-600 mx-auto">
            <User size={40} />
          </div>
          <h1 className="text-3xl font-black text-[#0F172A]">Espace Agence</h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            Pour gérer vos voyages et vos leads, veuillez vous rendre sur votre tableau de bord dédié.
          </p>
          <Link href="/agency/dashboard" className="inline-block bg-[#0F172A] text-white font-black px-10 py-4 rounded-full shadow-xl shadow-black/10 hover:bg-black transition-all uppercase tracking-widest text-sm">
            Accéder au Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Navbar */}
      <nav className="sticky top-0 w-full bg-white/80 backdrop-blur-md px-6 md:px-12 py-5 flex justify-between items-center z-50">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white">
               <Globe size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F172A] hidden md:block">MaghrebVoyage</span>
          </Link>
          <div className="hidden md:flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest border-l border-gray-100 pl-6">
             <Link href="/" className="hover:text-orange-600 transition-colors">Accueil</Link>
             <ChevronRight size={10} />
             <span className="text-[#0F172A]">Mon Profil</span>
          </div>
        </div>
        <NavbarAuth />
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-10">

        {/* Profile Card */}
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#0F172A] px-10 py-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 bg-orange-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-orange-600/30 shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">{name}</h1>
                <p className="text-gray-400 font-bold text-sm mt-1">{email}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="bg-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-orange-500/30">
                    Voyageur vérifié
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
            <div className="p-8 text-center">
              <div className="text-3xl font-black text-[#0F172A]">{MOCK_BOOKINGS.length}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Réservations</div>
            </div>
            <div className="p-8 text-center">
              <div className="text-3xl font-black text-orange-600">{confirmedCount}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Confirmées</div>
            </div>
            <div className="p-8 text-center">
              <div className="text-3xl font-black text-[#0F172A]">{totalSpent}€</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Acomptes payés</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-white rounded-full border border-gray-100 w-fit">
          {[
            { id: "bookings", label: "Réservations" },
            { id: "favorites", label: "Favoris" },
            { id: "ai-history", label: "Historique IA" },
            { id: "settings", label: "Paramètres" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id 
                  ? "bg-[#0F172A] text-white shadow-lg" 
                  : "text-gray-400 hover:text-[#0F172A]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

         {/* Tabs Content */}
        <div className="space-y-10">
          {activeTab === "bookings" && (
            <div className="space-y-10 animate-in fade-in duration-500">
              {/* Existing Bookings & Offers logic */}
              <div className="space-y-6">
                <h2 className="text-xl font-black text-[#0F172A] flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600 border border-orange-100">
                    <Calendar size={16} />
                  </div>
                  Mes réservations
                </h2>
                <div className="space-y-6">
                  {MOCK_BOOKINGS.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 group hover:border-orange-500/30 transition-all">
                      <div className="flex flex-col lg:flex-row justify-between gap-10">
                        <div className="space-y-6 flex-1">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">#{booking.confirmationCode}</span>
                            <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${STATUS_MAP[booking.status]?.bg || 'bg-gray-50'} ${STATUS_MAP[booking.status]?.color || 'text-gray-500'}`}>
                              {STATUS_MAP[booking.status]?.label || booking.status}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">{booking.tripTitle}</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-50 text-[11px] font-bold text-gray-500">
                             <div><p className="text-gray-400 uppercase text-[9px] mb-1">Passagers</p>{booking.seats} pers.</div>
                             <div><p className="text-gray-400 uppercase text-[9px] mb-1">Acompte</p>{booking.depositPaid}€</div>
                             <div><p className="text-gray-400 uppercase text-[9px] mb-1">Total</p>{booking.totalAmount}€</div>
                             <div><p className="text-gray-400 uppercase text-[9px] mb-1">Agence</p>{booking.agency}</div>
                          </div>
                        </div>
                        <button className="bg-[#0F172A] text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors self-center">Détails</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "favorites" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               {favorites.length > 0 ? (
                 favorites.map(trip => (
                   <TripCard key={trip.id} trip={trip} />
                 ))
               ) : (
                 <div className="col-span-full py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <Heart size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Aucun favori pour le moment</p>
                 </div>
               )}
            </div>
          )}



          {activeTab === "ai-history" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                     <History size={20} />
                  </div>
                  <h2 className="text-xl font-black text-[#0F172A]">Mes dernières recherches</h2>
               </div>
               {aiHistory.length > 0 ? (
                 <div className="grid grid-cols-1 gap-6">
                    {aiHistory.map((item) => (
                      <div key={item.id} className="bg-white rounded-[2.5rem] border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 group hover:border-orange-500/30 transition-all">
                         <div className="space-y-2">
                            <div className="flex items-center gap-3">
                               <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">{new Date(item.date).toLocaleDateString('fr-FR')}</span>
                               <span className="w-1 h-1 bg-gray-200 rounded-full" />
                               <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{item.destination}</span>
                            </div>
                            <h3 className="text-lg font-black text-[#0F172A]">{item.summary}</h3>
                            <div className="flex gap-2">
                               {item.results.map((r: any, idx: number) => (
                                 <span key={idx} className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{r.title}</span>
                               ))}
                            </div>
                         </div>
                         <Link href="/recherche" className="bg-[#F8FAFC] text-[#0F172A] px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-100 hover:bg-orange-600 hover:text-white hover:border-orange-600 transition-all">Relancer →</Link>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <Sparkles size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Aucune recherche enregistrée</p>
                    <Link href="/recherche" className="inline-block mt-6 text-orange-600 text-[10px] font-black uppercase tracking-widest hover:underline underline-offset-4">Commencer ma première recherche IA</Link>
                 </div>
               )}
            </div>
          )}

          {activeTab === "settings" && (
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-2">
                     <label htmlFor="full-name" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom complet</label>
                     <input id="full-name" type="text" defaultValue={formData.name} title="Nom complet" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-4 font-bold text-[#0F172A]" />
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="email-address" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                     <input id="email-address" type="email" defaultValue={formData.email} disabled title="Adresse email (non modifiable)" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-400" />
                  </div>
               </div>
               <button className="mt-10 bg-orange-600 text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition-all">Enregistrer</button>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-[#0F172A] py-12 px-6 text-center mt-20">
         <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
            © 2026 MaghrebVoyage — Votre compagnon de voyage
         </p>
      </footer>

      <AIChatWidget />
    </div>
  );
}
