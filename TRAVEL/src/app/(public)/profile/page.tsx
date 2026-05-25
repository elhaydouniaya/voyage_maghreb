"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import AIChatWidget from "@/components/ai/AIChatWidget";
import { formatPriceShort } from "@/lib/currency";
import {
  User,
  Calendar,
  ChevronRight,
  Heart,
  ShieldCheck,
  History,
  Sparkles
} from "lucide-react";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Toast, { useToast } from "@/components/ui/Toast";
import TripCard from "@/components/trips/TripCard";

type ClientBooking = {
  id: string;
  confirmationCode: string;
  tripTitle: string;
  destination: string;
  startDate: string;
  endDate: string;
  seats: number;
  depositPaid: number;
  totalAmount: number;
  status: string;
  agency: string;
  bookedAt: string;
};

function formatFrDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  CONFIRMED:       { label: "Confirmée",        color: "text-green-700",  bg: "bg-green-50 border-green-100" },
  PENDING_PAYMENT: { label: "En attente",        color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-100" },
  CANCELLED:       { label: "Annulée",           color: "text-red-700",    bg: "bg-red-50 border-red-100" },
  REFUNDED:        { label: "Remboursée",         color: "text-purple-700", bg: "bg-purple-50 border-purple-100" },
};

export default function ClientProfilePage() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();

  // Define these early for usage in both roles
  const sessionName = session?.user?.name || "Voyageur";
  const sessionEmail = session?.user?.email || "";
  const role = (session?.user as { role?: string })?.role || "CLIENT";

  const [activeTab, setActiveTab] = useState("bookings");
  const [favorites, setFavorites] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: sessionName,
    email: sessionEmail,
    phone: "",
  });

  const displayName = formData.name || sessionName;
  const displayEmail = formData.email || sessionEmail;
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const [settingsMessage, setSettingsMessage] = useState("");
  const [gdprBusy, setGdprBusy] = useState(false);
  const [gdprMessage, setGdprMessage] = useState("");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [aiHistory, setAiHistory] = useState<any[]>([]);
  const [guideMessages, setGuideMessages] = useState<any[]>([]);
  const [bookings, setBookings] = useState<ClientBooking[]>([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; title: string } | null>(null);
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    if (status !== "authenticated") return;
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/me");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
          });
        }
      } catch {
        /* ignore */
      }
    }
    loadProfile();
  }, [status]);

  useEffect(() => {
    if (status !== "authenticated" || role !== "CLIENT") return;

    let cancelled = false;

    async function loadBookings() {
      try {
        const res = await fetch("/api/bookings/me", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && res.ok) {
          setBookings(data.bookings || []);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    }

    loadBookings();
    return () => {
      cancelled = true;
    };
  }, [status, role]);

  useEffect(() => {
    if (activeTab !== "favorites" && activeTab !== "searches" && activeTab !== "guide-ia") return;
    if (status !== "authenticated") return;

    async function loadTabData() {
      if (activeTab === "favorites") {
        try {
          const res = await fetch("/api/favorites");
          if (res.ok) {
            const data = await res.json();
            setFavorites(data.trips || []);
            return;
          }
        } catch {
          /* fallback */
        }
        const stored = JSON.parse(localStorage.getItem("mv_favorites") || "[]");
        setFavorites(stored);
      }
      if (activeTab === "guide-ia") {
        try {
          const res = await fetch("/api/ai/guide-chat", { cache: "no-store" });
          if (res.ok) {
            const data = await res.json();
            setGuideMessages(data.messages || []);
            return;
          }
        } catch {
          /* ignore */
        }
        setGuideMessages([]);
      }
      if (activeTab === "searches") {
        try {
          const res = await fetch("/api/ai/history");
          if (res.ok) {
            const data = await res.json();
            setAiHistory(data.history || []);
            return;
          }
        } catch {
          /* fallback */
        }
        const stored = JSON.parse(localStorage.getItem("travel_ai_history") || "[]");
        setAiHistory(stored);
      }
    }

    loadTabData();
  }, [activeTab, status]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const totalSpent = bookings.reduce((acc, b) => acc + b.depositPaid, 0);
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;

  const handleCancelBooking = async () => {
    if (!cancelTarget) return;
    const { id: bookingId, title: tripTitle } = cancelTarget;
    setCancellingId(bookingId);
    try {
      const res = await fetch("/api/bookings/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Annulation impossible.", "error");
        return;
      }
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "CANCELLED" } : b
        )
      );
      showToast(`Réservation « ${tripTitle} » annulée.`, "success");
      setCancelTarget(null);
    } catch {
      showToast("Erreur réseau.", "error");
    } finally {
      setCancellingId(null);
    }
  };

  if (role === "AGENCY") {
    return (
      <div className="max-w-2xl mx-auto px-6 py-24 text-center space-y-8">
        <div className="w-24 h-24 bg-orange-500/10 rounded-[2rem] flex items-center justify-center text-orange-600 mx-auto">
          <User size={40} />
        </div>
        <h1 className="text-3xl font-black text-[#0F172A]">Espace Agence</h1>
          <p className="text-gray-500 font-medium leading-relaxed">
            Pour gérer vos voyages et vos leads, veuillez vous rendre sur votre tableau de bord dédié.
          </p>
        <Link
          href="/agency/dashboard"
          className="inline-block bg-[#0F172A] text-white font-black px-10 py-4 rounded-full shadow-xl shadow-black/10 hover:bg-black transition-all uppercase tracking-widest text-sm"
        >
          Accéder au Dashboard →
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
          <Link href="/" className="hover:text-orange-600 transition-colors">
            Accueil
          </Link>
          <ChevronRight size={10} />
          <span className="text-[#0F172A]">Mon Profil</span>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="bg-[#0F172A] px-10 py-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center gap-6 relative z-10">
              <div className="w-20 h-20 bg-orange-600 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-xl shadow-orange-600/30 shrink-0">
                {initials}
              </div>
              <div>
                <h1 className="text-3xl font-black text-white tracking-tight">{displayName}</h1>
                <p className="text-gray-400 font-bold text-sm mt-1">{displayEmail}</p>
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
              <div className="text-3xl font-black text-[#0F172A]">{bookings.length}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Réservations</div>
            </div>
            <div className="p-8 text-center">
              <div className="text-3xl font-black text-orange-600">{confirmedCount}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Confirmées</div>
            </div>
            <div className="p-8 text-center">
              <div className="text-3xl font-black text-[#0F172A]">{formatPriceShort(totalSpent)}</div>
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Acomptes payés</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 p-1 bg-white rounded-full border border-gray-100 w-fit">
          {[
            { id: "bookings", label: "Réservations" },
            { id: "favorites", label: "Favoris" },
            { id: "guide-ia", label: "Guide IA" },
            { id: "searches", label: "Recherches" },
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
                  {bookingsLoading ? (
                    <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest py-12">
                      Chargement des réservations...
                    </p>
                  ) : bookings.length === 0 ? (
                    <div className="py-16 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                      <Calendar size={40} className="text-gray-200 mx-auto mb-4" />
                      <p className="text-gray-500 font-bold text-sm">Aucune réservation pour le moment</p>
                      <Link
                        href="/voyages"
                        className="inline-block mt-6 bg-orange-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest"
                      >
                        Explorer les voyages
                      </Link>
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 group hover:border-orange-500/30 transition-all"
                      >
                        <div className="flex flex-col lg:flex-row justify-between gap-10">
                          <div className="space-y-6 flex-1">
                            <div className="flex flex-wrap items-center gap-4">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">
                                #{booking.confirmationCode}
                              </span>
                              <span
                                className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border ${STATUS_MAP[booking.status]?.bg || "bg-gray-50"} ${STATUS_MAP[booking.status]?.color || "text-gray-500"}`}
                              >
                                {STATUS_MAP[booking.status]?.label || booking.status}
                              </span>
                            </div>
                            <h3 className="text-2xl font-black text-[#0F172A] tracking-tight">
                              {booking.tripTitle}
                            </h3>
                            <p className="text-xs font-bold text-gray-400">
                              {booking.destination} · {formatFrDate(booking.startDate)} →{" "}
                              {formatFrDate(booking.endDate)}
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-gray-50 text-[11px] font-bold text-gray-500">
                              <div>
                                <p className="text-gray-400 uppercase text-[9px] mb-1">Passagers</p>
                                {booking.seats} pers.
                              </div>
                              <div>
                                <p className="text-gray-400 uppercase text-[9px] mb-1">Acompte</p>
                                {formatPriceShort(booking.depositPaid)}
                              </div>
                              <div>
                                <p className="text-gray-400 uppercase text-[9px] mb-1">Total</p>
                                {formatPriceShort(booking.totalAmount)}
                              </div>
                              <div>
                                <p className="text-gray-400 uppercase text-[9px] mb-1">Agence</p>
                                {booking.agency}
                              </div>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                              Réservé le {formatFrDate(booking.bookedAt)}
                            </p>
                            {["CONFIRMED", "CANCELLED", "REFUNDED"].includes(
                              booking.status
                            ) && (
                              <Link
                                href={`/booking/receipt/${booking.confirmationCode}`}
                                target="_blank"
                                className="inline-block text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700 mr-6"
                              >
                                Reçu / facture →
                              </Link>
                            )}
                            {booking.status === "CONFIRMED" && (
                              <button
                                type="button"
                                disabled={cancellingId === booking.id}
                                onClick={() =>
                                  setCancelTarget({ id: booking.id, title: booking.tripTitle })
                                }
                                className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 disabled:opacity-50"
                              >
                                {cancellingId === booking.id
                                  ? "Annulation..."
                                  : "Demander l'annulation"}
                              </button>
                            )}
                            {booking.status === "CANCELLED" && (
                              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">
                                Remboursement en cours de traitement par l&apos;équipe
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
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



          {activeTab === "guide-ia" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                     <Sparkles size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#0F172A]">Conversations avec votre guide</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Chat personnel (widget en bas à droite)</p>
                  </div>
               </div>
               {guideMessages.length > 0 ? (
                 <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 space-y-4 max-h-[480px] overflow-y-auto">
                    {guideMessages.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs font-medium leading-relaxed whitespace-pre-wrap ${
                            msg.role === "user"
                              ? "bg-[#0F172A] text-white rounded-tr-none"
                              : "bg-[#F8FAFC] text-[#0F172A] border border-gray-100 rounded-tl-none"
                          }`}
                        >
                          {msg.content}
                        </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="py-20 text-center bg-white rounded-[3rem] border border-dashed border-gray-200">
                    <Sparkles size={48} className="text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Aucune conversation enregistrée</p>
                    <p className="text-gray-400 text-sm mt-2">Ouvrez le guide (icône chat) pour commencer</p>
                 </div>
               )}
            </div>
          )}

          {activeTab === "searches" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                     <History size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-[#0F172A]">Recherches « Trouver mon voyage »</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Configurateur public /recherche — distinct du guide chat</p>
                  </div>
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
                            {item.status && (
                              <span className="text-[9px] font-bold text-gray-400 bg-gray-50 px-3 py-1 rounded-full uppercase tracking-widest">
                                {item.status}
                              </span>
                            )}
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
                     <input
                       id="full-name"
                       type="text"
                       value={formData.name}
                       onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                       title="Nom complet"
                       className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-4 font-bold text-[#0F172A]"
                     />
                  </div>
                  <div className="space-y-2">
                     <label htmlFor="email-address" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                     <input id="email-address" type="email" value={formData.email} disabled title="Adresse email (non modifiable)" className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-400" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                     <label htmlFor="phone" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                     <input
                       id="phone"
                       type="tel"
                       value={formData.phone}
                       onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                       placeholder="+33 6 12 34 56 78"
                       title="Numéro de téléphone"
                       className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-4 font-bold text-[#0F172A]"
                     />
                  </div>
               </div>
               {settingsMessage && (
                 <p className="mt-6 text-sm font-bold text-green-600">{settingsMessage}</p>
               )}
               <button
                 type="button"
                 disabled={settingsSaving}
                 onClick={async () => {
                   setSettingsSaving(true);
                   setSettingsMessage("");
                   try {
                     const res = await fetch("/api/user/me", {
                       method: "PATCH",
                       headers: { "Content-Type": "application/json" },
                       body: JSON.stringify({ name: formData.name, phone: formData.phone }),
                     });
                     const data = await res.json();
                     if (res.ok) {
                       setFormData({
                         name: data.user.name || "",
                         email: data.user.email || "",
                         phone: data.user.phone || "",
                       });
                       await updateSession({ name: data.user.name });
                       setSettingsMessage("Profil mis à jour.");
                     } else {
                       setSettingsMessage(data.error || "Erreur.");
                     }
                   } catch {
                     setSettingsMessage("Erreur réseau.");
                   } finally {
                     setSettingsSaving(false);
                   }
                 }}
                 className="mt-10 bg-orange-600 text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition-all disabled:opacity-50"
               >
                 {settingsSaving ? "Enregistrement..." : "Enregistrer"}
               </button>

               {role === "CLIENT" && (
                 <div className="mt-16 pt-10 border-t border-gray-100">
                   <h3 className="text-sm font-black text-[#0F172A] flex items-center gap-2 mb-2">
                     <ShieldCheck size={18} className="text-orange-500" />
                     Données personnelles (RGPD)
                   </h3>
                   <p className="text-xs text-gray-500 font-bold mb-6 max-w-xl">
                     Téléchargez une copie de vos réservations, recherches IA et favoris.
                     La suppression anonymise votre compte (les réservations passées restent
                     archivées pour la comptabilité).
                   </p>
                   <div className="flex flex-wrap gap-4">
                     <button
                       type="button"
                       disabled={gdprBusy}
                       onClick={async () => {
                         setGdprBusy(true);
                         setGdprMessage("");
                         try {
                           const res = await fetch("/api/user/gdpr/export");
                           if (!res.ok) {
                             const d = await res.json();
                             setGdprMessage(d.error || "Export impossible.");
                             return;
                           }
                           const blob = await res.blob();
                           const url = URL.createObjectURL(blob);
                           const a = document.createElement("a");
                           a.href = url;
                           a.download = `maghrebvoyage-donnees.json`;
                           a.click();
                           URL.revokeObjectURL(url);
                           setGdprMessage("Export téléchargé.");
                         } catch {
                           setGdprMessage("Erreur réseau.");
                         } finally {
                           setGdprBusy(false);
                         }
                       }}
                       className="bg-[#F8FAFC] border border-gray-100 text-[#0F172A] px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:border-orange-500/30 disabled:opacity-50"
                     >
                       Télécharger mes données
                     </button>
                     <button
                       type="button"
                       disabled={gdprBusy}
                       onClick={async () => {
                         const ok = window.confirm(
                           'Supprimer définitivement votre compte ? Tapez OK puis confirmez. Cette action est irréversible.'
                         );
                         if (!ok) return;
                         setGdprBusy(true);
                         setGdprMessage("");
                         try {
                           const res = await fetch("/api/user/gdpr/delete", {
                             method: "POST",
                             headers: { "Content-Type": "application/json" },
                             body: JSON.stringify({ confirm: "SUPPRIMER" }),
                           });
                           const data = await res.json();
                           if (res.ok) {
                             await signOut({ redirect: false });
                             router.push("/login?deleted=1");
                           } else {
                             setGdprMessage(data.error || "Suppression impossible.");
                           }
                         } catch {
                           setGdprMessage("Erreur réseau.");
                         } finally {
                           setGdprBusy(false);
                         }
                       }}
                       className="text-[10px] font-black uppercase tracking-widest text-red-600 hover:text-red-700 disabled:opacity-50 px-4 py-4"
                     >
                       Supprimer mon compte
                     </button>
                   </div>
                   {gdprMessage && (
                     <p className="mt-4 text-sm font-bold text-gray-600">{gdprMessage}</p>
                   )}
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      {role === "CLIENT" && <AIChatWidget />}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Annuler la réservation ?"
        message={
          cancelTarget
            ? `Annuler « ${cancelTarget.title} » ? L'acompte pourra être remboursé selon la politique de l'agence.`
            : ""
        }
        confirmLabel="Annuler la réservation"
        cancelLabel="Garder"
        variant="danger"
        loading={!!cancellingId}
        onConfirm={handleCancelBooking}
        onCancel={() => setCancelTarget(null)}
      />

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}
    </>
  );
}
