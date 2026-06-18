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
    update: {
      verificationStatus: "VERIFIED",
      verifiedAt: new Date(),
      slug: "sahara-tours-expert",
    },
    create: {
      userId: agencyUser.id,
      name: "Sahara Tours Expert",
      slug: "sahara-tours-expert",
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

  const externalReviewCount = await prisma.externalReview.count({
    where: { agencyId: agency.id },
  });
  if (externalReviewCount === 0) {
    const extSamples = [
      {
        platform: "GOOGLE" as const,
        authorName: "Claire Dupont",
        rating: 5,
        title: "Agence au top !",
        content:
          "Circuit Sahara parfaitement organisé. Chauffeurs ponctuels, hôtels confortables et guide francophone excellent. Nous avons déjà réservé notre prochain voyage avec eux.",
        reviewDate: new Date("2025-11-12"),
        sourceUrl:
          "https://www.google.com/maps/search/Sahara+Tours+Expert+Marrakech",
        location: "Marrakech, Maroc",
      },
      {
        platform: "TRIPADVISOR" as const,
        authorName: "Roberto M.",
        rating: 5,
        title: "Excellente expérience au Maroc",
        content:
          "Voyage en petit groupe très bien géré. L'agence connaît parfaitement la région et propose des expériences authentiques loin du tourisme de masse.",
        reviewDate: new Date("2025-09-03"),
        sourceUrl:
          "https://www.tripadvisor.com/Search?q=Sahara+Tours+Expert",
        location: "Marrakech, Maroc",
      },
      {
        platform: "FACEBOOK" as const,
        authorName: "Samira B.",
        rating: 4,
        title: "Très satisfaite",
        content:
          "Bonne communication avant le départ. Le trek dans l'Atlas était magnifique. Petit bémol sur un transfert en retard mais vite résolu.",
        reviewDate: new Date("2025-07-21"),
        sourceUrl:
          "https://www.facebook.com/search/pages?q=Sahara+Tours+Expert",
        location: "Marrakech, Maroc",
      },
      {
        platform: "VIATOR" as const,
        authorName: "James W.",
        rating: 5,
        title: "Highly recommended",
        content:
          "Professional team, great value for money. The desert camp experience was the highlight of our Morocco trip.",
        reviewDate: new Date("2025-05-15"),
        sourceUrl: "https://www.viator.com/searchResults/all?text=Sahara+Tours",
        location: "Marrakech, Maroc",
      },
    ];
    for (const r of extSamples) {
      await prisma.externalReview.create({
        data: { agencyId: agency.id, ...r },
      });
    }
  }

  const reviewCount = await prisma.review.count();
  if (reviewCount === 0) {
    const tripsBySlug = Object.fromEntries(
      (
        await prisma.groupTrip.findMany({
          where: { agencyId: agency.id },
          select: { id: true, slug: true },
        })
      ).map((t) => [t.slug, t.id])
    );

    const samples = [
      {
        authorName: "Fatima Ben",
        authorEmail: "fatima@example.com",
        rating: 5,
        title: "Une expérience magique à Marrakech!",
        content:
          "Guide professionnel, hôtels confortables et paysages inoubliables. Je recommande vivement cette agence.",
        destination: "Marrakech",
        tripDate: "Avril 2026",
        groupTripId: tripsBySlug["escapade-culturelle-marrakech"],
      },
      {
        authorName: "Ahmed Slimani",
        authorEmail: "ahmed@example.com",
        rating: 4,
        title: "Très bon rapport qualité-prix",
        content:
          "Excellent pour un voyage en famille. Activités variées et bien organisées à Taghit.",
        destination: "Taghit",
        tripDate: "Mars 2026",
        groupTripId: tripsBySlug["reveillon-taghit-2027"],
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
        groupTripId: tripsBySlug["trek-aventure-tassili"],
      },
      {
        authorName: "Karim Boudiaf",
        authorEmail: "karim@example.com",
        rating: 2,
        title: "Organisation perfectible",
        content:
          "Retard au point de rendez-vous et hébergement moins confortable que prévu. L'agence doit améliorer sa communication.",
        destination: "Taghit",
        tripDate: "Janvier 2026",
        groupTripId: tripsBySlug["reveillon-taghit-2027"],
        status: "PENDING" as const,
      },
    ];
    for (const r of samples) {
      await prisma.review.create({
        data: { ...r, status: r.status ?? "APPROVED" },
      });
    }
  }

  const auditCount = await prisma.auditLog.count();
  if (auditCount === 0) {
    const admin = await prisma.user.findUnique({
      where: { email: "admin@maghrebvoyage.com" },
      select: { id: true },
    });
    if (admin) {
      const seededAt = Date.now();
      const agencyTripCount = await prisma.groupTrip.count({
        where: { agencyId: agency.id },
      });
      await prisma.auditLog.createMany({
        data: [
          {
            action: "AGENCY_VERIFIED",
            userId: admin.id,
            details: JSON.stringify({
              agencyId: agency.id,
              agencyName: agency.name,
              source: "seed",
            }),
            createdAt: new Date(seededAt - 7 * 86400000),
          },
          {
            action: "TRIP_PUBLISHED",
            userId: admin.id,
            details: JSON.stringify({ agencyId: agency.id, source: "seed" }),
            createdAt: new Date(seededAt - 5 * 86400000),
          },
          {
            action: "SYSTEM_SEED_COMPLETE",
            userId: admin.id,
            details: JSON.stringify({ trips: agencyTripCount }),
            createdAt: new Date(),
          },
        ],
      });
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
