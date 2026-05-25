import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AgenciesService } from "@/services/agencies.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const agencies = await AgenciesService.listForAdmin();
    return NextResponse.json({ agencies });
  } catch (error) {
    console.error("GET /api/admin/agencies", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
