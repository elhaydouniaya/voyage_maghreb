/**
 * Weather Service — VoyageMaghreb
 *
 * Production weather intelligence for the booking + AI layer.
 *
 * Rules:
 *   - FREE data only: Open-Meteo (no API key, no paid plan).
 *   - The AI NEVER calls Open-Meteo. Flow: User → AI → Node (this service) → Open-Meteo → Node → AI.
 *   - NO hallucinated weather: every value comes from Open-Meteo. Out of the 16-day
 *     forecast horizon we fall back to ERA5 archive (same dates, previous year) and
 *     LABEL it as a seasonal estimate — still real measured data, never invented.
 *
 * Endpoints used (free, keyless):
 *   forecast : https://api.open-meteo.com/v1/forecast
 *   archive  : https://archive-api.open-meteo.com/v1/archive
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface City {
  key: string;        // normalized lookup key (no accents, lowercase)
  name: string;       // display name
  country: "Maroc" | "Algérie" | "Tunisie" | "Libye" | "Mauritanie";
  lat: number;
  lon: number;
}

export interface DayForecast {
  date: string;            // YYYY-MM-DD
  tempMin: number;         // °C
  tempMax: number;         // °C
  tempAvg: number;         // °C
  precipitationMm: number; // mm
  rainProbability: number; // 0..100
  windKph: number;         // km/h
  weatherCode: number;     // WMO code
  condition: string;       // human label (FR)
  emoji: string;
  score: number;           // 0..100 travel comfort score
}

export interface WeatherResult {
  city: City;
  start_date: string;
  end_date: string;
  source: "forecast" | "seasonal_estimate";
  days: DayForecast[];
  bestDay: DayForecast | null;
  worstDay: DayForecast | null;
  avgTemp: number;
  rainyDays: number;
  overallScore: number;
  headline: string;        // "Semaine idéale pour visiter Marrakech ☀️"
  advice: string;          // one-line natural recommendation
}

/** Compact payload the AI is allowed to receive (no raw arrays, no API access). */
export interface WeatherAiSummary {
  city: string;
  date_range: { start: string; end: string };
  weather_summary: {
    avg_temp_c: number;
    rainy_days: number;
    best_day: string | null;
    worst_day: string | null;
    overall_score: number;
    source: "forecast" | "seasonal_estimate";
    headline: string;
    advice: string;
  };
}

// ─── Maghreb city catalog (lat/lon) ──────────────────────────────────────────

const norm = (s: string) =>
  s.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");

const CITY_LIST: Omit<City, "key">[] = [
  // Maroc
  { name: "Marrakech", country: "Maroc", lat: 31.63, lon: -7.99 },
  { name: "Casablanca", country: "Maroc", lat: 33.57, lon: -7.59 },
  { name: "Rabat", country: "Maroc", lat: 34.02, lon: -6.83 },
  { name: "Fès", country: "Maroc", lat: 34.04, lon: -4.99 },
  { name: "Agadir", country: "Maroc", lat: 30.42, lon: -9.6 },
  { name: "Tanger", country: "Maroc", lat: 35.76, lon: -5.83 },
  { name: "Chefchaouen", country: "Maroc", lat: 35.17, lon: -5.27 },
  { name: "Merzouga", country: "Maroc", lat: 31.1, lon: -4.01 },
  { name: "Ouarzazate", country: "Maroc", lat: 30.92, lon: -6.91 },
  { name: "Essaouira", country: "Maroc", lat: 31.51, lon: -9.77 },
  // Algérie
  { name: "Alger", country: "Algérie", lat: 36.75, lon: 3.06 },
  { name: "Oran", country: "Algérie", lat: 35.7, lon: -0.63 },
  { name: "Constantine", country: "Algérie", lat: 36.36, lon: 6.61 },
  { name: "Djanet", country: "Algérie", lat: 24.55, lon: 9.48 },
  { name: "Taghit", country: "Algérie", lat: 30.92, lon: -2.0 },
  { name: "Timimoun", country: "Algérie", lat: 29.26, lon: 0.23 },
  { name: "Ghardaïa", country: "Algérie", lat: 32.49, lon: 3.67 },
  { name: "Tamanrasset", country: "Algérie", lat: 22.79, lon: 5.53 },
  // Tunisie
  { name: "Tunis", country: "Tunisie", lat: 36.81, lon: 10.18 },
  { name: "Djerba", country: "Tunisie", lat: 33.81, lon: 10.85 },
  { name: "Hammamet", country: "Tunisie", lat: 36.4, lon: 10.61 },
  { name: "Sousse", country: "Tunisie", lat: 35.83, lon: 10.64 },
  { name: "Tozeur", country: "Tunisie", lat: 33.92, lon: 8.13 },
  { name: "Carthage", country: "Tunisie", lat: 36.86, lon: 10.33 },
  // Libye
  { name: "Tripoli", country: "Libye", lat: 32.89, lon: 13.18 },
  { name: "Benghazi", country: "Libye", lat: 32.12, lon: 20.07 },
  { name: "Ghadamès", country: "Libye", lat: 30.13, lon: 9.5 },
  { name: "Sabha", country: "Libye", lat: 27.04, lon: 14.43 },
  // Mauritanie
  { name: "Nouakchott", country: "Mauritanie", lat: 18.08, lon: -15.98 },
  { name: "Nouadhibou", country: "Mauritanie", lat: 20.93, lon: -17.03 },
  { name: "Atar", country: "Mauritanie", lat: 20.52, lon: -13.05 },
  { name: "Chinguetti", country: "Mauritanie", lat: 20.46, lon: -12.36 },
];

const CITIES: City[] = CITY_LIST.map((c) => ({ ...c, key: norm(c.name) }));

// Country names also resolve to their capital/representative city.
const COUNTRY_FALLBACK: Record<string, string> = {
  maroc: "marrakech",
  algerie: "alger",
  tunisie: "tunis",
  libye: "tripoli",
  mauritanie: "nouakchott",
};

// ─── WMO weather code → label + emoji ────────────────────────────────────────

export type WeatherLang = "fr" | "en";

function describeCode(code: number, lang: WeatherLang = "fr"): { condition: string; emoji: string } {
  const pick = (f: string, e: string) => (lang === "fr" ? f : e);
  if (code === 0) return { condition: pick("Ciel dégagé", "Clear sky"), emoji: "☀️" };
  if (code <= 2) return { condition: pick("Peu nuageux", "Partly cloudy"), emoji: "🌤️" };
  if (code === 3) return { condition: pick("Couvert", "Overcast"), emoji: "☁️" };
  if (code === 45 || code === 48) return { condition: pick("Brouillard", "Fog"), emoji: "🌫️" };
  if (code >= 51 && code <= 57) return { condition: pick("Bruine", "Drizzle"), emoji: "🌦️" };
  if (code >= 61 && code <= 67) return { condition: pick("Pluie", "Rain"), emoji: "🌧️" };
  if (code >= 71 && code <= 77) return { condition: pick("Neige", "Snow"), emoji: "❄️" };
  if (code >= 80 && code <= 82) return { condition: pick("Averses", "Showers"), emoji: "🌧️" };
  if (code >= 95) return { condition: pick("Orage", "Thunderstorm"), emoji: "⛈️" };
  return { condition: pick("Variable", "Variable"), emoji: "🌥️" };
}

// ─── Scoring engine (0..100 per day) ─────────────────────────────────────────

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

/**
 * Travel comfort score for one day.
 *   temperature comfort: ideal ~22°C, penalize deviation
 *   rain penalty:        based on rain probability + heavy precipitation
 *   extreme penalty:     storm / snow / extreme heat / strong wind
 */
function scoreDay(d: Omit<DayForecast, "score" | "condition" | "emoji">): number {
  const tempComfort = 100 - Math.min(60, Math.abs(d.tempAvg - 22) * 3.5);

  const rainPenalty = d.rainProbability * 0.45 + (d.precipitationMm > 10 ? 12 : 0);

  let extreme = 0;
  if (d.weatherCode >= 95) extreme += 35;          // storm
  else if (d.weatherCode >= 71 && d.weatherCode <= 77) extreme += 25; // snow
  if (d.tempAvg >= 40) extreme += 22;              // extreme heat
  if (d.windKph >= 45) extreme += 15;              // strong wind

  return Math.round(clamp(tempComfort - rainPenalty - extreme));
}

// ─── Date helpers ────────────────────────────────────────────────────────────

const DAY_MS = 86_400_000;
const todayISO = () => new Date().toISOString().slice(0, 10);
const addDays = (iso: string, n: number) =>
  new Date(new Date(iso).getTime() + n * DAY_MS).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) =>
  Math.round((new Date(b).getTime() - new Date(a).getTime()) / DAY_MS);

// ─── In-memory TTL cache (Redis-optional; swap easily later) ─────────────────

const cache = new Map<string, { at: number; data: WeatherResult }>();
const TTL_MS = 60 * 60 * 1000; // 1h — forecasts don't change faster

// ─── Service ─────────────────────────────────────────────────────────────────

export class WeatherService {
  static listCities(): City[] {
    return CITIES;
  }

  static resolveCity(input: string): City | null {
    const k = norm(input);

    // 1. Exact full-string match.
    const direct = CITIES.find((c) => c.key === k);
    if (direct) return direct;

    // 2. Whole-word match — robust against "Taghit (Sahara), Algérie".
    //    (Avoids "algerie".includes("alger") false positives.)
    const words = k.split(/[^a-z0-9]+/).filter(Boolean);
    const wordMatch = CITIES.find((c) => !c.key.includes(" ") && words.includes(c.key));
    if (wordMatch) return wordMatch;

    // 3. Multi-word city name appearing as a phrase (e.g. "leptis magna").
    const phrase = CITIES.find((c) => c.key.includes(" ") && k.includes(c.key));
    if (phrase) return phrase;

    // 4. Country name → representative city (only if no city matched).
    for (const w of words) {
      if (COUNTRY_FALLBACK[w]) return CITIES.find((c) => c.key === COUNTRY_FALLBACK[w]) ?? null;
    }

    // 5. Last resort: city key as a substring of the input.
    return CITIES.find((c) => k.includes(c.key)) ?? null;
  }

  /**
   * Weather for a city over [start, end]. Defaults to next 7 days.
   * Clamps the range to a sane window (max 16 days for forecast).
   */
  static async getWeather(
    cityInput: string,
    startDate?: string | null,
    endDate?: string | null,
    lang: WeatherLang = "fr"
  ): Promise<WeatherResult> {
    const city = this.resolveCity(cityInput);
    if (!city) {
      throw new Error(`UNKNOWN_CITY: "${cityInput}" n'est pas une ville du Maghreb supportée.`);
    }

    const start = startDate || todayISO();
    let end = endDate || addDays(start, 6);
    // safety: end ≥ start, cap span at 16 days
    if (daysBetween(start, end) < 0) end = start;
    if (daysBetween(start, end) > 15) end = addDays(start, 15);

    const cacheKey = `${city.key}:${start}:${end}:${lang}`;
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

    // Decide source: within forecast horizon → forecast; else seasonal estimate (archive, prev year)
    const horizonDays = daysBetween(todayISO(), start);
    const useArchive = horizonDays > 15 || horizonDays < -5;

    const days = useArchive
      ? await this.#fetchArchive(city, start, end, lang)
      : await this.#fetchForecast(city, start, end, lang);

    const result = this.#assemble(city, start, end, useArchive ? "seasonal_estimate" : "forecast", days, lang);
    cache.set(cacheKey, { at: Date.now(), data: result });
    return result;
  }

  /** Compact summary for the AI layer — the ONLY weather data the AI receives. */
  static toAiSummary(r: WeatherResult): WeatherAiSummary {
    return {
      city: r.city.name,
      date_range: { start: r.start_date, end: r.end_date },
      weather_summary: {
        avg_temp_c: r.avgTemp,
        rainy_days: r.rainyDays,
        best_day: r.bestDay?.date ?? null,
        worst_day: r.worstDay?.date ?? null,
        overall_score: r.overallScore,
        source: r.source,
        headline: r.headline,
        advice: r.advice,
      },
    };
  }

  // ── Open-Meteo: live forecast ──────────────────────────────────────────────
  static async #fetchForecast(city: City, start: string, end: string, lang: WeatherLang): Promise<DayForecast[]> {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode,windspeed_10m_max` +
      `&timezone=auto&start_date=${start}&end_date=${end}`;
    const daily = await this.#get(url);
    return this.#mapDaily(daily, true, lang);
  }

  // ── Open-Meteo: ERA5 archive (same dates, previous year) = seasonal estimate ─
  static async #fetchArchive(city: City, start: string, end: string, lang: WeatherLang): Promise<DayForecast[]> {
    const pStart = addDays(start, -365);
    const pEnd = addDays(end, -365);
    const url =
      `https://archive-api.open-meteo.com/v1/archive?latitude=${city.lat}&longitude=${city.lon}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max` +
      `&timezone=auto&start_date=${pStart}&end_date=${pEnd}`;
    const daily = await this.#get(url);
    const mapped = this.#mapDaily(daily, false, lang);
    // shift dates back to the requested year so the UI shows the real travel dates
    return mapped.map((d, i) => ({ ...d, date: addDays(start, i) }));
  }

  static async #get(url: string): Promise<Record<string, unknown[]>> {
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`OPEN_METEO_${res.status}`);
    const json = (await res.json()) as { daily?: Record<string, unknown[]> };
    if (!json.daily?.time?.length) throw new Error("OPEN_METEO_EMPTY");
    return json.daily;
  }

  static #mapDaily(daily: Record<string, unknown[]>, hasProb: boolean, lang: WeatherLang): DayForecast[] {
    const time = daily.time as string[];
    const tMax = daily.temperature_2m_max as number[];
    const tMin = daily.temperature_2m_min as number[];
    const precip = daily.precipitation_sum as number[];
    const prob = (daily.precipitation_probability_max as number[] | undefined) ?? [];
    const codes = daily.weathercode as number[];
    const wind = daily.windspeed_10m_max as number[];

    return time.map((date, i) => {
      const tempMax = Math.round(tMax[i]);
      const tempMin = Math.round(tMin[i]);
      const tempAvg = Math.round((tMax[i] + tMin[i]) / 2);
      const precipitationMm = Math.round((precip[i] ?? 0) * 10) / 10;
      // archive has no probability → derive a proxy from precipitation
      const rainProbability = hasProb
        ? Math.round(prob[i] ?? 0)
        : precipitationMm > 5 ? 80 : precipitationMm > 1 ? 50 : precipitationMm > 0 ? 25 : 5;
      const windKph = Math.round(wind[i] ?? 0);
      const weatherCode = codes[i] ?? 0;
      const { condition, emoji } = describeCode(weatherCode, lang);
      const partial = { date, tempMin, tempMax, tempAvg, precipitationMm, rainProbability, windKph, weatherCode };
      return { ...partial, condition, emoji, score: scoreDay(partial) };
    });
  }

  static #assemble(
    city: City,
    start: string,
    end: string,
    source: "forecast" | "seasonal_estimate",
    days: DayForecast[],
    lang: WeatherLang
  ): WeatherResult {
    const best = days.reduce<DayForecast | null>((b, d) => (!b || d.score > b.score ? d : b), null);
    const worst = days.reduce<DayForecast | null>((w, d) => (!w || d.score < w.score ? d : w), null);
    const avgTemp = Math.round(days.reduce((s, d) => s + d.tempAvg, 0) / days.length);
    const rainyDays = days.filter((d) => d.rainProbability >= 50 || d.precipitationMm >= 2).length;
    const overallScore = Math.round(days.reduce((s, d) => s + d.score, 0) / days.length);

    const { headline, advice } = this.#narrate(city.name, source, overallScore, avgTemp, rainyDays, best, worst, lang);
    return { city, start_date: start, end_date: end, source, days, bestDay: best, worstDay: worst, avgTemp, rainyDays, overallScore, headline, advice };
  }

  // ── Natural-language summary (Airbnb style) — bilingual FR/EN ───────────────
  static #narrate(
    cityName: string,
    source: "forecast" | "seasonal_estimate",
    score: number,
    avgTemp: number,
    rainyDays: number,
    best: DayForecast | null,
    worst: DayForecast | null,
    lang: WeatherLang
  ): { headline: string; advice: string } {
    const sun = score >= 75 ? "☀️" : score >= 55 ? "🌤️" : score >= 40 ? "🌥️" : "🌧️";

    let headline: string;
    if (lang === "en") {
      if (score >= 75) headline = `Perfect week to visit ${cityName} ${sun}`;
      else if (score >= 55) headline = `Good time for ${cityName} ${sun}`;
      else if (score >= 40) headline = `Mixed weather in ${cityName} ${sun}`;
      else headline = `Unfavorable period for ${cityName} ${sun}`;
    } else {
      if (score >= 75) headline = `Semaine idéale pour visiter ${cityName} ${sun}`;
      else if (score >= 55) headline = `Bonne période pour ${cityName} ${sun}`;
      else if (score >= 40) headline = `Météo mitigée à ${cityName} ${sun}`;
      else headline = `Période peu favorable à ${cityName} ${sun}`;
    }

    const parts: string[] = [];
    if (lang === "en") {
      parts.push(`Temperatures around ${avgTemp}°C`);
      parts.push(rainyDays === 0 ? "no rain expected" : `${rainyDays} rainy day${rainyDays > 1 ? "s" : ""} possible`);
      if (best) parts.push(`best day: ${best.date} ${best.emoji}`);
      if (worst && worst.score < 45 && worst.date !== best?.date) parts.push(`avoid: ${worst.date}`);
      if (source === "seasonal_estimate") parts.push("(seasonal estimate based on last year's records)");
    } else {
      parts.push(`Températures autour de ${avgTemp}°C`);
      parts.push(rainyDays === 0 ? "aucun jour de pluie prévu" : `${rainyDays} jour${rainyDays > 1 ? "s" : ""} de pluie possible${rainyDays > 1 ? "s" : ""}`);
      if (best) parts.push(`meilleur jour : ${best.date} ${best.emoji}`);
      if (worst && worst.score < 45 && worst.date !== best?.date) parts.push(`à éviter : ${worst.date}`);
      if (source === "seasonal_estimate") parts.push("(estimation saisonnière basée sur les relevés de l'an dernier)");
    }

    return { headline, advice: parts.join(" · ") };
  }
}
