import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const prisma = new PrismaClient();

function checkDatabaseUrl() {
  const url = process.env.DATABASE_URL || "";
  if (!url || url.includes("@HOST:") || url.includes("USER:PASSWORD")) {
    console.error(`
❌ DATABASE_URL invalide dans .env (placeholders USER/HOST détectés).
Éditez TRAVEL/.env — voir .env.example
`);
    process.exit(1);
  }
}

function printDbHelp() {
  console.error(`
❌ Aucune base PostgreSQL accessible sur localhost:5432

Docker n'est pas installé sur votre PC, donc "docker compose up -d" ne peut pas marcher.

Solutions (choisissez UNE) :

  A) Neon (gratuit, le plus simple, ~2 min)
     1. https://neon.tech → créer un projet
     2. Copier "Connection string" → coller dans .env comme DATABASE_URL
        (ajoutez ?sslmode=require à la fin si absent)
     3. npm run db:push
     4. npm run seed

  B) Installer Docker Desktop
     https://www.docker.com/products/docker-desktop/
     Puis : docker compose up -d → npm run db:push → npm run seed

  C) Continuer SANS base (démo UI uniquement)
     npm run dev
     Comptes démo : client@test.com / client123, agency@test.com / agency123
     Inscriptions réelles et données persistées : nécessitent A ou B.
`);
}

async function main() {
  checkDatabaseUrl();
  console.log("Seeding database...");

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  await prisma.user.upsert({
    where: { email: "admin@maghrebvoyage.com" },
    update: { passwordHash: adminPasswordHash, role: "ADMIN" },
    create: {
      email: "admin@maghrebvoyage.com",
      name: "Admin Maghreb",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const clientPasswordHash = await bcrypt.hash("client123", 10);
  await prisma.user.upsert({
    where: { email: "client@test.com" },
    update: { passwordHash: clientPasswordHash, role: "CLIENT" },
    create: {
      email: "client@test.com",
      name: "Jean Client",
      passwordHash: clientPasswordHash,
      role: "CLIENT",
    },
  });

  const agencyPasswordHash = await bcrypt.hash("agency123", 10);
  const agencyUser = await prisma.user.upsert({
    where: { email: "agency@test.com" },
    update: { passwordHash: agencyPasswordHash, role: "AGENCY" },
    create: {
      email: "agency@test.com",
      name: "Ahmed Alami",
      passwordHash: agencyPasswordHash,
      role: "AGENCY",
    },
  });

  const agency = await prisma.agency.upsert({
    where: { email: "agency@test.com" },
    update: { verificationStatus: "VERIFIED", verifiedAt: new Date() },
    create: {
      userId: agencyUser.id,
      name: "Sahara Tours Expert",
      managerName: "Ahmed Alami",
      email: "agency@test.com",
      phoneNumber: "+212 600 000 000",
      country: "Maroc",
      city: "Marrakech",
      description:
        "Agence spécialisée dans les voyages de groupe au Sahara et dans l'Atlas. Plus de 15 ans d'expérience avec la diaspora européenne et nord-américaine.",
      coverage: ["Sahara", "Atlas"],
      specialties: ["Aventure", "Culturel"],
      siret: "MA-842123456",
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
    },
  });

  const tripCount = await prisma.groupTrip.count({ where: { agencyId: agency.id } });
  if (tripCount === 0) {
    const trips = [
      {
        title: "Réveillon à Taghit 2027",
        slug: "reveillon-taghit-2027",
        destination: "Taghit (Sahara), Algérie",
        description:
          "Célébrez le passage à la nouvelle année dans l'enchanteresse oasis de Taghit. Entre les dunes géantes du Grand Erg Occidental et l'architecture millénaire du Ksar, vivez une expérience saharienne authentique avec guide local, pension complète et bivouac sous les étoiles.",
        coverImage:
          "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=2070&auto=format&fit=crop",
        startDate: new Date("2026-12-27"),
        endDate: new Date("2027-01-02"),
        durationDays: 6,
        totalPrice: 1250,
        depositAmount: 300,
        totalSpots: 12,
        bookedSpots: 3,
        tripType: "AVENTURE" as const,
        inclusions: ["Guide local", "Pension complète", "Transferts", "Bivouac"],
        exclusions: ["Vols internationaux", "Dépenses personnelles"],
        meetingPoint: "Aéroport de Béchar (BKR)",
        aiTags: ["sahara", "desert", "aventure"],
      },
      {
        title: "Trek dans le Tassili",
        slug: "trek-aventure-tassili",
        destination: "Djanet, Algérie",
        description:
          "Explorez les paysages lunaires du Tassili n'Ajjer avec un trek guidé de 8 jours. Art rupestre, canyons et nuits en bivouac pour une aventure inoubliable au cœur du Sahara algérien, adaptée aux passionnés de randonnée modérée.",
        coverImage:
          "https://images.unsplash.com/photo-1504233529578-6d46baba6d34?q=80&w=2070&auto=format&fit=crop",
        startDate: new Date("2026-09-12"),
        endDate: new Date("2026-09-19"),
        durationDays: 7,
        totalPrice: 1350,
        depositAmount: 350,
        totalSpots: 12,
        bookedSpots: 5,
        tripType: "AVENTURE" as const,
        inclusions: ["Guide", "Repas", "4x4", "Hébergement"],
        exclusions: ["Vols", "Assurance"],
        meetingPoint: "Aéroport de Djanet (DJA)",
        aiTags: ["tassili", "trek", "aventure"],
      },
      {
        title: "Découverte de Marrakech",
        slug: "escapade-culturelle-marrakech",
        destination: "Marrakech, Maroc",
        description:
          "Une semaine culturelle à Marrakech : médina, jardins Majorelle, cuisine locale et excursion dans l'Atlas. Idéal pour les familles et les premiers voyageurs au Maroc, avec hébergement en riad et guide francophone.",
        coverImage:
          "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=2070&auto=format&fit=crop",
        startDate: new Date("2026-10-05"),
        endDate: new Date("2026-10-12"),
        durationDays: 7,
        totalPrice: 890,
        depositAmount: 200,
        totalSpots: 15,
        bookedSpots: 2,
        tripType: "CULTURE" as const,
        inclusions: ["Guide", "Hébergement", "Petit-déjeuner"],
        exclusions: ["Vols", "Déjeuners libres"],
        meetingPoint: "Place Jemaa el-Fna",
        aiTags: ["culture", "famille", "marrakech"],
      },
    ];

    for (const t of trips) {
      await prisma.groupTrip.create({
        data: {
          agencyId: agency.id,
          ...t,
          images: [t.coverImage],
          guideLanguages: ["FR", "AR"],
          status: "PUBLISHED",
          isPublic: true,
        },
      });
    }
  }

  const reviewCount = await prisma.review.count();
  if (reviewCount === 0) {
    const samples = [
      {
        authorName: "Fatima Ben",
        authorEmail: "fatima@example.com",
        rating: 5,
        title: "Une expérience magique à Marrakech!",
        content:
          "Guide professionnel, hôtels confortables et paysages inoubliables. Je recommande vivement MaghrebVoyage.",
        destination: "Marrakech",
        tripDate: "Avril 2026",
      },
      {
        authorName: "Ahmed Slimani",
        authorEmail: "ahmed@example.com",
        rating: 4,
        title: "Très bon rapport qualité-prix",
        content:
          "Excellent pour un voyage en famille. Activités variées et bien organisées.",
        destination: "Taghit",
        tripDate: "Mars 2026",
      },
      {
        authorName: "Leila Mansouri",
        authorEmail: "leila@example.com",
        rating: 5,
        title: "Du Sahara à l'Atlas",
        content:
          "Organisation impeccable et accueil chaleureux. Ce voyage m'a transformée.",
        destination: "Djanet",
        tripDate: "Février 2026",
      },
    ];
    for (const r of samples) {
      await prisma.review.create({ data: { ...r, status: "APPROVED" } });
    }
  }

  console.log("Seed finished.");
}

main()
  .catch((e) => {
    const msg = String(e);
    if (msg.includes("Can't reach database server") || msg.includes("P1001")) {
      printDbHelp();
    } else {
      console.error(e);
    }
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
