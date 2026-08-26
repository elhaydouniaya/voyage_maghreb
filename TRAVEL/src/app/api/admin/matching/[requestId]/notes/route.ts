/**
 * Admin Matching - Notes API
 * POST /api/admin/matching/:requestId/notes - Add note
 * GET /api/admin/matching/:requestId/notes - Get notes
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
    const { content, isInternal = true } = body;

    if (!content) {
      return NextResponse.json(
        { success: false, error: "content is required" },
        { status: 400 }
      );
    }

    // Add note
    await AdminMatchingService.addNote(
      requestId,
      content,
      session.user.id,
      isInternal
    );

    return NextResponse.json({
      success: true,
      message: "Note added successfully",
    });
  } catch (error: any) {
    console.error("Add note error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
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

    // Get notes
    const notes = await AdminMatchingService.getNotes(requestId, true);

    return NextResponse.json({
      success: true,
      data: notes,
    });
  } catch (error: any) {
    console.error("Get notes error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
