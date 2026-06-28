import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, " ").trim();
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, role: true, image: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data: { name?: string; phone?: string | null } = {};

    if (body.name !== undefined) {
      const name = String(body.name || "").trim();
      if (name.length < 2) {
        return NextResponse.json(
          { error: "Le nom doit contenir au moins 2 caractères." },
          { status: 400 }
        );
      }
      data.name = name;
    }

    if (body.phone !== undefined) {
      const phone = body.phone ? normalizePhone(String(body.phone)) : null;
      if (phone && phone.length < 6) {
        return NextResponse.json(
          { error: "Numéro de téléphone invalide." },
          { status: 400 }
        );
      }
      data.phone = phone;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Aucune donnée à mettre à jour." }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, image: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("PATCH /api/user/me", error);
    return NextResponse.json({ error: "Mise à jour impossible." }, { status: 500 });
  }
}
