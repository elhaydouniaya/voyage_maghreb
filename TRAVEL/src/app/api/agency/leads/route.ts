import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AgencyLeadsService } from "@/services/agency-leads.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const data = await AgencyLeadsService.listForAgencyUser(session.user.id);
    if (!data) {
      return NextResponse.json({ error: "Agence introuvable." }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/agency/leads", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "AGENCY") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = await req.json();
    if (body.action === "mark_read" && body.leadId) {
      await AgencyLeadsService.markRead(String(body.leadId), session.user.id);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "mark_all_read") {
      await AgencyLeadsService.markAllRead(session.user.id);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Action invalide." }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erreur lors de la mise à jour.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
