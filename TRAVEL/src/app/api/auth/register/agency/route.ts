import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

function isStrongPassword(password: string): boolean {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      agencyName,
      managerName,
      email,
      phone,
      country,
      city,
      description,
      coverage,
      specialties,
      password,
      registrationNumber,
      cguAccepted,
      rgpdAccepted,
    } = body;

    if (!cguAccepted || !rgpdAccepted) {
      return NextResponse.json(
        { error: "Vous devez accepter les conditions pour continuer." },
        { status: 400 }
      );
    }

    if (!agencyName?.trim() || agencyName.trim().length < 3) {
      return NextResponse.json(
        { error: "Le nom de l'agence doit contenir au moins 3 caractères." },
        { status: 400 }
      );
    }

    if (!description?.trim() || description.trim().length < 100) {
      return NextResponse.json(
        { error: "La description doit contenir au moins 100 caractères." },
        { status: 400 }
      );
    }

    if (!Array.isArray(coverage) || coverage.length < 1) {
      return NextResponse.json(
        { error: "Sélectionnez au moins une zone géographique." },
        { status: 400 }
      );
    }

    if (!Array.isArray(specialties) || specialties.length < 1) {
      return NextResponse.json(
        { error: "Sélectionnez au moins un type de voyage." },
        { status: 400 }
      );
    }

    if (!password || !isStrongPassword(password)) {
      return NextResponse.json(
        {
          error:
            "Le mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.",
        },
        { status: 400 }
      );
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const siret = String(registrationNumber).trim();

    const existingAgencyByEmail = await prisma.agency.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingAgencyByEmail) {
      return NextResponse.json(
        { error: "Une agence avec cet email est déjà inscrite." },
        { status: 400 }
      );
    }

    const existingSiret = await prisma.agency.findUnique({
      where: { siret },
    });

    if (existingSiret) {
      return NextResponse.json(
        { error: "Ce numéro d'immatriculation est déjà enregistré." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      if (existingUser.role === "CLIENT") {
        const passwordHash = await bcrypt.hash(password, 10);

        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: existingUser.id },
            data: {
              name: managerName.trim(),
              passwordHash,
              role: "AGENCY",
            },
          });

          await tx.agency.create({
            data: {
              userId: existingUser.id,
              name: agencyName.trim(),
              managerName: managerName.trim(),
              email: normalizedEmail,
              phoneNumber: String(phone).trim(),
              country: String(country).trim(),
              city: String(city).trim(),
              description: description.trim(),
              coverage,
              specialties,
              siret,
              verificationStatus: "PENDING",
            },
          });
        });

        try {
          const { sendAgencyRegistrationEmails, sendAgencyAccountReadyEmail } =
            await import("@/lib/agency-emails");
          await sendAgencyRegistrationEmails({
            agencyEmail: normalizedEmail,
            agencyName: agencyName.trim(),
            managerName: managerName.trim(),
          });
          await sendAgencyAccountReadyEmail({
            agencyEmail: normalizedEmail,
            agencyName: agencyName.trim(),
            managerName: managerName.trim(),
          });
        } catch (e) {
          console.error("Agency registration emails:", e);
        }

        return NextResponse.json(
          {
            message:
              "Votre compte voyageur a été converti en compte agence. Connectez-vous sur l'espace agence.",
          },
          { status: 201 }
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
        { error: "Un compte agence existe déjà avec cet email." },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: managerName.trim(),
          email: normalizedEmail,
          passwordHash,
          role: "AGENCY",
        },
      });

      await tx.agency.create({
        data: {
          userId: user.id,
          name: agencyName.trim(),
          managerName: managerName.trim(),
          email: normalizedEmail,
          phoneNumber: String(phone).trim(),
          country: String(country).trim(),
          city: String(city).trim(),
          description: description.trim(),
          coverage,
          specialties,
          siret,
          verificationStatus: "PENDING",
        },
      });
    });

    try {
      const { sendAgencyRegistrationEmails } = await import("@/lib/agency-emails");
      await sendAgencyRegistrationEmails({
        agencyEmail: normalizedEmail,
        agencyName: agencyName.trim(),
        managerName: managerName.trim(),
      });
    } catch (e) {
      console.error("Agency registration emails:", e);
    }

    return NextResponse.json(
      {
        message:
          "Dossier reçu. Vous recevrez un email lorsque votre compte sera validé.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Agency registration error:", error);
    const message =
      error instanceof Error &&
      (error.message.includes("DATABASE_URL") ||
        error.message.includes("Can't reach database"))
        ? "Base de données indisponible. Vérifiez DATABASE_URL dans .env"
        : "Une erreur est survenue lors de l'inscription.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
