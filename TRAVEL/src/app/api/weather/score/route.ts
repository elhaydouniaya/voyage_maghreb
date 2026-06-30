import { NextResponse } from "next/server";
import { WeatherService } from "@/services/weather.service";
import { getClientIp, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * POST /api/weather/score
 *
 * Body: { city: string, start_date?: string, end_date?: string }
 *
 * Lightweight endpoint focused on the scoring engine output:
 *   best day / worst day / per-day scores — for ranking & badges.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`weather-score:${ip}`, 60, 60 * 60 * 1000);
  if (!limited.ok) {
    return NextResponse.json({ error: "Trop de requêtes. Réessayez plus tard." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const city = (body.city ?? "").toString().trim();
    if (!city) {
      return NextResponse.json({ error: "Le champ 'city' est requis." }, { status: 400 });
    }

    const r = await WeatherService.getWeather(
      city,
      body.start_date ? String(body.start_date) : null,
      body.end_date ? String(body.end_date) : null
    );

    return NextResponse.json({
      city: r.city.name,
      overall_score: r.overallScore,
      best_day: r.bestDay && { date: r.bestDay.date, score: r.bestDay.score, emoji: r.bestDay.emoji },
      worst_day: r.worstDay && { date: r.worstDay.date, score: r.worstDay.score, emoji: r.worstDay.emoji },
      days: r.days.map((d) => ({ date: d.date, score: d.score })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "unknown";
    if (msg.startsWith("UNKNOWN_CITY")) {
      return NextResponse.json({ error: msg }, { status: 404 });
    }
    console.error("POST /api/weather/score", error);
    return NextResponse.json({ error: "Service météo indisponible." }, { status: 502 });
  }
}
