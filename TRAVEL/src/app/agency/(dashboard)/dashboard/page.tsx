"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, CheckCircle2, Loader2 } from "lucide-react";
import { getFallbackImage } from "@/lib/images";

type DashboardData = {
  stats: {
    activeTrips: number;
    confirmedBookings: number;
    remainingSpots: number;
    totalRevenue: number;
  };
  recentBookings: Array<{
    id: string;
    traveler: string;
    trip: string;
    spots: string;
    price: string;
    status: string;
    coverImage: string;
  }>;
  upcomingTrips: Array<{
    id: string;
    title: string;
    startDate: string;
    spotsLeft: number;
    coverImage: string;
  }>;
  onboarding: {
    isVerified: boolean;
    hasPublishedTrip: boolean;
    hasBookings: boolean;
    progressPercent: number;
  };
};

const BOOKING_STATUS: Record<string, { label: string; color: string }> = {
  CONFIRMED: { label: "Confirmée", color: "text-green-500" },
  PENDING_PAYMENT: { label: "En attente", color: "text-orange-500" },
  CANCELLED: { label: "Annulée", color: "text-red-500" },
  REFUNDED: { label: "Remboursée", color: "text-purple-500" },
  NO_SHOW: { label: "Absent", color: "text-gray-500" },
};

function formatFrDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AgencyDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/agency/dashboard", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && res.ok) {
          setData(json);
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-xs font-black uppercase tracking-widest">
          Chargement du tableau de bord...
        </span>
      </div>
    );
  }

  const stats = data?.stats ?? {
    activeTrips: 0,
    confirmedBookings: 0,
    remainingSpots: 0,
    totalRevenue: 0,
  };
  const onboarding = data?.onboarding ?? {
    isVerified: false,
    hasPublishedTrip: false,
    hasBookings: false,
    progressPercent: 0,
  };
  const recentBookings = data?.recentBookings ?? [];
  const upcomingTrips = data?.upcomingTrips ?? [];

  const statsConfig = [
    { label: "Voyages actifs", val: stats.activeTrips, link: "/agency/trips" },
    {
      label: "Réservations confirmées",
      val: stats.confirmedBookings,
      link: "/agency/bookings",
    },
    { label: "Places restantes", val: stats.remainingSpots, link: "/agency/trips" },
    {
      label: "Acomptes reçus",
      val: `€${stats.totalRevenue}`,
      link: "/agency/bookings",
      isCurrency: true,
    },
  ];

  const steps = [
    {
      title: "Compte vérifié",
      sub: "Validation MaghrebVoyage",
      status: onboarding.isVerified ? "completed" : "pending",
      link: "/agency/settings",
    },
    {
      title: "Publier un voyage",
      sub: "Créez votre première offre",
      status: onboarding.hasPublishedTrip
        ? "completed"
        : onboarding.isVerified
          ? "pending"
          : "locked",
      link: "/agency/trips/new",
    },
    {
      title: "Première réservation",
      sub: "Recevez votre premier client",
      status: onboarding.hasBookings
        ? "completed"
        : onboarding.hasPublishedTrip
          ? "pending"
          : "locked",
      link: "/agency/bookings",
    },
  ];

  return (
    <div className="space-y-10">
      <div className="bg-[#0F172A] rounded-[3rem] p-10 md:p-12 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">
                Bienvenue sur MaghrebVoyage ! 🚀
              </h2>
              <p className="text-gray-400 font-medium text-sm">
                Complétez ces étapes pour recevoir vos premières réservations.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-[10px] font-black uppercase tracking-widest text-orange-500">
                Progression
              </div>
              <div className="w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${onboarding.progressPercent}%` }}
                />
              </div>
              <div className="text-[10px] font-black uppercase tracking-widest">
                {onboarding.progressPercent}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            {steps.map((step, i) => (
              <Link
                key={i}
                href={step.status === "locked" ? "#" : step.link}
                className={`p-6 rounded-[2rem] border transition-all flex flex-col gap-4 group ${
                  step.status === "completed"
                    ? "bg-white/5 border-white/10"
                    : step.status === "pending"
                      ? "bg-orange-600 border-orange-500 shadow-xl shadow-orange-600/20"
                      : "bg-white/5 border-white/5 opacity-40 pointer-events-none"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                      step.status === "completed"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {step.status === "completed" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <Plus size={16} />
                    )}
                  </div>
                  <span className="text-[10px] font-black opacity-50 uppercase tracking-widest">
                    Étape {i + 1}
                  </span>
                </div>
                <div>
                  <div className="text-[13px] font-black">{step.title}</div>
                  <div className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-0.5">
                    {step.sub}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsConfig.map((s, i) => (
          <div
            key={i}
            className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-50 flex flex-col justify-between h-40"
          >
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {s.label}
            </div>
            <div className="flex items-end justify-between">
              <div
                className={`text-4xl font-black tracking-tighter ${"isCurrency" in s && s.isCurrency ? "text-[#0F172A]" : ""}`}
              >
                {s.val}
              </div>
              <Link
                href={s.link}
                className="text-[10px] font-bold text-blue-600 hover:underline"
              >
                Voir
              </Link>
            </div>
            {"isCurrency" in s && s.isCurrency && (
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Confirmées
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 bg-white rounded-[3rem] p-10 border border-gray-50 shadow-sm">
          <h3 className="text-lg font-black text-[#0F172A] mb-8">
            Dernières réservations
          </h3>
          {recentBookings.length === 0 ? (
            <p className="text-sm font-bold text-gray-400 text-center py-8">
              Aucune réservation pour le moment.
            </p>
          ) : (
            <div className="space-y-6">
              {recentBookings.map((b) => {
                const st = BOOKING_STATUS[b.status] ?? {
                  label: b.status,
                  color: "text-gray-500",
                };
                return (
                  <div key={b.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md">
                        <img
                          src={b.coverImage || getFallbackImage(b.trip)}
                          alt={b.trip}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              getFallbackImage(b.trip);
                          }}
                        />
                      </div>
                      <div>
                        <div className="text-[13px] font-black text-[#0F172A]">
                          {b.trip}
                        </div>
                        <div className="text-[11px] text-gray-400 font-bold">
                          {b.traveler}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-[11px] font-bold text-gray-500 w-16">
                        {b.spots}
                      </div>
                      <div className="text-[11px] font-black text-[#0F172A] w-16">
                        {b.price}
                      </div>
                      <div
                        className={`text-[10px] font-black uppercase tracking-widest w-24 text-right ${st.color}`}
                      >
                        {st.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-[3rem] p-10 border border-gray-50 shadow-sm">
          <h3 className="text-lg font-black text-[#0F172A] mb-8">
            Départs dans les 30 prochains jours
          </h3>
          {upcomingTrips.length === 0 ? (
            <p className="text-sm font-bold text-gray-400 mb-8">
              Aucun départ programmé.
            </p>
          ) : (
            <div className="space-y-6 mb-8">
              {upcomingTrips.map((t) => (
                <div key={t.id} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-md">
                    <img
                      src={t.coverImage || getFallbackImage(t.title)}
                      alt={t.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          getFallbackImage(t.title);
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-[12px] font-black text-[#0F172A]">
                      {t.title}
                    </div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                      {formatFrDate(t.startDate)}
                    </div>
                    <div className="text-[9px] text-orange-600 font-bold uppercase tracking-widest mt-0.5">
                      {t.spotsLeft} place{t.spotsLeft > 1 ? "s" : ""} restante
                      {t.spotsLeft > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/agency/trips"
            className="text-[11px] font-black text-blue-600 uppercase tracking-widest hover:underline"
          >
            Voir tous les départs
          </Link>
        </div>
      </div>
    </div>
  );
}
