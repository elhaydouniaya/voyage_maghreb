"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { AlertCircle, Globe, Sparkles, ChevronRight, User } from "lucide-react";
import TripCard from "@/components/trips/TripCard";
import TripFilters from "@/components/trips/TripFilters";
import { NavbarAuth } from "@/components/auth/NavbarAuth";
import AIChatWidget from "../../../components/ai/AIChatWidget";
import { getMergedTrips } from "@/lib/trips";
import MainNavbar from "@/components/layout/MainNavbar";

// Inner component that uses useSearchParams — must be inside Suspense
function MarketplaceContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [sortOrder, setSortOrder] = useState("");

  const [isMatchedMode, setIsMatchedMode] = useState(false);
  const [aiSummary, setAiSummary] = useState("");

  useEffect(() => {
    const loadData = () => {
      const isMatched = searchParams.get("matched") === "true";
      setIsMatchedMode(isMatched);

      if (isMatched) {
        const results = JSON.parse(sessionStorage.getItem("ai_match_results") || "[]");
        const summary = sessionStorage.getItem("ai_match_summary") || "";
        setFilteredTrips(results);
        setAiSummary(summary);
      } else {
        const allTrips = getMergedTrips();
        const publishedOnly = allTrips.filter(t => t.status === "PUBLISHED");

        const dest = searchParams.get("destination");
        if (dest) {
          const result = publishedOnly.filter(trip => {
            return dest === "Toutes les destinations" || trip.destination.includes(dest);
          });
          setFilteredTrips(result);
        } else {
          setFilteredTrips(publishedOnly);
        }
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
    const allTrips = getMergedTrips();

    let result = allTrips.filter(trip => {
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

  const upcomingFallback = getMergedTrips()
    .filter(t => t.status === "PUBLISHED" && new Date(t.startDate) > new Date())
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
        {filteredTrips.length > 0 ? (
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
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Navbar */}
      <MainNavbar />

      <Suspense fallback={
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <p className="text-gray-300 font-black tracking-widest uppercase">Chargement des voyages...</p>
        </div>
      }>
        <MarketplaceContent />
      </Suspense>

      <footer className="bg-[#0F172A] py-12 px-6 text-center">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
          © 2026 MaghrebVoyage — L'aventure vous attend
        </p>
      </footer>
      <AIChatWidget />
    </div>
  );
}
