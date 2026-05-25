import { NextResponse } from "next/server";
import { TripsService } from "@/services/trips.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trips = await TripsService.listPublished({
      destination: searchParams.get("destination") || undefined,
      tripType: searchParams.get("type") || undefined,
      budgetMax: searchParams.get("budget")
        ? Number(searchParams.get("budget"))
        : undefined,
    });
    return NextResponse.json({ trips });
  } catch (error) {
    console.error("GET /api/trips", error);
    return NextResponse.json({ trips: [] });
  }
}
