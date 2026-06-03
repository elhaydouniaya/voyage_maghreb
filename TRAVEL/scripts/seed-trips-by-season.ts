import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding test trips with seasons...");

  // Find or create a test agency first
  let agency = await prisma.agency.findFirst();
  
  if (!agency) {
    // Create a test user and agency
    const user = await prisma.user.create({
      data: {
        email: `agency-test-${Date.now()}@example.com`,
        name: "Test Agency",
        role: "AGENCY",
      },
    });

    agency = await prisma.agency.create({
      data: {
        userId: user.id,
        name: "Test Agency",
        managerName: "Test Manager",
        email: "agency-test@example.com",
        phoneNumber: "+1234567890",
        country: "Maroc",
        city: "Marrakech",
        description: "Description de l'agence de test pour les voyages par saison.",
        siret: `TESTSIRET${Date.now()}`,
      },
    });
  }

  // Test trips data
  const tripsData = [
    {
      title: "Printemps à Marrakech",
      destination: "Maroc",
      season: "SPRING",
      tripType: "CULTURE",
      startDate: new Date("2026-04-15"),
      endDate: new Date("2026-04-20"),
    },
    {
      title: "Été aux Îles Kerkennah",
      destination: "Tunisie",
      season: "SUMMER",
      tripType: "NATURE",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-08"),
    },
    {
      title: "Automne à Chinguetti",
      destination: "Mauritanie",
      season: "AUTUMN",
      tripType: "DESERT",
      startDate: new Date("2026-10-10"),
      endDate: new Date("2026-10-17"),
    },
    {
      title: "Hiver à Alger",
      destination: "Algérie",
      season: "WINTER",
      tripType: "HISTORIQUE",
      startDate: new Date("2026-12-20"),
      endDate: new Date("2026-12-27"),
    },
    {
      title: "Aventure Désert du Sahara",
      destination: "Maroc",
      season: "WINTER",
      tripType: "AVENTURE",
      startDate: new Date("2027-01-15"),
      endDate: new Date("2027-01-22"),
    },
    {
      title: "Côte Méditerranéenne Libyenne",
      destination: "Libye",
      season: "SPRING",
      tripType: "NATURE",
      startDate: new Date("2026-05-01"),
      endDate: new Date("2026-05-08"),
    },
  ];

  for (const tripData of tripsData) {
    const slug = `${tripData.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    
    const existingTrip = await prisma.groupTrip.findUnique({
      where: { slug },
    });

    if (!existingTrip) {
      await prisma.groupTrip.create({
        data: {
          agencyId: agency.id,
          title: tripData.title,
          slug,
          destination: tripData.destination,
          tripType: tripData.tripType as any,
          startDate: tripData.startDate,
          endDate: tripData.endDate,
          durationDays: Math.ceil(
            (tripData.endDate.getTime() - tripData.startDate.getTime()) / (1000 * 60 * 60 * 24)
          ),
          description: `Découvrez ${tripData.destination} en ${tripData.season.toLowerCase()}. Une expérience inoubliable vous attend avec guide local expert et confort assuré.`,
          totalPrice: Math.floor(Math.random() * 2000) + 500,
          depositAmount: Math.floor(Math.random() * 500) + 100,
          totalSpots: 12,
          bookedSpots: Math.floor(Math.random() * 5),
          coverImage: `/maroc.jpg`,
          status: "PUBLISHED",
          isPublic: true,
        },
      });
      console.log(`✅ Created trip: ${tripData.title} (${tripData.season})`);
    }
  }

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
