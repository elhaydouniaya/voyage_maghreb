import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = String(body.email || "").toLowerCase().trim();
    const token = String(body.token || "");
    const password = String(body.password || "");

    if (!email || !token || password.length < 6) {
      return NextResponse.json(
        { error: "Données invalides (mot de passe min. 6 caractères)." },
        { status: 400 }
      );
    }

    const record = await prisma.verificationToken.findFirst({
      where: { identifier: `reset:${email}`, token },
    });

    if (!record || record.expires < new Date()) {
      return NextResponse.json(
        { error: "Lien expiré ou invalide. Demandez un nouveau lien." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { email },
      data: { passwordHash },
    });

    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: record.identifier,
          token: record.token,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/reset-password", error);
    return NextResponse.json({ error: "Réinitialisation impossible." }, { status: 500 });
  }
}
