"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { loadAiMatchResults, saveAiMatchResults } from "@/lib/ai-match-storage";
import { AlertCircle, Sparkles, ChevronRight, Loader2 } from "lucide-react";
import TripCard from "@/components/trips/TripCard";
import TripFilters from "@/components/trips/TripFilters";
import AiMatchPipeline from "@/components/ai/AiMatchPipeline";
import {
  CDC_FALLBACK_SECTION_TITLE,
  CDC_NO_EXACT_MATCH_MSG,
} from "@/lib/match-fallback";

const PAGE_SIZE = 12;

type MarketplaceTrip = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  startDate: string;
  totalPrice: number;
  bookedSpots: number;
  totalSpots: number;
  tripType: string;
  status?: string;
  coverImage?: string;
  inclusions?: string[];
};

type TripFilterPayload = {
  destination: string;
  type: string;
  budget: number;
  month: string;
  search: string;
};

// Inner component that uses useSearchParams — must be inside Suspense
function MarketplaceContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [filteredTrips, setFilteredTrips] = useState<MarketplaceTrip[]>([]);
  const [catalogueTrips, setCatalogueTrips] = useState<MarketplaceTrip[]>([]);
  const [sortOrder, setSortOrder] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [isMatchedMode, setIsMatchedMode] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiMatchMode, setAiMatchMode] = useState<"qualified" | "fallback" | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const isMatched = searchParams.get("matched") === "true";
      const requestId = searchParams.get("request")?.trim() || "";
      const stored = loadAiMatchResults();
      const hasStored = stored.results.length > 0;

      setIsMatchedMode(isMatched || hasStored || Boolean(requestId));

      if (hasStored) {
        setFilteredTrips(stored.results as MarketplaceTrip[]);
        setAiSummary(stored.summary);
        setAiMatchMode(stored.matchMode);
        setLoading(false);
        return;
      }

      if (requestId) {
        try {
          const res = await fetch(
            `/api/travel-requests/${encodeURIComponent(requestId)}/recommendations`
          );
          const data = await res.json();
          if (data.success && Array.isArray(data.results) && data.results.length > 0) {
            saveAiMatchResults(data.results, data.summary || "", {
              matchMode: data.matchMode,
              travelRequestId: requestId,
            });
            setFilteredTrips(data.results as MarketplaceTrip[]);
            setAiSummary(data.summary || "");
            setAiMatchMode(
              data.matchMode === "fallback" ? "fallback" : "qualified"
            );
            setLoading(false);
            return;
          }
          if (data.summary) setAiSummary(data.summary);
        } catch {
          /* fall through to catalogue */
        }
      }

      if (isMatched && !requestId) {
        setFilteredTrips([]);
        setAiSummary(stored.summary);
        setAiMatchMode(stored.matchMode);
      }

      const dest = searchParams.get("destination");

      try {
        const res = await fetch("/api/trips");
        const data = await res.json();
        let list = data.trips?.length > 0 ? data.trips : [];

        if (dest && dest !== "Toutes les destinations") {
          list = list.filter((trip: MarketplaceTrip) => trip.destination.includes(dest));
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

  const handleFilter = (filters: TripFilterPayload) => {
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
    setPage(1);
  };

  const travelerName =
    session?.user?.role === "CLIENT" ? session.user.name?.trim() : null;

  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / PAGE_SIZE));
  const paginatedTrips = filteredTrips.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

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
                  <span className={`text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${
                    aiMatchMode === "fallback" ? "bg-gray-500" : "bg-orange-600"
                  }`}>
                    {aiMatchMode === "fallback" ? "Suggestions IA" : "Recommandations IA"}
                  </span>
                  <span className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{filteredTrips.length} voyages trouvés</span>
               </div>
               <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">
                  {aiMatchMode === "fallback"
                    ? CDC_FALLBACK_SECTION_TITLE
                    : <>{travelerName ? `${travelerName}, voici` : "Voici"} les voyages qui <span className="text-orange-500">vous correspondent</span> le mieux.</>}
               </h2>
               <p className="text-gray-400 font-medium max-w-2xl italic leading-relaxed">
                  {aiSummary ? `"${aiSummary}"` : "Résumé de votre demande IA."}
               </p>
               <div className="pt-4 max-w-xl">
                 <AiMatchPipeline
                   activeStep={4}
                   compact
                   matchMode={aiMatchMode}
                   qualifiedCount={filteredTrips.length}
                 />
               </div>
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
        <>
          <div className="mb-10 bg-gradient-to-br from-[#0F172A] to-[#1e293b] rounded-[2.5rem] p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/15 rounded-full blur-[80px]" />
            <div className="relative z-10 max-w-2xl">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400 mb-3">
                Catalogue MaghrebVoyage
              </p>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
                Voyages de groupe au Maghreb
              </h1>
              <p className="text-gray-400 font-medium text-sm leading-relaxed">
                Filtrez par destination, budget et style — ou utilisez{" "}
                <Link href="/recherche" className="text-orange-400 font-bold hover:underline">
                  Trouver mon voyage
                </Link>{" "}
                pour un matching IA personnalisé.
              </p>
            </div>
          </div>
          <TripFilters onSort={handleSort} onFilter={handleFilter} currentSort={sortOrder} />
          {!loading && catalogueTrips.length > 0 && (
            <p className="mt-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              {filteredTrips.length} voyage{filteredTrips.length > 1 ? "s" : ""} disponible
              {filteredTrips.length > 1 ? "s" : ""}
            </p>
          )}
        </>
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
          <>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">
            {filteredTrips.length} résultat{filteredTrips.length > 1 ? "s" : ""}
            {totalPages > 1 ? ` — page ${page}/${totalPages}` : ""}
          </p>
          <div className="grid grid-cols-1 gap-12">
            {paginatedTrips.map((trip, i) => (
              <div
                key={trip.id}
                className={`animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both [animation-delay:${i * 100}ms]`}
              >
                <TripCard trip={trip} />
              </div>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-4 mt-12">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200 disabled:opacity-40"
              >
                Précédent
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#0F172A] text-white disabled:opacity-40"
              >
                Suivant
              </button>
            </div>
          )}
          </>
        ) : (
          <div className="space-y-16">
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-[4rem] border border-dashed border-gray-200">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-300 mb-6">
                <AlertCircle size={40} />
              </div>
              <h3 className="text-2xl font-black text-[#0F172A] mb-2">{CDC_NO_EXACT_MATCH_MSG}</h3>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-8">{CDC_FALLBACK_SECTION_TITLE}</p>
            </div>

            <div className="grid grid-cols-1 gap-12 opacity-60 grayscale hover:grayscale-0 transition-all duration-700">
               {upcomingFallback.map((trip) => (
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
