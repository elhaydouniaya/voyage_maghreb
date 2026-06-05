import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { BehaviorAnalyticsService } from "@/services/behavior-analytics.service";
import { AnomalyDetectionService } from "@/services/anomaly-detection.service";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const periodOffset = Number(searchParams.get("period") ?? "0") || 0;
    const role = searchParams.get("role");

    const [dashboard, alerts] = await Promise.all([
      BehaviorAnalyticsService.getDecisionDashboard(periodOffset, role),
      AnomalyDetectionService.detectAlerts(),
    ]);

    return NextResponse.json({ ...dashboard, alerts });
  } catch (error) {
    console.error("GET /api/admin/decision-dashboard", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
