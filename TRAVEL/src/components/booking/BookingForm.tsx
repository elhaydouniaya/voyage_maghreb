"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CreditCard, ShieldCheck, User, Mail, Phone, ArrowRight } from "lucide-react";
import { formatPriceShort, formatDeposit } from "@/lib/currency";
import { useSession } from "next-auth/react";

const COUNTRIES = [
  "France",
  "Belgique",
  "Canada",
  "Suisse",
  "Maroc",
  "Algérie",
  "Tunisie",
  "Autre",
];

interface BookingFormProps {
  tripId: string;
  tripTitle: string;
  totalPrice: number;
  depositAmount: number;
  destination: string;
  startDate: string;
  coverImage: string;
  spotsLeft?: number;
  isSoldOut?: boolean;
}

export default function BookingForm({
  tripId,
  tripTitle,
  totalPrice,
  depositAmount,
  destination,
  startDate,
  coverImage,
  spotsLeft,
  isSoldOut = false,
}: BookingFormProps) {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const fullName = session?.user?.name || "";
  const nameParts = fullName.trim().split(/\s+/);
  const [formData, setFormData] = useState({
    clientFirstName: nameParts[0] || "",
    clientLastName: nameParts.slice(1).join(" ") || "",
    clientEmail: session?.user?.email || "",
    clientPhone: "",
    clientCountry: "France",
    numberOfSeats: 1,
    notes: "",
    acceptCgu: false,
    acceptRgpd: false,
  });

  const soldOut = isSoldOut || (spotsLeft !== undefined && spotsLeft <= 0);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (soldOut) return;
    if (!formData.acceptCgu || !formData.acceptRgpd) {
      alert("Veuillez accepter les CGU et la politique RGPD.");
      return;
    }
    const clientName = `${formData.clientFirstName.trim()} ${formData.clientLastName.trim()}`.trim();
    if (formData.clientFirstName.trim().length < 2 || formData.clientLastName.trim().length < 2) {
      alert("Prénom et nom sont obligatoires (min. 2 caractères chacun).");
      return;
    }
    setIsLoading(true);

    const bookingData = {
      ...formData,
      clientName,
      tripId,
      tripTitle,
      totalPrice,
      depositAmount,
      destination,
      startDate,
      coverImage,
    };

    localStorage.setItem("pending_booking", JSON.stringify(bookingData));
    window.location.href = `/booking/checkout?id=${tripId}`;
  };

  if (soldOut) {
    return (
      <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-2xl space-y-6 text-center">
        <span className="inline-block bg-gray-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full">
          Complet
        </span>
        <p className="text-gray-500 font-bold text-sm">
          Toutes les places sont réservées pour ce départ.
        </p>
        <Link
          href="/voyages"
          className="inline-block bg-orange-600 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest"
        >
          Voir d&apos;autres voyages
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-[3.5rem] border border-gray-100 shadow-2xl shadow-orange-500/5 space-y-8">
      <div className="flex gap-4 p-4 bg-[#F8FAFC] rounded-[2rem] border border-gray-100">
        <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-sm relative">
          <Image
            src={
              coverImage ||
              "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=200&auto=format&fit=crop"
            }
            alt={tripTitle}
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h4 className="text-sm font-black text-[#0F172A] leading-tight mb-1">{tripTitle}</h4>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
            {destination} • {startDate}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-end border-b border-gray-50 pb-6">
        <div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">
            Prix Total
          </span>
          <div className="text-3xl font-black text-[#0F172A] tracking-tighter">
            {formatPriceShort(totalPrice)}
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block mb-1">
            Acompte
          </span>
          <div className="text-2xl font-black text-orange-600 tracking-tighter">
            {formatDeposit(depositAmount)}
          </div>
        </div>
      </div>

      <form onSubmit={step === 1 ? handleNextStep : handleBooking} className="space-y-6">
        {step === 1 ? (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="space-y-3">
              <label
                htmlFor="numberOfSeats"
                className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
              >
                Nombre de voyageurs
              </label>
              <select
                id="numberOfSeats"
                value={formData.numberOfSeats}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    numberOfSeats: parseInt(e.target.value, 10),
                  }))
                }
                title="Nombre de voyageurs"
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] appearance-none transition-all"
              >
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n} {n > 1 ? "Personnes" : "Personne"}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-[#0F172A] text-white py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-black/10 hover:opacity-90 transition-all flex items-center justify-center gap-3"
            >
              Continuer <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-4 top-4 text-gray-300" size={18} />
                  <input
                    type="text"
                    required
                    minLength={2}
                    placeholder="Prénom"
                    value={formData.clientFirstName}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, clientFirstName: e.target.value }))
                    }
                    className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-12 pr-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                  />
                </div>
                <input
                  type="text"
                  required
                  minLength={2}
                  placeholder="Nom"
                  value={formData.clientLastName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, clientLastName: e.target.value }))
                  }
                  className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-4 top-4 text-gray-300" size={18} />
                <input
                  type="email"
                  required
                  placeholder="Votre Email"
                  value={formData.clientEmail}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, clientEmail: e.target.value }))
                  }
                  className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-12 pr-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-4 top-4 text-gray-300" size={18} />
                <input
                  type="tel"
                  placeholder="Téléphone (facultatif)"
                  value={formData.clientPhone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, clientPhone: e.target.value }))
                  }
                  className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-12 pr-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="clientCountry"
                  className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 block mb-2"
                >
                  Pays de résidence
                </label>
                <select
                  id="clientCountry"
                  value={formData.clientCountry}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, clientCountry: e.target.value }))
                  }
                  className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A]"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Message / notes (facultatif)"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-medium text-[#0F172A] resize-none text-sm"
              />
            </div>

            <div className="space-y-3 text-sm">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptCgu}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, acceptCgu: e.target.checked }))
                  }
                  className="mt-1"
                />
                <span>
                  J&apos;accepte les{" "}
                  <Link href="/legal/cgu" className="text-orange-600 underline" target="_blank">
                    CGU
                  </Link>
                </span>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.acceptRgpd}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, acceptRgpd: e.target.checked }))
                  }
                  className="mt-1"
                />
                <span>
                  J&apos;accepte la{" "}
                  <Link
                    href="/legal/confidentialite"
                    className="text-orange-600 underline"
                    target="_blank"
                  >
                    politique RGPD
                  </Link>{" "}
                  (transmission des données à l&apos;agence)
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white py-5 rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:bg-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {isLoading ? (
                "CHARGEMENT..."
              ) : (
                <>
                  Payer l&apos;acompte ({formatDeposit(depositAmount * formData.numberOfSeats)}){" "}
                  <CreditCard size={18} />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
            >
              ← Modifier le nombre de voyageurs
            </button>
          </div>
        )}
      </form>

      <div className="flex flex-col items-center gap-4 pt-4">
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          <ShieldCheck size={14} className="text-[#10B981]" /> Paiement 100% Sécurisé Stripe
        </div>
        <p className="text-[9px] text-gray-300 text-center leading-relaxed px-4">
          Aucun compte requis. Votre email sert uniquement à la confirmation de réservation.
        </p>
      </div>
    </div>
  );
}
