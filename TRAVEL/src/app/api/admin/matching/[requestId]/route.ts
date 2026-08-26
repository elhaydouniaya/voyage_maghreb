/**
 * Admin Matching API
 * GET /api/admin/matching/:requestId
 * 
 * Returns request details with AI-suggested matches for admin review
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AdminMatchingService } from "@/services/admin-matching.service";

export async function GET(
  req: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Only admins can access matching workflow
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const { requestId } = params;

    // Get request with suggestions
    const result = await AdminMatchingService.getRequestWithSuggestions(requestId);

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Matching API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
