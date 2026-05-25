import { NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { emailButton } from "@/lib/email-template";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    const normalized = String(email || "").toLowerCase().trim();

    if (!normalized) {
      return NextResponse.json({ error: "Email requis." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email: normalized } });

    if (user?.passwordHash) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.verificationToken.deleteMany({
        where: { identifier: `reset:${normalized}` },
      });

      await prisma.verificationToken.create({
        data: {
          identifier: `reset:${normalized}`,
          token,
          expires,
        },
      });

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const link = `${baseUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalized)}`;

      await sendEmail({
        to: normalized,
        subject: "Réinitialisation de votre mot de passe — MaghrebVoyage",
        title: "Mot de passe",
        html: `
          <p>Bonjour${user.name ? ` ${user.name}` : ""},</p>
          <p>Choisissez un nouveau mot de passe (lien valide 1 heure) :</p>
          ${emailButton(link, "Réinitialiser mon mot de passe")}
          <p style="font-size:12px;color:#64748b">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
