import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { formatTrip } from "@/lib/trip-format";
import TripCard from "@/components/trips/TripCard";

export const revalidate = 60;

export default async function AgencyPublicPage({
  params,
}: {
  params: { id: string };
}) {
  const agency = await prisma.agency.findFirst({
    where: {
      id: params.id,
      verificationStatus: "VERIFIED",
    },
  });

  if (!agency) notFound();

  const trips = await prisma.groupTrip.findMany({
    where: {
      agencyId: agency.id,
      status: { in: ["PUBLISHED", "FULL"] },
      isPublic: true,
      startDate: { gt: new Date() },
    },
    include: { agency: true },
    orderBy: { startDate: "asc" },
  });

  const formatted = trips.map(formatTrip);

  return (
    <div>
      <main className="max-w-6xl mx-auto px-6 py-12 space-y-12">
        <div>
          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2">
            Agence partenaire
          </p>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">{agency.name}</h1>
          <p className="text-gray-500 font-medium mt-4 max-w-2xl">{agency.description}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-4">
            {agency.city}, {agency.country} · {agency.phoneNumber}
          </p>
        </div>

        <section>
          <h2 className="text-2xl font-black text-[#0F172A] mb-8">
            {formatted.length} voyage{formatted.length !== 1 ? "s" : ""}{" "}
            {formatted.length !== 1 ? "disponibles" : "disponible"}
          </h2>
          {formatted.length === 0 ? (
            <p className="text-gray-400 font-bold">Aucun départ à venir pour le moment.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {formatted.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </section>

        <Link
          href="/voyages"
          className="inline-block text-orange-600 text-[10px] font-black uppercase tracking-widest hover:underline"
        >
          ← Tous les voyages
        </Link>
      </main>
    </div>
  );
}
