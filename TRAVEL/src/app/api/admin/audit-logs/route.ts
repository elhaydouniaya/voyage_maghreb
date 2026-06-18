import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AuditLogService } from "@/services/audit-log.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const logs = await AuditLogService.listForAdmin();
    return NextResponse.json({ logs });
  } catch (error) {
    console.error("GET /api/admin/audit-logs", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
