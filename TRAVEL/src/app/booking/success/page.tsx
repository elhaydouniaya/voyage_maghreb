"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { formatPriceShort } from "@/lib/currency";
import {
  CheckCircle2,
  ArrowRight,
  Calendar,
  MapPin,
  Mail,
  Phone,
  ExternalLink,
  Loader2,
} from "lucide-react";

type BookingSummary = {
  id?: string;
  confirmationCode: string;
  tripTitle: string;
  destination: string;
  startDate: string;
  endDate: string;
  coverImage: string;
  depositAmount: number;
  totalPrice: number;
  agencyName: string;
  agencyEmail: string;
  agencyPhone: string;
};

function formatFrDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [emailInfo, setEmailInfo] = useState<{
    sent: boolean;
    to?: string;
    mode?: string;
  } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const bookingId = searchParams.get("bookingId");
    const sessionId = searchParams.get("session_id");
    if (!bookingId && !sessionId) {
      setError("Aucune réservation à afficher.");
      return;
    }

    const qs = sessionId
      ? `session_id=${encodeURIComponent(sessionId)}`
      : `bookingId=${encodeURIComponent(bookingId!)}`;

    fetch(`/api/bookings/lookup?${qs}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.booking) {
          setBooking(data.booking);
          if (data.emailSent) {
            setEmailInfo({
              sent: true,
              to: data.emailTo,
              mode: data.emailMode,
            });
          }
        } else {
          setError(data.error || "Réservation introuvable.");
        }
      })
      .catch(() => setError("Impossible de charger la réservation."));
  }, [searchParams]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6">
        <div className="text-center space-y-4 max-w-md">
          <p className="text-red-600 font-bold">{error}</p>
          <Link
            href="/profile"
            className="inline-block bg-[#0F172A] text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest"
          >
            Mon profil
          </Link>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center gap-3">
        <Loader2 className="animate-spin text-orange-600" size={28} />
        <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
          Confirmation en cours...
        </span>
      </div>
    );
  }

  const remainingAmount = booking.totalPrice - booking.depositAmount;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-6 py-20 font-outfit">
      <div className="max-w-3xl w-full">
        <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="bg-orange-600 p-12 md:p-16 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-white/10 blur-3xl rounded-full -translate-y-1/2" />
            <div className="relative z-10 space-y-4">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mx-auto mb-2 border border-white/30 shadow-xl">
                <CheckCircle2 size={44} strokeWidth={3} />
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Réservation confirmée !
              </h1>
              <p className="text-orange-100 font-black uppercase tracking-[0.2em] text-[10px]">
                Votre place est désormais garantie
              </p>
              {emailInfo?.sent && (
                <p className="text-orange-50 text-sm font-medium mt-4 max-w-md mx-auto">
                  {emailInfo.mode === "console" ? (
                    <>
                      Confirmation enregistrée — consultez la{" "}
                      <strong>console du serveur</strong> (mode dev sans Resend) ou
                      configurez <code className="text-orange-100">RESEND_DEV_TO</code> dans
                      .env.
                    </>
                  ) : (
                    <>
                      Un email de confirmation a été envoyé à{" "}
                      <strong>{emailInfo.to || "votre adresse"}</strong>.
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="p-10 md:p-16 grid md:grid-cols-2 gap-12">
            <div className="space-y-10">
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">
                  Détails du voyage
                </h3>
                <div className="flex items-start gap-5">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 shadow-sm relative">
                    <Image
                      src={
                        booking.coverImage ||
                        "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=200&auto=format&fit=crop"
                      }
                      alt={booking.tripTitle}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-lg font-black text-[#0F172A] leading-tight">
                      {booking.tripTitle}
                    </h4>
                    <div className="flex flex-col gap-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-orange-500" />{" "}
                        {booking.destination}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={12} className="text-orange-500" />{" "}
                        {formatFrDate(booking.startDate)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">
                  Paiement
                </h3>
                <div className="space-y-3">
                  <div className="bg-[#F8FAFC] p-6 rounded-3xl border border-gray-50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      Acompte payé
                    </span>
                    <span className="text-xl font-black text-[#10B981]">
                      {formatPriceShort(booking.depositAmount)}
                    </span>
                    <p className="text-[9px] text-gray-400 font-bold text-right">(~{Math.round(booking.depositAmount)} €)</p>
                  </div>
                  <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100/50 flex justify-between items-center">
                    <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest">
                      Reste à régler sur place
                    </span>
                    <span className="text-xl font-black text-orange-600">
                      {formatPriceShort(remainingAmount)}
                    </span>
                    <p className="text-[9px] text-orange-400/80 font-bold text-right">(~{Math.round(remainingAmount)} €)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-10">
              <div className="bg-[#F8FAFC] border border-gray-100 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-inner">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                  Code de confirmation
                </span>
                <div className="text-4xl font-black text-[#0F172A] tracking-tighter mb-2">
                  {booking.confirmationCode}
                </div>
                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  À présenter à l&apos;agence
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">
                  Votre organisateur
                </h3>
                <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#0F172A] rounded-2xl flex items-center justify-center text-white font-black text-lg">
                      {booking.agencyName[0]}
                    </div>
                    <div>
                      <div className="text-sm font-black text-[#0F172A]">
                        {booking.agencyName}
                      </div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                        Agence partenaire
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                      <Mail size={16} className="text-orange-500" />{" "}
                      {booking.agencyEmail}
                    </div>
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-600">
                      <Phone size={16} className="text-orange-500" />{" "}
                      {booking.agencyPhone}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full mt-4 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#F8FAFC] text-[10px] font-black uppercase tracking-widest text-[#0F172A] hover:bg-orange-50 hover:text-orange-600 transition-all border border-gray-100"
                  >
                    Contacter l&apos;agence <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-10 md:p-16 bg-[#F8FAFC] border-t border-gray-50 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 space-y-1">
              <p className="text-xs font-black text-[#0F172A] uppercase tracking-widest">
                Voir dans votre profil
              </p>
              <p className="text-[10px] text-gray-400 font-medium">
                Retrouvez cette réservation dans l&apos;onglet Réservations.
              </p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <Link
                href="/profile"
                className="flex-1 md:flex-none bg-orange-600 text-white font-black px-8 py-5 rounded-full text-xs uppercase tracking-widest flex items-center justify-center gap-2"
              >
                Mes réservations
              </Link>
              <Link
                href="/"
                className="flex-1 md:flex-none bg-[#0F172A] text-white font-black px-12 py-5 rounded-full text-xs uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all"
              >
                Accueil <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <Loader2 className="animate-spin text-orange-600" size={28} />
        </div>
      }
    >
      <BookingSuccessContent />
    </Suspense>
  );
}
