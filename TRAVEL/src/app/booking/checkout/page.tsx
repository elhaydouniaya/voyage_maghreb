"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { loadTravelRequestId } from "@/lib/ai-match-storage";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, CreditCard, Lock, ChevronRight } from "lucide-react";
import { formatDeposit } from "@/lib/currency";
import { trackBehaviorEvent } from "@/components/analytics/BehaviorTracker";

type PendingBooking = {
  tripId: string;
  tripTitle: string;
  destination: string;
  coverImage?: string;
  numberOfSeats?: number;
  depositAmount?: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  acceptCgu?: boolean;
  acceptRgpd?: boolean;
};

export default function CheckoutPage() {
  const { data: session } = useSession();
  const accountEmail = session?.user?.email || "";
  const [step, setStep] = useState(1);
  const [booking, setBooking] = useState<PendingBooking | null>(null);
  const [bookingReady, setBookingReady] = useState(false);
  const [traveler, setTraveler] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCountry: "France",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const data = localStorage.getItem("pending_booking");
    if (data) {
      const parsed = JSON.parse(data) as PendingBooking;
      setBooking(parsed);
      if (parsed.clientName || parsed.clientEmail) {
        setTraveler((t) => ({
          ...t,
          clientName: parsed.clientName || t.clientName,
          clientEmail: parsed.clientEmail || t.clientEmail,
          clientPhone: parsed.clientPhone || t.clientPhone,
        }));
        if (parsed.clientName && parsed.clientEmail) setStep(2);
      }
    }
    setBookingReady(true);
    trackBehaviorEvent("CHECKOUT_START");
  }, []);

  useEffect(() => {
    if (!accountEmail) return;
    setTraveler((t) => ({ ...t, clientEmail: accountEmail }));
  }, [accountEmail]);

  const handleNext = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setTraveler({
      clientName: String(fd.get("clientName") || ""),
      clientEmail: accountEmail || String(fd.get("clientEmail") || ""),
      clientPhone: String(fd.get("clientPhone") || ""),
      clientCountry: String(fd.get("clientCountry") || "France"),
    });
    setStep(2);
  };

  const handlePayment = async () => {
    if (!booking) return;
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/payments/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groupTripId: booking.tripId,
          ...traveler,
          numberOfSeats: booking.numberOfSeats || 1,
          acceptCgu: Boolean(booking.acceptCgu ?? true),
          acceptRgpd: Boolean(booking.acceptRgpd ?? true),
          travelRequestId: loadTravelRequestId() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Réservation impossible.");
        setIsLoading(false);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.bookingId) {
        window.location.href = `/booking/success?bookingId=${encodeURIComponent(data.bookingId)}`;
        return;
      }

      setError("Réponse serveur inattendue.");
      setIsLoading(false);
    } catch {
      setError("Impossible de contacter le serveur.");
      setIsLoading(false);
    }
  };

  if (!bookingReady) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-sm font-bold text-gray-400">Chargement de votre réservation...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-lg mx-auto px-6 py-24 text-center space-y-6">
        <h1 className="text-2xl font-black text-[#0F172A]">Aucune réservation en cours</h1>
        <p className="text-gray-500 font-medium">
          Sélectionnez un voyage depuis le catalogue pour commencer votre réservation.
        </p>
        <Link
          href="/voyages"
          className="inline-block bg-orange-600 text-white font-black px-8 py-3 rounded-full hover:bg-orange-700 transition-colors"
        >
          Voir les voyages
        </Link>
      </div>
    );
  }

  const depositTotal = (booking.depositAmount || 0) * (booking.numberOfSeats || 1);
  const depositLabel = formatDeposit(depositTotal);

  return (
    <div className="pb-20 px-6">
      <div className="max-w-xl mx-auto">
        <div className="hidden md:flex items-center justify-center gap-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-10 pt-4">
          <span className={step >= 1 ? "text-orange-600" : ""}>1. Voyageur</span>
          <ChevronRight size={12} />
          <span className={step >= 2 ? "text-orange-600" : ""}>2. Paiement</span>
        </div>

        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-3xl font-black text-[#0F172A] mb-2 tracking-tight">Réservation</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-10">
              Informations du voyageur
            </p>

            <form onSubmit={handleNext} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Nom complet
                </label>
                <input
                  required
                  name="clientName"
                  type="text"
                  placeholder="Jean Dupont"
                  className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  Email
                </label>
                <input
                  required
                  name="clientEmail"
                  type="email"
                  readOnly={Boolean(accountEmail)}
                  value={accountEmail || traveler.clientEmail}
                  placeholder="jean.dupont@email.com"
                  title={
                    accountEmail
                      ? "Email de votre compte — la confirmation sera envoyée à cette adresse"
                      : undefined
                  }
                  className={`w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 transition-all ${
                    accountEmail ? "opacity-80 cursor-default" : ""
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Téléphone
                  </label>
                  <input
                    required
                    name="clientPhone"
                    type="tel"
                    placeholder="+33 6 12 34 56 78"
                    className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                    Nationalité
                  </label>
                  <select
                    id="nationality"
                    name="clientCountry"
                    title="Nationalité"
                    className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm font-medium focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-500/20 transition-all appearance-none cursor-pointer"
                  >
                    <option>France</option>
                    <option>Algérie</option>
                    <option>Maroc</option>
                    <option>Tunisie</option>
                  </select>
                </div>
              </div>
              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-[#0F172A] text-white py-5 rounded-full font-black text-lg shadow-xl shadow-black/10 hover:bg-black transition-all"
                >
                  Continuer
                </button>
              </div>
            </form>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-10">
              <button
                type="button"
                onClick={() => setStep(1)}
                title="Retour à l'étape précédente"
                className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-orange-600 transition-all"
              >
                <ArrowLeft size={18} />
              </button>
              <div>
                <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Paiement sécurisé</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                  Étape finale
                </p>
              </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-gray-50 shadow-xl overflow-hidden mb-8">
              <div className="p-10 border-b border-gray-50 bg-[#F8FAFC]/50">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Montant à payer
                    </p>
                    <p className="text-4xl font-black text-[#0F172A]">{depositLabel}</p>
                    <p className="text-[10px] text-gray-400 font-bold mt-1">(~{Math.round(depositTotal)} €)</p>
                  </div>
                  <div className="bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Acompte (30%)
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shadow-sm shrink-0 relative">
                    <Image
                      src={
                        booking.coverImage ||
                        "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=200&auto=format&fit=crop"
                      }
                      alt={booking.tripTitle}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="text-[12px] font-black text-[#0F172A] leading-tight">{booking.tripTitle}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                      {booking.destination}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-10 space-y-6">
                <div className="flex items-center gap-4 p-6 bg-[#F8FAFC] rounded-2xl border border-gray-100">
                  <CreditCard size={28} className="text-orange-600 shrink-0" />
                  <div>
                    <p className="text-xs font-black text-[#0F172A] uppercase tracking-widest">
                      Paiement sécurisé Stripe
                    </p>
                    <p className="text-sm text-gray-500 font-medium mt-1">
                      Vous serez redirigé vers Stripe pour régler l&apos;acompte en toute sécurité.
                    </p>
                  </div>
                </div>

                {error && <p className="text-red-600 text-sm font-bold text-center">{error}</p>}

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={isLoading}
                    className="w-full bg-orange-600 text-white py-5 rounded-full font-black text-lg shadow-xl shadow-orange-500/20 hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isLoading ? (
                      "Traitement..."
                    ) : (
                      <>
                        Confirmer et payer {depositLabel} <Lock size={20} />
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-[#10B981]" /> Paiement 100% sécurisé
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
