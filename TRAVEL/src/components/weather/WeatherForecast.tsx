"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// ─── Types (mirror WeatherService output) ─────────────────────────────────────

interface DayForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  tempAvg: number;
  precipitationMm: number;
  rainProbability: number;
  windKph: number;
  condition: string;
  emoji: string;
  score: number;
}

interface WeatherResult {
  city: { name: string; country: string };
  start_date: string;
  end_date: string;
  source: "forecast" | "seasonal_estimate";
  days: DayForecast[];
  bestDay: DayForecast | null;
  avgTemp: number;
  rainyDays: number;
  overallScore: number;
  headline: string;
  advice: string;
}

type Props = {
  city: string;
  startDate?: string;
  endDate?: string;
  className?: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (s: number) =>
  s >= 75 ? "text-emerald-600" : s >= 55 ? "text-lime-600" : s >= 40 ? "text-amber-500" : "text-red-500";

const scoreBar = (s: number) =>
  s >= 75 ? "bg-emerald-500" : s >= 55 ? "bg-lime-500" : s >= 40 ? "bg-amber-400" : "bg-red-400";

const dayLabel = (iso: string, lang: string) =>
  new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

// ─── Component ────────────────────────────────────────────────────────────────

export function WeatherForecast({ city, startDate, endDate, className = "" }: Props) {
  const { t, lang } = useTranslation();
  const [data, setData] = useState<WeatherResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, start_date: startDate ?? null, end_date: endDate ?? null, lang }),
    })
      .then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? "Erreur météo");
        return r.json();
      })
      .then((d: WeatherResult) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [city, startDate, endDate, lang]);

  if (loading) {
    return (
      <div className={`animate-pulse rounded-3xl bg-gray-100 h-48 ${className}`} aria-busy>
        <span className="sr-only">{t("common.loading")}</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`rounded-3xl border border-gray-100 bg-white p-6 text-sm text-gray-500 ${className}`}>
        🌥️ {t("weather.unavailable")} — {city}. {error}
      </div>
    );
  }

  return (
    <section className={`rounded-3xl border border-gray-100 bg-white p-6 shadow-sm ${className}`}>
      {/* Header — headline + overall score ring */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h3 className="text-lg font-black text-[#0F172A] leading-tight">{data.headline}</h3>
          <p className="text-xs text-gray-500 mt-1">{data.advice}</p>
          {data.source === "seasonal_estimate" && (
            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              {t("weather.seasonal_estimate")}
            </span>
          )}
        </div>
        <div className="text-center shrink-0">
          <div className={`text-3xl font-black ${scoreColor(data.overallScore)}`}>{data.overallScore}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Score /100</div>
        </div>
      </div>

      {/* Daily cards */}
      <div className="grid grid-flow-col auto-cols-[5.5rem] gap-3 overflow-x-auto pb-2 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-7">
        {data.days.map((d) => {
          const isBest = data.bestDay?.date === d.date;
          return (
            <div
              key={d.date}
              className={`relative rounded-2xl p-3 text-center transition-all ${
                isBest ? "bg-orange-50 ring-2 ring-orange-400" : "bg-gray-50 hover:bg-gray-100"
              }`}
              title={`${d.condition} · pluie ${d.rainProbability}% · vent ${d.windKph} km/h`}
            >
              {isBest && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-orange-500 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
                  {lang === "en" ? "Best day" : "Meilleur jour"}
                </span>
              )}
              <div className="text-[10px] font-bold uppercase text-gray-400">{dayLabel(d.date, lang)}</div>
              <div className="text-2xl my-1" aria-label={d.condition}>{d.emoji}</div>
              <div className="text-sm font-black text-[#0F172A]">{d.tempMax}°</div>
              <div className="text-[11px] text-gray-400">{d.tempMin}°</div>
              <div className="mt-2 flex items-center justify-center gap-1 text-[10px] text-blue-500">
                💧 {d.rainProbability}%
              </div>
              {/* score bar */}
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <div className={`h-full rounded-full ${scoreBar(d.score)}`} style={{ width: `${d.score}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer stats */}
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-500">
        <span>🌡️ {t("weather.avg_temp")} <b className="text-[#0F172A]">{data.avgTemp}°C</b></span>
        <span>🌧️ {t("weather.rainy_days")} <b className="text-[#0F172A]">{data.rainyDays}</b></span>
        <span>📅 {data.start_date} → {data.end_date}</span>
      </div>
    </section>
  );
}
