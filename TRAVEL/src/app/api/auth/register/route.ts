import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { sendWelcomeClientEmail } from "@/lib/booking-emails";

function parseName(body: {
  name?: string;
  firstName?: string;
  lastName?: string;
}): { firstName: string; lastName: string } | null {
  if (body.firstName?.trim() && body.lastName?.trim()) {
    return {
      firstName: body.firstName.trim(),
      lastName: body.lastName.trim(),
    };
  }
  const full = body.name?.trim();
  if (!full) return null;
  const parts = full.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: parts[0] };
  }
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, " ").trim();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;
    const names = parseName(body);

    if (!email || !password || !names) {
      return NextResponse.json(
        { error: "Veuillez remplir tous les champs." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (existingUser.role === "AGENCY") {
        return NextResponse.json(
          {
            error:
              "Cet email est déjà utilisé par une agence. Connectez-vous sur l'espace agence.",
          },
          { status: 400 }
        );
      }
      if (existingUser.role === "ADMIN") {
        return NextResponse.json(
          {
            error:
              "Cet email est réservé à un compte administrateur. Utilisez un autre email.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        {
          error:
            "Un compte voyageur existe déjà avec cet email. Connectez-vous.",
        },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const fullName = `${names.firstName} ${names.lastName}`;
    const phoneRaw = body.phone ? normalizePhone(String(body.phone)) : null;
    if (phoneRaw && phoneRaw.length > 0 && phoneRaw.length < 6) {
      return NextResponse.json(
        { error: "Numéro de téléphone invalide." },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: normalizedEmail,
        passwordHash,
        role: "CLIENT",
        ...(phoneRaw ? { phone: phoneRaw } : {}),
      },
    });

    try {
      await sendWelcomeClientEmail({
        to: normalizedEmail,
        firstName: names.firstName,
      });
    } catch (e) {
      console.error("Welcome email:", e);
    }

    return NextResponse.json(
      {
        message: "Compte créé avec succès. Bienvenue sur MaghrebVoyage !",
        userId: user.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    const message =
      error instanceof Error &&
      (error.message.includes("DATABASE_URL") ||
        error.message.includes("Can't reach database"))
        ? "Base de données indisponible. Vérifiez DATABASE_URL dans .env"
        : "Une erreur est survenue lors de la création du compte.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
