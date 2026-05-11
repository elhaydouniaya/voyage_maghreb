import { NextResponse } from "next/server";
import { AIService } from "@/services/ai.service";
import { getMergedTrips } from "@/lib/trips";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // 1. Structure demand
    const demand = await AIService.structureDemand(body);
    
    // 2. Get trips (In real app, from Prisma)
    const trips = getMergedTrips();
    
    // 3. Match
    const matches = await AIService.matchTrips(demand, trips);
    
    // 4. Return results with full trip data
    const results = matches.map(m => {
      const trip = trips.find(t => t.id === m.tripId);
      return {
        ...trip,
        compatibility: m.compatibility,
        matchReasons: m.reasons
      };
    });

    return NextResponse.json({ 
      success: true, 
      results,
      summary: demand.summary 
    });

  } catch (error) {
    console.error("AI Match Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
