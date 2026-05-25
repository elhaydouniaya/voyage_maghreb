"use client";

import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { formatPriceShort } from "@/lib/currency";
import { sanitizeImageUrl } from "@/lib/images";
import SafeImage from "@/components/ui/SafeImage";
import { SEASON_LABELS, SEASON_DESCRIPTIONS, type Season } from "@/lib/seasons";

const TRIP_TAG_COLORS: Record<string, string> = {
  DESERT: "bg-orange-500",
  CULTURE: "bg-[#0F172A]",
  AVENTURE: "bg-orange-600",
  FAMILLE: "bg-blue-500",
  LUXE: "bg-purple-600",
  NATURE: "bg-green-600",
  RELIGIEUX: "bg-amber-600",
  HISTORIQUE: "bg-red-600",
};

interface Trip {
  id: string;
  title: string;
  slug: string;
  destination: string;
  tripType: string;
  totalPrice: number;
  coverImage: string;
  totalSpots: number;
  bookedSpots: number;
  season?: Season;
}

interface TripsBySeason {
  season: Season;
  trips: Trip[];
}

export default function TripsGroupedBySeason({ groupedTrips }: { groupedTrips: TripsBySeason[] }) {
  return (
    <div className="space-y-24">
      {groupedTrips.map((group) => {
        if (group.trips.length === 0) return null;
        
        const seasonLabel = SEASON_LABELS[group.season];
        const seasonDesc = SEASON_DESCRIPTIONS[group.season];

        return (
          <section key={group.season} className="space-y-12">
            {/* Season Header */}
            <div className="flex flex-col gap-2 mb-8">
              <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight">
                {seasonLabel}
              </h2>
              <p className="text-gray-500 font-medium text-lg">{seasonDesc}</p>
              <p className="text-sm text-gray-400 font-semibold">
                {group.trips.length} voyage{group.trips.length > 1 ? 's' : ''} disponible{group.trips.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Trips Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {group.trips.map((trip) => {
                const spotsLeft = Math.max(0, (trip.totalSpots || 0) - (trip.bookedSpots || 0));
                const tagColor = TRIP_TAG_COLORS[trip.tripType] || "bg-orange-500";
                const cover = sanitizeImageUrl(trip.coverImage, trip.destination);

                return (
                  <div key={trip.id} className="group bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-700">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <SafeImage 
                        src={cover} 
                        alt={trip.title} 
                        fill 
                        sizes="(max-width: 768px) 100vw, 25vw" 
                        destination={trip.destination} 
                        className="object-cover transition-transform duration-[2000ms] group-hover:scale-110" 
                      />
                      <div className={`absolute top-6 left-6 ${tagColor} text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-2xl`}>
                        {trip.tripType}
                      </div>
                    </div>
                    <div className="p-8 space-y-6">
                      <div>
                        <h4 className="font-black text-[#0F172A] text-xl mb-1 tracking-tight group-hover:text-orange-600 transition-colors">
                          {trip.title}
                        </h4>
                        <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                          <MapPin size={10} /> {trip.destination}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                        <div>
                          <div className="text-2xl font-black text-[#0F172A]">
                            {formatPriceShort(trip.totalPrice)}
                          </div>
                          <div className="text-[9px] text-gray-400 font-bold">
                            (~{Math.round(Number(trip.totalPrice))} €)
                          </div>
                          {spotsLeft > 0 && (
                            <div className="text-[10px] text-orange-600 font-black uppercase tracking-widest mt-1">
                              {spotsLeft} places restantes
                            </div>
                          )}
                        </div>
                        <Link 
                          href={`/trip/${trip.slug}`} 
                          className="w-12 h-12 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-[#0F172A] hover:bg-orange-600 hover:text-white transition-all shadow-sm"
                        >
                          <ArrowRight size={18} />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Divider */}
            <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </section>
        );
      })}
    </div>
  );
}
