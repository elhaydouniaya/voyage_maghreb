"use client";

import { Search, Filter, ChevronDown, Calendar, MapPin, Wallet, Sparkles } from "lucide-react";
import { useState } from "react";

interface TripFiltersProps {
  onSort?: (order: "asc" | "desc") => void;
  onFilter?: (filters: any) => void;
  currentSort?: string;
}

export default function TripFilters({ onSort, onFilter, currentSort }: TripFiltersProps) {
  const [budget, setBudget] = useState(3000);
  const [activeType, setActiveType] = useState("TOUS");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedDest, setSelectedDest] = useState("Toutes les destinations");
  const [searchQuery, setSearchQuery] = useState("");

  const months = [
    "Janvier 2025", "Février 2025", "Mars 2025", "Avril 2025", 
    "Mai 2025", "Juin 2025", "Juillet 2025", "Août 2025", 
    "Septembre 2025", "Octobre 2025", "Novembre 2025", "Décembre 2025",
    "Janvier 2026", "Février 2026", "Mars 2026", "Avril 2026"
  ];

  const types = [
    { label: "DÉSERT", value: "DESERT" },
    { label: "CULTURE", value: "CULTURE" },
    { label: "AVENTURE", value: "AVENTURE" },
    { label: "LUXE", value: "LUXE" }
  ];

  const handleApply = () => {
    onFilter?.({
      destination: selectedDest,
      month: selectedMonth,
      budget: budget,
      type: activeType,
      search: searchQuery
    });
  };

  return (
    <div className="space-y-8">
      {/* Header with Search & Sort */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 px-4">
        <div className="space-y-2">
          <h1 className="text-5xl font-black text-[#0F172A] tracking-tighter leading-none">Nos Voyages</h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Explorer les trésors du Maghreb</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-6 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 lg:flex-none flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApply();
                }}
                placeholder="Chercher une destination..." 
                className="bg-white border border-gray-100 rounded-3xl pl-16 pr-8 py-5 text-sm font-bold text-[#0F172A] focus:ring-[12px] focus:ring-[#2563EB]/5 w-full lg:w-[400px] shadow-sm outline-none transition-all placeholder:text-gray-300"
              />
            </div>
            <button 
              onClick={handleApply}
              className="bg-[#0F172A] text-white p-5 rounded-3xl hover:bg-[#2563EB] transition-all active:scale-95 shadow-lg shadow-[#0F172A]/10"
              title="Lancer la recherche"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="relative group">
            <span className="absolute -top-6 right-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trier par</span>
            <button className="flex items-center gap-4 bg-white px-8 py-5 rounded-3xl border border-gray-100 text-sm font-black text-[#0F172A] hover:border-orange-500/20 hover:shadow-lg transition-all">
              {currentSort === 'asc' ? 'Prix croissant' : currentSort === 'desc' ? 'Prix décroissant' : 'Date de départ'} 
              <ChevronDown size={18} className="text-orange-600 group-hover:rotate-180 transition-transform" />
            </button>
            <div className="absolute top-full right-0 mt-3 w-64 bg-[#0F172A] rounded-[2.5rem] shadow-2xl p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100] transform origin-top-right group-hover:translate-y-0 translate-y-2">
               <button 
                 onClick={() => onSort?.("asc")}
                 className={`w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all ${currentSort === 'asc' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
               >
                 Prix : Croissant
               </button>
               <button 
                 onClick={() => onSort?.("desc")}
                 className={`w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all border-t border-white/5 mt-1 ${currentSort === 'desc' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
               >
                 Prix : Décroissant
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Filter Panel */}
      <div className="bg-white p-10 lg:p-12 rounded-[4rem] border border-gray-50 shadow-2xl shadow-gray-200/50 flex flex-col lg:flex-row items-center gap-8 relative">
        
        {/* Destination Select */}
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-center gap-2 ml-2">
            <MapPin size={12} className="text-orange-600" />
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Destination</label>
          </div>
          <div className="relative">
             <select 
               id="destination-select"
               value={selectedDest}
               onChange={(e) => setSelectedDest(e.target.value)}
               title="Sélectionner une destination"
               className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 text-xs font-black text-[#0F172A] appearance-none outline-none focus:ring-8 focus:ring-orange-500/5 transition-all cursor-pointer"
             >
               <option>Toutes les destinations</option>
               <option>Algérie</option>
               <option>Maroc</option>
               <option>Tunisie</option>
               <option>Mauritanie</option>
               <option>Libye</option>
             </select>
             <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Month Select */}
        <div className="flex-1 w-full space-y-3">
          <div className="flex items-center gap-2 ml-2">
            <Calendar size={12} className="text-orange-600" />
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Période</label>
          </div>
          <div className="relative">
             <select 
               id="period-select"
               value={selectedMonth}
               onChange={(e) => setSelectedMonth(e.target.value)}
               title="Sélectionner une période"
               className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 text-xs font-black text-[#0F172A] appearance-none outline-none focus:ring-8 focus:ring-orange-500/5 transition-all cursor-pointer"
             >
               <option value="">Tous les mois</option>
               {months.map(m => <option key={m} value={m}>{m}</option>)}
             </select>
             <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={16} />
          </div>
        </div>

        {/* Budget Slider */}
        <div className="flex-1 w-full space-y-4">
          <div className="flex justify-between items-center ml-2">
            <div className="flex items-center gap-2">
              <Wallet size={12} className="text-orange-600" />
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Budget Max</label>
            </div>
            <span className="text-sm font-black text-orange-600">{budget}€</span>
          </div>
          <div className="px-2">
            <input 
              id="budget-range"
              type="range" 
              min="100" 
              max="3000" 
              step="50"
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              title="Ajuster le budget maximum"
              className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-orange-600" 
            />
          </div>
        </div>

        {/* Experience & Button */}
        <div className="flex-[1.5] w-full flex flex-col md:flex-row items-end gap-4">
           <div className="flex-1 space-y-3">
              <div className="flex items-center gap-2 ml-2">
                <Sparkles size={12} className="text-orange-600" />
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expérience</label>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {types.map((type) => (
                  <button 
                    key={type.label} 
                    onClick={() => setActiveType(type.value === activeType ? "TOUS" : type.value)}
                    className={`px-3 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                      activeType === type.value 
                        ? "bg-[#0F172A] text-white border-[#0F172A] shadow-lg shadow-[#0F172A]/10" 
                        : "bg-[#F8FAFC] text-gray-400 border-gray-100 hover:border-orange-500/30 hover:text-orange-600"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
           </div>

           <button 
             onClick={handleApply}
             className="h-[58px] bg-orange-600 text-white px-8 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-orange-500/20 hover:bg-orange-700 transition-all active:scale-95 flex items-center justify-center gap-3 group shrink-0"
           >
              <Filter size={16} className="group-hover:rotate-180 transition-transform duration-700" />
              APPLIQUER
           </button>
        </div>
      </div>
    </div>
  );
}
