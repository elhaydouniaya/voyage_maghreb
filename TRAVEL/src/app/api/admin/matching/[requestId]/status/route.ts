/**
 * Admin Matching - Status Update API
 * POST /api/admin/matching/:requestId/status
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
    const { newStatus, reason } = body;

    if (!newStatus) {
      return NextResponse.json(
        { success: false, error: "newStatus is required" },
        { status: 400 }
      );
    }

    // Update status
    await AdminMatchingService.updateRequestStatus(
      requestId,
      newStatus,
      session.user.id,
      reason
    );

    return NextResponse.json({
      success: true,
      message: `Request ${requestId} status updated to ${newStatus}`,
    });
  } catch (error: any) {
    console.error("Status update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
