/**
 * Admin Matching - Agency Assignment API
 * POST /api/admin/matching/:requestId/assign
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AdminMatchingService } from "@/services/admin-matching.service";

export async function POST(
  req: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { requestId } = params;
    const body = await req.json();
    const {
      agencyId,
      assignmentType = "manual",
      matchScore = null,
      matchReasons = [],
    } = body;

    if (!agencyId) {
      return NextResponse.json(
        { success: false, error: "agencyId is required" },
        { status: 400 }
      );
    }

    // Assign agency
    await AdminMatchingService.assignAgencyToRequest(
      requestId,
      agencyId,
      assignmentType,
      matchScore,
      matchReasons,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      message: `Agency ${agencyId} assigned to request ${requestId}`,
    });
  } catch (error: any) {
    console.error("Assignment API error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
