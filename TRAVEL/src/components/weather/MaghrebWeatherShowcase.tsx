"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslation } from "@/lib/i18n/LanguageProvider";

// ─── Types (subset of WeatherService output) ──────────────────────────────────

interface DayForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  tempAvg: number;
  rainProbability: number;
  windKph: number;
  condition: string;
  emoji: string;
  weatherCode: number;
  score: number;
}

interface WeatherResult {
  city: { name: string; country: string };
  days: DayForecast[];
  avgTemp: number;
  overallScore: number;
  headline: string;
}

interface CatalogCity {
  name: string;
  country: string;
}

// ─── Country flags + quick-access capitals ────────────────────────────────────

const FLAG: Record<string, string> = {
  Maroc: "🇲🇦",
  Algérie: "🇩🇿",
  Tunisie: "🇹🇳",
  Libye: "🇱🇾",
  Mauritanie: "🇲🇷",
};

const FEATURED = ["Marrakech", "Alger", "Tunis", "Tripoli", "Nouakchott"];

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

// Dynamic gradient driven by the live condition — the WOW factor.
function skyGradient(day?: DayForecast): string {
  if (!day) return "from-sky-400 to-blue-500";
  const c = day.weatherCode;
  if (c >= 95) return "from-slate-700 via-slate-800 to-indigo-900";
  if (c >= 71 && c <= 77) return "from-sky-200 via-sky-300 to-blue-400";
  if (c >= 61 && c <= 82) return "from-blue-500 via-blue-600 to-slate-700";
  if (c === 3) return "from-slate-400 via-slate-500 to-slate-600";
  if (c === 45 || c === 48) return "from-slate-300 via-gray-400 to-slate-500";
  if (c <= 2 && day.tempMax >= 32) return "from-amber-400 via-orange-500 to-rose-500";
  if (c <= 2) return "from-amber-300 via-orange-400 to-orange-500";
  return "from-sky-400 to-blue-500";
}

const shortDay = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { weekday: "short" });

// ─── Component ────────────────────────────────────────────────────────────────

export function MaghrebWeatherShowcase() {
  const { t, lang } = useTranslation();
  const [data, setData] = useState<Record<string, WeatherResult>>({});
  const [catalog, setCatalog] = useState<CatalogCity[]>([]);
  const [selected, setSelected] = useState<string>("Marrakech");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const fetched = useRef<Set<string>>(new Set());
  const boxRef = useRef<HTMLDivElement>(null);

  // Fetch one city's weather on demand (server-cached, so cheap).
  const ensureWeather = (name: string) => {
    if (fetched.current.has(name)) return;
    fetched.current.add(name);
    fetch("/api/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city: name, lang }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((res: WeatherResult | null) => {
        if (res) setData((prev) => ({ ...prev, [res.city.name]: res }));
      })
      .catch(() => fetched.current.delete(name));
  };

  // Load catalog once.
  useEffect(() => {
    fetch("/api/weather")
      .then((r) => r.json())
      .then((d: { cities: CatalogCity[] }) => setCatalog(d.cities ?? []))
      .catch(() => setCatalog([]));
  }, []);

  // (Re)fetch weather whenever the language changes — summaries are localized.
  useEffect(() => {
    fetched.current.clear();
    setData({});
    [...FEATURED, selected].forEach(ensureWeather);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Close the dropdown on outside click.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const select = (name: string) => {
    setSelected(name);
    ensureWeather(name);
    setQuery("");
    setOpen(false);
  };

  // Search filter — matches by city name OR country.
  const q = norm(query.trim());
  const results = q
    ? catalog
        .filter((c) => norm(c.name).includes(q) || norm(c.country).includes(q))
        .slice(0, 7)
    : [];

  const w = data[selected];
  const today = w?.days?.[0];
  const gradient = skyGradient(today);

  return (
    <section className="py-32 px-6 bg-gradient-to-b from-white to-orange-50/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10">
          <p className="text-orange-500 font-black uppercase tracking-[0.3em] text-xs mb-3">
            {t("weather.section_eyebrow")}
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight">
            {t("weather.section_title_a")} <span className="text-orange-500">{t("weather.section_title_b")}</span>
          </h2>
          <p className="text-gray-400 font-bold mt-4 max-w-xl mx-auto">
            {t("weather.section_subtitle")}
          </p>
        </div>

        {/* Search box */}
        <div ref={boxRef} className="relative max-w-md mx-auto mb-12 z-20">
          <div className="flex items-center gap-3 rounded-2xl border-2 border-gray-100 bg-white px-5 py-4 shadow-sm focus-within:border-orange-400 transition-all">
            <span className="text-gray-400">🔍</span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              placeholder={t("weather.search_placeholder")}
              className="flex-1 bg-transparent text-sm font-bold text-[#0F172A] placeholder:text-gray-400 placeholder:font-medium outline-none"
            />
          </div>

          {/* Results dropdown */}
          {open && results.length > 0 && (
            <ul className="absolute left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-2xl overflow-hidden">
              {results.map((c) => (
                <li key={c.name}>
                  <button
                    onClick={() => select(c.name)}
                    className="w-full flex items-center justify-between px-5 py-3 text-left hover:bg-orange-50 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-xl">{FLAG[c.country] ?? "📍"}</span>
                      <span className="font-black text-[#0F172A]">{c.name}</span>
                    </span>
                    <span className="text-[11px] font-bold text-gray-400">{c.country}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {open && q && results.length === 0 && (
            <div className="absolute left-0 right-0 mt-2 rounded-2xl border border-gray-100 bg-white shadow-2xl px-5 py-4 text-sm text-gray-400 font-medium">
              {t("weather.no_results")} « {query} »
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-5 gap-8 items-stretch">
          {/* HERO weather card — dynamic sky */}
          <div className="lg:col-span-3">
            <div
              className={`relative h-full min-h-[22rem] rounded-[2.5rem] bg-gradient-to-br ${gradient} p-10 text-white shadow-2xl overflow-hidden transition-all duration-700`}
            >
              <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/20 blur-3xl" />
              <div className="absolute bottom-0 -left-10 w-48 h-48 rounded-full bg-black/10 blur-3xl" />

              {!w || !today ? (
                <div className="relative animate-pulse space-y-4">
                  <div className="h-6 w-40 bg-white/30 rounded-full" />
                  <div className="h-20 w-28 bg-white/30 rounded-2xl" />
                  <div className="h-4 w-56 bg-white/20 rounded-full" />
                </div>
              ) : (
                <div className="relative flex flex-col h-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-black uppercase tracking-widest opacity-90">
                        {FLAG[w.city.country] ?? "📍"} {w.city.name}
                      </div>
                      <div className="text-xs font-bold opacity-70">{w.city.country}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-black uppercase tracking-widest opacity-70">
                        {t("weather.stay_score")}
                      </div>
                      <div className="text-3xl font-black">{w.overallScore}</div>
                    </div>
                  </div>

                  <div className="flex items-end gap-4 mt-auto">
                    <span className="text-7xl leading-none drop-shadow-lg">{today.emoji}</span>
                    <div>
                      <div className="text-6xl font-black leading-none">{today.tempMax}°</div>
                      <div className="text-sm font-bold opacity-90">{today.condition}</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-1 mt-5 text-sm font-bold opacity-90">
                    <span>🌡️ {today.tempMin}° / {today.tempMax}°</span>
                    <span>💧 {today.rainProbability}%</span>
                    <span>💨 {today.windKph} km/h</span>
                  </div>

                  <div className="flex gap-2 mt-6">
                    {w.days.slice(1, 6).map((d) => (
                      <div
                        key={d.date}
                        className="flex-1 rounded-2xl bg-white/15 backdrop-blur-sm px-2 py-3 text-center"
                        title={d.condition}
                      >
                        <div className="text-[10px] font-bold uppercase opacity-80">{shortDay(d.date)}</div>
                        <div className="text-lg my-0.5">{d.emoji}</div>
                        <div className="text-xs font-black">{d.tempMax}°</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick-access capitals */}
          <div className="lg:col-span-2 flex flex-col gap-3">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">
              {t("weather.quick_access")}
            </span>
            {FEATURED.map((name) => {
              const cw = data[name];
              const t = cw?.days?.[0];
              const isActive = name === selected;
              const country = cw?.city.country;
              return (
                <button
                  key={name}
                  onClick={() => select(name)}
                  className={`group flex items-center justify-between rounded-3xl border p-5 text-left transition-all ${
                    isActive
                      ? "border-orange-400 bg-white shadow-lg scale-[1.02]"
                      : "border-gray-100 bg-white/60 hover:bg-white hover:border-orange-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{country ? FLAG[country] : "📍"}</span>
                    <div>
                      <div className="font-black text-[#0F172A]">{name}</div>
                      <div className="text-[11px] font-bold text-gray-400">{country ?? "…"}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {t ? (
                      <>
                        <span className="text-2xl">{t.emoji}</span>
                        <span className="text-xl font-black text-[#0F172A]">{t.tempMax}°</span>
                      </>
                    ) : (
                      <span className="text-gray-300 text-sm animate-pulse">…</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
