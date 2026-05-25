import { NextResponse } from "next/server";
import { CronService } from "@/services/cron.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  const querySecret = new URL(request.url).searchParams.get("secret");
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && !secret) {
    return NextResponse.json(
      { error: "CRON_SECRET requis en production." },
      { status: 503 }
    );
  }

  if (secret) {
    const token = authHeader?.replace(/^Bearer\s+/i, "") || querySecret;
    if (token !== secret) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  try {
    const result = await CronService.sendPreTripReminders();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("CRON pre-trip-reminder:", error);
    return NextResponse.json({ error: "Échec du cron." }, { status: 500 });
  }
}
