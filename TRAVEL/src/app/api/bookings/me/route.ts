import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { BookingsService } from "@/services/bookings.service";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "CLIENT") {
    return NextResponse.json({ error: "Connexion client requise." }, { status: 401 });
  }

  try {
    const bookings = await BookingsService.listForUser(session.user.id);
    return NextResponse.json({ bookings });
  } catch (error) {
    console.error("GET /api/bookings/me", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
