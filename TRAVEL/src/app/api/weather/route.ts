import { NextResponse } from "next/server";
import { WeatherService } from "@/services/weather.service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/weather
 *
 * Body: { city: string, start_date?: string, end_date?: string, format?: "full" | "ai" }
 *
 * - format "full" (default): complete forecast + per-day scores + summary (for the UI).
 * - format "ai": compact { city, date_range, weather_summary } — the ONLY shape the AI gets.
 *
 * The AI never calls Open-Meteo. It calls this route; Node fetches + scores + summarizes.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`weather:${ip}`, 60, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Trop de requêtes météo. Réessayez plus tard." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const city = (body.city ?? "").toString().trim();
    const startDate = body.start_date ? String(body.start_date) : null;
    const endDate = body.end_date ? String(body.end_date) : null;
    const format = body.format === "ai" ? "ai" : "full";
    const lang = body.lang === "en" ? "en" : "fr";

    if (!city) {
      return NextResponse.json({ error: "Le champ 'city' est requis." }, { status: 400 });
    }

    const result = await WeatherService.getWeather(city, startDate, endDate, lang);

    if (format === "ai") {
      // AI-safe payload (no raw arrays, no API surface)
      return NextResponse.json(WeatherService.toAiSummary(result));
    }
    return NextResponse.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    if (msg.startsWith("UNKNOWN_CITY")) {
      return NextResponse.json(
        { error: msg, supportedCities: WeatherService.listCities().map((c) => c.name) },
        { status: 404 }
      );
    }
    console.error("POST /api/weather", error);
    return NextResponse.json({ error: "Service météo indisponible. Réessayez." }, { status: 502 });
  }
}

/** GET /api/weather → city catalog (lat/lon) for the interactive Maghreb map. */
export async function GET() {
  return NextResponse.json({ cities: WeatherService.listCities() });
}
