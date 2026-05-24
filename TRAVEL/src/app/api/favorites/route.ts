import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { FavoritesService } from "@/services/favorites.service";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const trips = await FavoritesService.listForUser(session.user.id);
    const ids = await FavoritesService.tripIdsForUser(session.user.id);
    return NextResponse.json({ trips, ids });
  } catch (error) {
    console.error("GET /api/favorites", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const groupTripId = String(body.groupTripId || "");
    if (!groupTripId) {
      return NextResponse.json({ error: "Voyage invalide." }, { status: 400 });
    }
    await FavoritesService.add(session.user.id, groupTripId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Impossible d'ajouter aux favoris.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const groupTripId = searchParams.get("groupTripId");
    if (!groupTripId) {
      return NextResponse.json({ error: "Voyage invalide." }, { status: 400 });
    }
    await FavoritesService.remove(session.user.id, groupTripId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/favorites", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
