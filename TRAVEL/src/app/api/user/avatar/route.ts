import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import prisma from "@/lib/prisma";
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
  deleteLocalAvatar,
  saveAvatar,
} from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const file = formData.get("avatar");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }

  const ext = ALLOWED_AVATAR_TYPES[file.type];
  if (!ext) {
    return NextResponse.json(
      { error: "Format non supporté. Utilisez JPEG, PNG ou WebP." },
      { status: 415 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "Fichier vide." }, { status: 400 });
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return NextResponse.json(
      { error: "Image trop volumineuse (max 3 Mo)." },
      { status: 413 }
    );
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer());

    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    const image = await saveAvatar(session.user.id, bytes, ext);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image },
    });

    // Clean up the previous file only after the new one is safely persisted.
    if (current?.image && current.image !== image) {
      await deleteLocalAvatar(current.image);
    }

    return NextResponse.json({ image });
  } catch (error) {
    console.error("POST /api/user/avatar", error);
    return NextResponse.json({ error: "Téléversement impossible." }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connexion requise." }, { status: 401 });
  }

  try {
    const current = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    });

    await deleteLocalAvatar(current?.image);

    return NextResponse.json({ image: null });
  } catch (error) {
    console.error("DELETE /api/user/avatar", error);
    return NextResponse.json({ error: "Suppression impossible." }, { status: 500 });
  }
}