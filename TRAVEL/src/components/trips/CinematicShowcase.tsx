"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, MapPin, Sun, Leaf, Snowflake, Flower2 } from "lucide-react";
import SafeImage from "@/components/ui/SafeImage";
import { formatPriceShort } from "@/lib/currency";
import { sanitizeImageUrl } from "@/lib/images";
import { groupTripsBySeason } from "@/lib/seasons";
import { getSpotsLeft } from "@/lib/trip-availability";
import type { Season } from "@/lib/seasons";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Trip {
  id: string;
  title: string;
  slug: string;
  destination: string;
  tripType: string;
  totalPrice: number;
  coverImage: string;
  totalSpots: number;
  bookedSpots: number;
  reservedSpots?: number;
  spotsLeft?: number;
  season?: Season;
}

// ─── Season config — SVG icons only, no emoji ─────────────────────────────────

const SEASONS = [
  { key: "SPRING" as Season, label: "Printemps", period: "Mars — Mai",   Icon: Flower2   },
  { key: "SUMMER" as Season, label: "Été",        period: "Juin — Août", Icon: Sun       },
  { key: "AUTUMN" as Season, label: "Automne",    period: "Sept — Nov",  Icon: Leaf      },
  { key: "WINTER" as Season, label: "Hiver",      period: "Déc — Fév",   Icon: Snowflake },
] as const;

const TYPE_LABELS: Record<string, string> = {
  DESERT:     "Désert",
  CULTURE:    "Culture",
  ADVENTURE:  "Aventure",
  RELAXATION: "Détente",
  NATURE:     "Nature",
  LUXE:       "Luxe",
  FAMILLE:    "Famille",
  HISTORIQUE: "Historique",
  RELIGIEUX:  "Religieux",
};

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function CardSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <div className="lg:col-span-3 rounded-[2rem] bg-white/5 animate-pulse h-[580px]" />
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="flex-1 rounded-[1.75rem] bg-white/5 animate-pulse min-h-[278px]" />
        <div className="flex-1 rounded-[1.75rem] bg-white/4 animate-pulse min-h-[278px]" />
      </div>
    </div>
  );
}

// ─── Hero card ────────────────────────────────────────────────────────────────

function HeroCard({ trip, alone }: { trip: Trip; alone?: boolean }) {
  const cover     = sanitizeImageUrl(trip.coverImage, trip.destination);
  const spotsLeft = trip.spotsLeft ?? getSpotsLeft(trip);
  const typeLabel = TYPE_LABELS[trip.tripType] || trip.tripType;

  return (
    <Link
      href={`/trip/${trip.slug}`}
      className={`group relative block rounded-[2rem] overflow-hidden ${alone ? "h-[440px]" : "h-[580px]"}`}
    >
      {/* Image */}
      <SafeImage
        src={cover}
        alt={trip.title}
        fill
        sizes={alone ? "100vw" : "(max-width: 1024px) 100vw, 60vw"}
        destination={trip.destination}
        className="object-cover transition-transform duration-[3000ms] group-hover:scale-105"
        priority
      />

      {/* Multi-layer vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent" />

      {/* Type badge */}
      <div className="absolute top-6 left-6">
        <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/80
          bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full">
          {typeLabel}
        </span>
      </div>

      {/* Urgency badge */}
      {spotsLeft > 0 && spotsLeft <= 5 && (
        <div className="absolute top-6 right-6">
          <span className="text-[10px] font-black uppercase tracking-wider text-orange-300
            bg-orange-500/15 backdrop-blur-md border border-orange-400/25 px-4 py-2 rounded-full">
            {spotsLeft} places
          </span>
        </div>
      )}

      {/* Glass content panel */}
      <div className="absolute inset-x-0 bottom-0 p-6">
        <div className="bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-2xl p-6 space-y-4">

          <div className="flex items-center gap-2 text-white/40">
            <MapPin size={10} strokeWidth={2.5} className="shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-[0.28em]">
              {trip.destination}
            </span>
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight leading-tight
            group-hover:text-orange-300 transition-colors duration-500">
            {trip.title}
          </h3>

          {/* Thin ruled line */}
          <div className="h-px bg-gradient-to-r from-white/15 via-white/6 to-transparent" />

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-black text-white tracking-tighter leading-none">
                {formatPriceShort(trip.totalPrice)}
              </div>
              <div className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1.5">
                par personne
              </div>
            </div>
            <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center
              group-hover:bg-orange-400 transition-colors shadow-xl shadow-orange-500/30 shrink-0">
              <ArrowRight size={18} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Secondary card ───────────────────────────────────────────────────────────

function SecondaryCard({ trip }: { trip: Trip }) {
  const cover     = sanitizeImageUrl(trip.coverImage, trip.destination);
  const typeLabel = TYPE_LABELS[trip.tripType] || trip.tripType;

  return (
    <Link
      href={`/trip/${trip.slug}`}
      className="group relative flex-1 rounded-[1.75rem] overflow-hidden min-h-[278px] block"
    >
      <SafeImage
        src={cover}
        alt={trip.title}
        fill
        sizes="(max-width: 1024px) 100vw, 40vw"
        destination={trip.destination}
        className="object-cover transition-transform duration-[3000ms] group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

      {/* Top badge */}
      <div className="absolute top-4 left-4">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60
          bg-black/30 backdrop-blur-md border border-white/8 px-3 py-1.5 rounded-full">
          {typeLabel}
        </span>
      </div>

      {/* Content */}
      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-white/35 mb-1.5">
              <MapPin size={9} strokeWidth={2.5} className="shrink-0" />
              <span className="text-[9px] font-black uppercase tracking-[0.22em] truncate">
                {trip.destination}
              </span>
            </div>
            <h4 className="text-[15px] font-black text-white tracking-tight leading-tight
              group-hover:text-orange-300 transition-colors line-clamp-2">
              {trip.title}
            </h4>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2.5">
            <div className="text-base font-black text-white leading-none whitespace-nowrap">
              {formatPriceShort(trip.totalPrice)}
            </div>
            <div className="w-9 h-9 bg-white/10 backdrop-blur border border-white/15 rounded-xl
              flex items-center justify-center group-hover:bg-orange-500 group-hover:border-orange-500
              transition-all duration-300">
              <ArrowRight size={13} className="text-white" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CinematicShowcase() {
  const [allGrouped, setAllGrouped] = useState<Record<Season, Trip[]>>({
    SPRING: [], SUMMER: [], AUTUMN: [], WINTER: [], OTHER: [],
  });
  const [activeSeason,  setActiveSeason]  = useState<Season>("SUMMER");
  const [displaySeason, setDisplaySeason] = useState<Season>("SUMMER");
  const [fading,   setFading]   = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [calSeason, setCalSeason] = useState<Season>("SUMMER");

  useEffect(() => {
    const m = new Date().getMonth() + 1;
    const cal: Season =
      m >= 3 && m <= 5 ? "SPRING" :
      m >= 6 && m <= 8 ? "SUMMER" :
      m >= 9 && m <= 11 ? "AUTUMN" : "WINTER";
    setCalSeason(cal);

    fetch("/api/trips")
      .then(r => r.json())
      .then(data => {
        const published = (data.trips || []).filter(
          (t: Trip & { status?: string }) => t.status === "PUBLISHED"
        );
        const grouped   = groupTripsBySeason(published) as Record<Season, Trip[]>;
        setAllGrouped(grouped);

        // Auto-select: current calendar season if non-empty, else first with trips
        const initial =
          (grouped[cal] || []).length > 0
            ? cal
            : (SEASONS.find(s => (grouped[s.key] || []).length > 0)?.key ?? "SUMMER");
        setActiveSeason(initial);
        setDisplaySeason(initial);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function selectSeason(season: Season) {
    if (season === activeSeason || fading) return;
    setActiveSeason(season);
    setFading(true);
    setTimeout(() => {
      setDisplaySeason(season);
      setFading(false);
    }, 260);
  }

  const trips  = allGrouped[displaySeason] || [];
  const hasAny = SEASONS.some(s => (allGrouped[s.key] || []).length > 0);
  const extra  = trips.length > 3 ? trips.length - 3 : 0;

  return (
    <section className="relative overflow-hidden bg-[#080D1A] py-32 px-6">

      {/* Ambient depth blobs */}
      <div className="pointer-events-none absolute left-1/4 top-0 h-[700px] w-[700px]
        -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-600/[0.04] blur-[160px]" />
      <div className="pointer-events-none absolute bottom-0 right-1/4 h-[500px] w-[500px]
        translate-x-1/2 translate-y-1/3 rounded-full bg-sky-500/[0.04] blur-[130px]" />

      <div className="relative z-10 mx-auto max-w-7xl">

        {/* ── Section header ───────────────────────────────────────────── */}
        <div className="mb-14 flex items-start justify-between">
          <div>
            <p className="mb-5 text-[10px] font-black uppercase tracking-[0.38em] text-orange-500/70">
              Collection Saisonnière
            </p>
            <h2 className="text-5xl font-black leading-[0.92] tracking-tight text-white md:text-6xl">
              Voyages à la Une
            </h2>
            <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/20">
              Sélectionnés pour leur authenticité
            </p>
          </div>
          <Link
            href="/voyages"
            className="group mt-1 hidden items-center gap-3 text-[10px] font-black
              uppercase tracking-widest text-white/30 transition-colors
              hover:text-white/70 md:flex"
          >
            Explorer tout
            <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10
              transition-all group-hover:border-orange-500/60 group-hover:bg-orange-500/10">
              <ArrowRight size={12} />
            </span>
          </Link>
        </div>

        {/* ── Season navigation tabs ────────────────────────────────────── */}
        <div className="relative mb-0 border-b border-white/[0.07]">
          <div className="flex gap-0">
            {SEASONS.map(({ key, label, period, Icon }) => {
              const count    = (allGrouped[key] || []).length;
              const isActive = activeSeason === key;
              const isCal    = calSeason === key;
              const isEmpty  = count === 0;

              return (
                <button
                  key={key}
                  onClick={() => !isEmpty && selectSeason(key)}
                  disabled={isEmpty}
                  aria-pressed={isActive}
                  className={[
                    "group relative flex items-center gap-3 px-6 py-4 transition-all duration-300",
                    isActive
                      ? "text-white"
                      : isEmpty
                        ? "cursor-not-allowed text-white/10"
                        : "cursor-pointer text-white/25 hover:text-white/55",
                  ].join(" ")}
                >
                  {/* Icon */}
                  <Icon
                    size={13}
                    strokeWidth={isActive ? 2.5 : 1.75}
                    className={isActive ? "text-orange-400" : ""}
                  />

                  {/* Label + period */}
                  <div className="text-left">
                    <div className="text-[13px] font-black tracking-tight">{label}</div>
                    <div className="hidden text-[8.5px] font-bold uppercase tracking-widest opacity-50 md:block">
                      {period}
                    </div>
                  </div>

                  {/* Live season dot */}
                  {isCal && !isEmpty && (
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-500" />
                  )}

                  {/* Count pill */}
                  {count > 0 && (
                    <span className={[
                      "rounded-full px-2 py-0.5 text-[8px] font-black transition-all",
                      isActive
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-white/[0.06] text-white/25",
                    ].join(" ")}>
                      {count}
                    </span>
                  )}

                  {/* Active underline */}
                  <span className={[
                    "absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-orange-500",
                    "transition-all duration-300",
                    isActive ? "opacity-100" : "opacity-0",
                  ].join(" ")} />
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Cards grid ────────────────────────────────────────────────── */}
        <div
          className="mt-5 transition-all duration-[260ms] ease-out"
          style={{
            opacity:   fading ? 0 : 1,
            transform: fading ? "translateY(14px)" : "translateY(0px)",
          }}
        >
          {loading ? (
            <CardSkeleton />
          ) : !hasAny ? (
            <EmptyState message="Aucun voyage disponible" sub="Nos agences préparent les collections 2025 — revenez bientôt." />
          ) : trips.length === 0 ? (
            <EmptyState message="Aucun voyage cette saison" sub="Explorez les autres collections saisonnières." />
          ) : (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">

              {/* Hero */}
              <div className="lg:col-span-3">
                <HeroCard trip={trips[0]} alone={trips.length === 1} />
              </div>

              {/* Secondary stack */}
              {trips.length > 1 && (
                <div className="flex flex-col gap-4 lg:col-span-2">
                  {trips.slice(1, 3).map(trip => (
                    <SecondaryCard key={trip.id} trip={trip} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer rule + collection link ─────────────────────────────── */}
        {!loading && trips.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/18">
              {trips.length} voyage{trips.length > 1 ? "s" : ""} dans cette collection
              {extra > 0 && (
                <span className="ml-2 text-orange-500/60">
                  · +{extra} autres disponibles
                </span>
              )}
            </p>
            <Link
              href="/voyages"
              className="group flex items-center gap-2 text-[10px] font-black uppercase
                tracking-widest text-white/30 transition-colors hover:text-orange-400"
            >
              Explorer la collection
              <ArrowRight
                size={11}
                className="transition-transform group-hover:translate-x-1"
              />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Shared empty state ───────────────────────────────────────────────────────

function EmptyState({ message, sub }: { message: string; sub: string }) {
  return (
    <div className="flex h-72 flex-col items-center justify-center rounded-[2rem]
      border border-white/[0.04] text-center">
      <p className="text-2xl font-black tracking-tight text-white/15">{message}</p>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-white/10">{sub}</p>
    </div>
  );
}
