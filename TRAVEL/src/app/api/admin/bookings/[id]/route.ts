import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AdminService } from "@/services/admin.service";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (body.action !== "refund") {
      return NextResponse.json({ error: "Action invalide." }, { status: 400 });
    }

    const result = await AdminService.processRefund(
      params.id,
      body.note,
      session.user.id
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Remboursement impossible.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
