import { prisma } from "./prisma";

// Curated, verified Unsplash images — matched to correct Maghreb locations
export const INITIAL_TRIPS = [
  { 
    id: "1", 
    title: "Réveillon à Taghit 2027", 
    slug: "reveillon-taghit-2027", 
    destination: "Taghit (Sahara), Algérie", 
    startDate: "2026-12-27", 
    endDate: "2027-01-02", 
    totalPrice: 1250,
    depositAmount: 300,
    totalSpots: 12, 
    bookedSpots: 8, 
    tripType: "AVENTURE",
    status: "PUBLISHED",
    aiTags: ["sahara", "desert", "aventure", "nouvel an"],
    coverImage: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=2070&auto=format&fit=crop",
    images: [
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=2070&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=2076&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=2070&auto=format&fit=crop"
    ],
    inclusions: ["Guide local", "Pension complète", "Transferts", "Bivouac"],
    description: "Célébrez le passage à la nouvelle année dans l'enchanteresse oasis de Taghit. Entre les dunes géantes du Grand Erg Occidental et l'architecture millénaire du Ksar, vivez une expérience saharienne authentique.",
    meetingPoint: "Aéroport de Béchar (BKR)",
    exclusions: ["Vols internationaux", "Dépenses personnelles"]
  },
  // ... (Other trips kept in memory for now)
];

/**
 * Migration Helper: Sync Initial Trips to DB if empty
 */
export async function syncInitialTripsToDB() {
  if (typeof window !== "undefined") return;
  
  try {
    const count = await prisma.groupTrip.count();
    if (count > 0) return;

    // We'd need an agency to associate these with
    const demoAgency = await prisma.agency.findFirst();
    if (!demoAgency) return;

    for (const trip of INITIAL_TRIPS) {
      await prisma.groupTrip.create({
        data: {
          agencyId: demoAgency.id,
          title: trip.title,
          slug: trip.slug,
          destination: trip.destination,
          description: trip.description,
          coverImage: trip.coverImage,
          images: trip.images,
          startDate: new Date(trip.startDate),
          endDate: new Date(trip.endDate),
          durationDays: 7,
          totalPrice: trip.totalPrice,
          depositAmount: trip.depositAmount,
          totalSpots: trip.totalSpots,
          bookedSpots: trip.bookedSpots,
          tripType: trip.tripType as any,
          inclusions: trip.inclusions,
          exclusions: trip.exclusions,
          meetingPoint: trip.meetingPoint,
          status: "PUBLISHED"
        }
      });
    }
  } catch (e) {
    console.error("Migration error", e);
  }
}

/**
 * Client-side safe getter (uses localStorage + hardcoded fallback)
 */
export const getMergedTrips = () => {
  if (typeof window === "undefined") return INITIAL_TRIPS;
  
  const localTrips = JSON.parse(localStorage.getItem("agency_trips") || "[]");
  const merged = [...INITIAL_TRIPS];
  
  localTrips.forEach((lt: any) => {
    const index = merged.findIndex(it => it.id === lt.id || it.slug === lt.slug);
    if (index !== -1) {
      merged[index] = { ...merged[index], ...lt };
    } else {
      merged.push(lt);
    }
  });
  
  return merged;
};

/**
 * Server-side getter using Prisma
 */
export async function getDbTrips() {
  try {
    return await prisma.groupTrip.findMany({
      where: { status: "PUBLISHED" },
      include: { agency: true },
      orderBy: { startDate: 'asc' }
    });
  } catch (e) {
    console.error("DB Fetch error", e);
    return [];
  }
}

export const updateTripSpots = (tripId: string) => {
  if (typeof window === "undefined") return;
  
  const localTrips = JSON.parse(localStorage.getItem("agency_trips") || "[]");
  const merged = getMergedTrips();
  
  const tripToUpdate = merged.find(t => t.id === tripId || t.slug === tripId);
  if (!tripToUpdate) return;
  
  const updatedTrip = { 
    ...tripToUpdate, 
    bookedSpots: (Number(tripToUpdate.bookedSpots) || 0) + 1 
  };
  
  const existingLocalIndex = localTrips.findIndex((t: any) => t.id === updatedTrip.id || t.slug === updatedTrip.slug);
  if (existingLocalIndex !== -1) {
    localTrips[existingLocalIndex] = updatedTrip;
  } else {
    localTrips.push(updatedTrip);
  }
  
  localStorage.setItem("agency_trips", JSON.stringify(localTrips));
  window.dispatchEvent(new Event("storage"));
};
