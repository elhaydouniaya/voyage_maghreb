import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { AdminService } from "@/services/admin.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé aux administrateurs." }, { status: 403 });
  }

  try {
    const trips = await AdminService.listTrips();
    return NextResponse.json({ trips });
  } catch (error) {
    console.error("GET /api/admin/trips", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
