"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { saveAiMatchResults, loadAiMatchResults } from "@/lib/ai-match-storage";
import { AlertCircle, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import TripCard from "@/components/trips/TripCard";
import TripFilters from "@/components/trips/TripFilters";

// Inner component that uses useSearchParams — must be inside Suspense
function MarketplaceContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [catalogueTrips, setCatalogueTrips] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState("");
  const [loading, setLoading] = useState(true);

  const [isMatchedMode, setIsMatchedMode] = useState(false);
  const [aiSummary, setAiSummary] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const isMatched = searchParams.get("matched") === "true";
      const stored = loadAiMatchResults();
      const hasStored = stored.results.length > 0;

      setIsMatchedMode(isMatched || hasStored);

      if (isMatched || hasStored) {
        setFilteredTrips(stored.results as any[]);
        setAiSummary(stored.summary);
        setLoading(false);
        return;
      }

      const dest = searchParams.get("destination");

      try {
        const res = await fetch("/api/trips");
        const data = await res.json();
        let list = data.trips?.length > 0 ? data.trips : [];

        if (dest && dest !== "Toutes les destinations") {
          list = list.filter((trip: any) => trip.destination.includes(dest));
        }
        setCatalogueTrips(list);
        setFilteredTrips(list);
      } catch {
        setCatalogueTrips([]);
        setFilteredTrips([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    window.addEventListener("storage", loadData);
    return () => window.removeEventListener("storage", loadData);
  }, [searchParams]);

  const handleSort = (order: "asc" | "desc") => {
    const sorted = [...filteredTrips].sort((a, b) => {
      return order === "asc" ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice;
    });
    setFilteredTrips(sorted);
    setSortOrder(order);
  };

  const handleFilter = (filters: any) => {
    let result = catalogueTrips.filter((trip) => {
      const isPublished = trip.status === "PUBLISHED";
      const matchDest = filters.destination === "Toutes les destinations" || trip.destination.includes(filters.destination);
      const matchType = filters.type === "TOUS" || trip.tripType === filters.type;
      const matchBudget = trip.totalPrice <= filters.budget;
      const matchMonth = !filters.month || (trip.startDate && trip.startDate.includes(filters.month.split(" ")[0]));
      const matchSearch = !filters.search ||
        trip.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        trip.destination.toLowerCase().includes(filters.search.toLowerCase());

      return isPublished && matchDest && matchType && matchBudget && matchMonth && matchSearch;
    });

    if (sortOrder) {
      result = result.sort((a, b) =>
        sortOrder === "asc" ? a.totalPrice - b.totalPrice : b.totalPrice - a.totalPrice
      );
    }

    setFilteredTrips(result);
  };

  const upcomingFallback = catalogueTrips
    .filter((t) => new Date(t.startDate) > new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 3);

  return (
    <main className="max-w-7xl mx-auto px-6 py-16">
      {isMatchedMode ? (
        <div className="mb-12 bg-[#0F172A] rounded-[3.5rem] p-10 md:p-16 relative overflow-hidden text-white shadow-2xl">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center shadow-xl shadow-orange-600/20 shrink-0">
               <Sparkles size={40} className="text-white" />
            </div>
            <div className="space-y-4 text-center md:text-left">
               <div className="flex items-center gap-3 justify-center md:justify-start">
                  <span className="bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full">Recommandations de l'IA</span>
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{filteredTrips.length} voyages trouvés</span>
               </div>
               <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                  {session?.user?.name ? `${session.user.name}, voici` : "Voici"} les voyages qui <span className="text-orange-500">vous correspondent</span> le mieux.
               </h2>
               <p className="text-gray-400 font-medium max-w-2xl italic leading-relaxed">
                  "{aiSummary}"
               </p>
               <button 
                onClick={() => window.location.href = "/recherche"}
                className="inline-flex items-center gap-2 text-xs font-black text-orange-500 uppercase tracking-widest hover:text-orange-400 transition-colors pt-4"
               >
                 Affiner ma demande <ChevronRight size={14} />
               </button>
            </div>
          </div>
        </div>
      ) : (
        <TripFilters onSort={handleSort} onFilter={handleFilter} currentSort={sortOrder} />
      )}

      <div className="mt-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="animate-spin text-orange-600" size={32} />
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
              Chargement des voyages...
            </p>
          </div>
        ) : filteredTrips.length > 0 ? (
          <div className="grid grid-cols-1 gap-12">
            {filteredTrips.map((trip, i) => (
              <div
                key={trip.id}
                className={`animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both [animation-delay:${i * 100}ms]`}
              >
                <TripCard trip={trip} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-16">
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[4rem] border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-[#0F172A] mb-2">Aucun voyage ne correspond exactement</h3>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-8">Essayez de modifier vos filtres. En attendant, voici les prochains départs :</p>
            </div>

            <div className="grid grid-cols-1 gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
               {upcomingFallback.map((trip, i) => (
                 <div key={trip.id} className="relative">
                    <div className="absolute -top-4 left-10 z-10 bg-orange-600 text-white text-[10px] font-black px-6 py-2 rounded-full shadow-xl">PROCHAIN DÉPART</div>
                    <TripCard trip={trip} />
                 </div>
               ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-300 font-black tracking-widest uppercase">Chargement des voyages...</p>
        </div>
      }>
        <MarketplaceContent />
      </Suspense>
  );
}
