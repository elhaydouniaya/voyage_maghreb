"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { saveAiMatchResults } from "@/lib/ai-match-storage";
import { trackBehaviorEvent } from "@/components/analytics/BehaviorTracker";
import { formatPriceShort, formatBudgetMad } from "@/lib/currency";
import {
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  MapPin, 
  Calendar, 
} from "lucide-react";
import Image from "next/image";
import AiMatchPipeline from "@/components/ai/AiMatchPipeline";
import {
  CDC_FALLBACK_SECTION_TITLE,
  CDC_NO_EXACT_MATCH_MSG,
} from "@/lib/match-fallback";

const TRIP_TYPES = [
  { id: "DESERT", label: "Désert", icon: "🌵" },
  { id: "CULTURE", label: "Culture", icon: "🕌" },
  { id: "AVENTURE", label: "Aventure", icon: "🎒" },
  { id: "FAMILLE", label: "Famille", icon: "👨‍👩-👧‍👦" },
  { id: "LUXE", label: "Luxe", icon: "✨" },
  { id: "NATURE", label: "Nature", icon: "🌿" },
  { id: "RELIGIEUX", label: "Religieux", icon: "🌙" },
  { id: "HISTORIQUE", label: "Histoire", icon: "🏛️" },
];

const ACTIVITIES = ["Randonnée", "Sandboard", "Thé traditionnel", "Visite de souk", "Bivouac", "Spa & Hammam", "Quad"];

type MatchResult = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  coverImage: string;
  compatibility: number;
  isFallback?: boolean;
  matchScore?: number;
  matchReasons?: string[];
  totalPrice: number;
};

export default function MultiStepSearch() {
  const { data: session } = useSession();
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<MatchResult[]>([]);
  const [summary, setSummary] = useState("");
  const [matchMode, setMatchMode] = useState<"qualified" | "fallback" | null>(null);
  const [travelRequestId, setTravelRequestId] = useState<string | null>(null);
  const [analyzePhase, setAnalyzePhase] = useState(0);
  const [matchError, setMatchError] = useState("");
  const [fallbackTitle, setFallbackTitle] = useState(CDC_FALLBACK_SECTION_TITLE);
  const [noExactMsg, setNoExactMsg] = useState(CDC_NO_EXACT_MATCH_MSG);

  const [formData, setFormData] = useState({
    destination: "",
    isDateFlexible: true,
    startDate: "",
    endDate: "",
    duration: 7,
    numberOfTravelers: 2,
    adults: 2,
    children: 0,
    budgetMax: 1500,
    tripType: [] as string[],
    tripStyle: [] as string[],
    accommodation: "Hôtel",
    transportIncluded: true,
    activities: [] as string[],
    constraints: "",
    language: "FR",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    clientCountry: "France",
    consentRGPD: false,
    acceptCGU: false
  });

  useEffect(() => {
    const homePrompt = sessionStorage.getItem("home_ai_prompt")?.trim();
    if (homePrompt) {
      sessionStorage.removeItem("home_ai_prompt");
      setFormData((prev) => ({
        ...prev,
        constraints: homePrompt,
        destination: prev.destination || homePrompt.split(/[,.\n]/)[0]?.trim() || "",
      }));
    }

    const saved = localStorage.getItem("travel_request_draft");
    if (saved) {
      try {
        setFormData(JSON.parse(saved));
      } catch (e) {
        console.error("Error loading draft", e);
      }
    }
  }, []);

  useEffect(() => {
    if (session?.user?.role !== "CLIENT" || !session.user.email) return;
    setFormData((prev) => ({
      ...prev,
      clientEmail: session.user.email || prev.clientEmail,
      clientName: session.user.name?.trim() || prev.clientName,
    }));
  }, [session?.user?.role, session?.user?.email, session?.user?.name]);

  useEffect(() => {
    localStorage.setItem("travel_request_draft", JSON.stringify(formData));
  }, [formData]);

  useEffect(() => {
    if (!isAnalyzing) {
      setAnalyzePhase(0);
      return;
    }
    setAnalyzePhase(1);
    const t2 = setTimeout(() => setAnalyzePhase(2), 700);
    const t3 = setTimeout(() => setAnalyzePhase(3), 1400);
    return () => {
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isAnalyzing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const val = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setFormData(f => ({ ...f, [name]: val }));
  };

  const toggleItem = (list: "tripType" | "tripStyle" | "activities", item: string) => {
    setFormData(f => {
      const current = f[list];
      if (current.includes(item)) {
        return { ...f, [list]: current.filter(i => i !== item) };
      }
      return { ...f, [list]: [...current, item] };
    });
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 5));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consentRGPD || !formData.acceptCGU) {
      setMatchError("Veuillez accepter les CGU et le consentement RGPD.");
      return;
    }
    if (!formData.clientEmail?.trim() || !formData.clientName?.trim()) {
      setMatchError("Email et nom sont obligatoires.");
      return;
    }
    setIsAnalyzing(true);
    setMatchError("");
    setStep(6);

    const minAnalyzeMs = 1200;
    const started = Date.now();

    try {
      const response = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        setMatchError(data.error || "Analyse impossible. Réessayez.");
        setResults([]);
        setSummary("");
        setMatchMode(null);
        return;
      }

      setResults(data.results || []);
      setSummary(data.summary || "");
      setTravelRequestId(data.travelRequestId || null);
      setMatchMode(data.matchMode === "fallback" ? "fallback" : "qualified");
      if (data.fallbackSectionTitle) setFallbackTitle(data.fallbackSectionTitle);
      if (data.noExactMatchMessage) setNoExactMsg(data.noExactMatchMessage);
      trackBehaviorEvent("AI_MATCH_SUBMIT", {
        matchMode: data.matchMode,
        resultsCount: (data.results || []).length,
      });
      saveAiMatchResults(data.results, data.summary, {
        matchMode: data.matchMode,
        travelRequestId: data.travelRequestId,
      });
    } catch (err) {
      console.error("Match error", err);
      setMatchError("Erreur réseau. Vérifiez votre connexion.");
    } finally {
      const elapsed = Date.now() - started;
      const wait = Math.max(0, minAnalyzeMs - elapsed);
      setTimeout(() => setIsAnalyzing(false), wait);
    }
  };

  const progress = (step / 5) * 100;

  if (step === 6) {
    return (
      <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 p-12 md:p-20 text-center space-y-12">
        {isAnalyzing ? (
          <div className="space-y-10 animate-in fade-in duration-1000 max-w-3xl mx-auto">
            <div className="text-center space-y-3">
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">
                Chaîne IA → matching
              </h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">
                {analyzePhase === 1 && "Étape 1 — Structuration LLM"}
                {analyzePhase === 2 && "Étape 2 — Score sur le catalogue (/18)"}
                {analyzePhase >= 3 && "Étape 3 — Sélection des correspondances"}
              </p>
            </div>
            <AiMatchPipeline activeStep={analyzePhase} />
          </div>
        ) : matchError ? (
          <div className="space-y-6 py-8">
            <p className="text-red-600 font-bold">{matchError}</p>
            <button
              type="button"
              onClick={() => setStep(5)}
              className="text-orange-600 font-black text-xs uppercase tracking-widest"
            >
              ← Retour au formulaire
            </button>
          </div>
        ) : (
          <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <AiMatchPipeline
              activeStep={4}
              compact
              matchMode={matchMode}
              qualifiedCount={results.filter((r) => !r.isFallback).length}
            />
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-[#0F172A] tracking-tight">
                {matchMode === "fallback"
                  ? fallbackTitle
                  : <>Nous avons trouvé vos <span className="text-orange-500">pépites.</span></>}
              </h2>
              <p className="text-gray-500 font-medium max-w-lg mx-auto">{summary}</p>
              {matchMode === "fallback" && (
                <p className="text-xs text-orange-700 font-bold bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3 max-w-lg mx-auto">
                  {noExactMsg} Voici les prochains départs disponibles — élargissez budget ou dates pour un match plus précis.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {results.length > 0 ? results.map((trip) => (
                 <div key={trip.id} className="bg-[#F8FAFC] rounded-[3rem] overflow-hidden border border-gray-100 group hover:shadow-2xl transition-all duration-500">
                    <div className="h-48 relative">
                       <Image src={trip.coverImage} alt={trip.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                       <div className={`absolute top-6 left-6 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg ${
                         trip.isFallback ? "bg-gray-600" : "bg-orange-600"
                       }`}>
                          {trip.isFallback ? "SUGGESTION" : `${trip.compatibility}% COMPATIBLE`}
                       </div>
                    </div>
                    <div className="p-8 text-left space-y-6">
                       <div>
                          <h4 className="font-black text-[#0F172A] text-lg leading-tight mb-2">{trip.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                             <MapPin size={12} className="text-orange-500" /> {trip.destination}
                          </div>
                          {trip.matchScore != null && (
                            <p className="text-[10px] font-bold text-orange-600 mt-2">
                              Score IA : {trip.matchScore}/18
                            </p>
                          )}
                          {trip.matchReasons && trip.matchReasons.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {trip.matchReasons.slice(0, 3).map((reason) => (
                                <li key={reason} className="text-[10px] text-gray-500 font-medium">
                                  · {reason}
                                </li>
                              ))}
                            </ul>
                          )}
                       </div>
                       <div className="flex justify-between items-center pt-6 border-t border-gray-200/50">
                          <div className="text-2xl font-black text-[#0F172A]">{formatPriceShort(trip.totalPrice)}</div>
                          <Link href={`/trip/${trip.slug}`} className="bg-[#0F172A] text-white text-[10px] font-black px-6 py-3 rounded-full hover:bg-orange-600 transition-all">VOIR L'OFFRE</Link>
                       </div>
                    </div>
                 </div>
               )) : (
                 <div className="col-span-3 py-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
                    Aucun voyage exact trouvé. Voici nos meilleures suggestions...
                 </div>
               )}
            </div>
            
            <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center items-center">
               <Link
                 href={
                   travelRequestId
                     ? `/voyages?matched=true&request=${encodeURIComponent(travelRequestId)}`
                     : "/voyages?matched=true"
                 }
                 className="bg-orange-600 text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-orange-700 transition-all"
               >
                 Voir sur la page Voyages →
               </Link>
               <button type="button" onClick={() => setStep(1)} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors">
                  ← Refaire une recherche
               </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden font-outfit">
      {/* Progress Bar */}
      <div className="h-2 w-full bg-gray-50">
        <div 
          className={`h-full bg-orange-500 transition-all duration-700 ease-out ${
            progress > 90 ? "w-full" : 
            progress > 75 ? "w-3/4" : 
            progress > 50 ? "w-1/2" : 
            progress > 25 ? "w-1/4" : "w-[10%]"
          }`}
        />
      </div>

      <form onSubmit={handleSubmit} className="p-10 md:p-16 space-y-12">
        {step === 1 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
            <div className="space-y-4">
              <span className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em]">Étape 01/05 — Destination</span>
              <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">Où souhaitez-vous <span className="text-orange-500">vous évader ?</span></h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Destination souhaitée</label>
                <div className="relative">
                   <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                   <input 
                     type="text" 
                     name="destination" 
                     title="Destination"
                     value={formData.destination}
                     onChange={handleChange}
                     placeholder="Ex: Libye, Mauritanie, Marrakech, Djerba..." 
                     className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-14 pr-6 py-5 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                     required
                   />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Dates de voyage</label>
                <div className="grid grid-cols-2 gap-4">
                   <div className="relative">
                      <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500" size={18} />
                      <input 
                        type="date" 
                        name="startDate" 
                        title="Date de début"
                        value={formData.startDate}
                        onChange={handleChange}
                        className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-12 pr-4 py-5 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[13px] text-[#0F172A]"
                      />
                   </div>
                   <div className="flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        id="flexible" 
                        name="isDateFlexible" 
                        checked={formData.isDateFlexible}
                        onChange={(e) => setFormData(f => ({ ...f, isDateFlexible: e.target.checked }))}
                        className="w-5 h-5 accent-orange-600 rounded" 
                      />
                      <label htmlFor="flexible" className="text-xs font-bold text-gray-500">Dates flexibles</label>
                   </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
            <div className="space-y-4">
              <span className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em]">Étape 02/05 — Voyageurs & Budget</span>
              <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">Qui sont les <span className="text-orange-500">heureux élus ?</span></h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
               <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between">
                       Nombre de voyageurs <span>{formData.numberOfTravelers}</span>
                    </label>
                    <input 
                      type="range" 
                      name="numberOfTravelers" 
                      min="1" 
                      max="20" 
                      title="Nombre de voyageurs"
                      value={formData.numberOfTravelers}
                      onChange={handleChange}
                      className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-600" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-[#F8FAFC] p-6 rounded-3xl border border-gray-50 text-center">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Adultes</div>
                        <input type="number" name="adults" title="Nombre d'adultes" value={formData.adults} onChange={handleChange} className="bg-transparent text-2xl font-black text-[#0F172A] text-center w-full outline-none" />
                     </div>
                     <div className="bg-[#F8FAFC] p-6 rounded-3xl border border-gray-50 text-center">
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Enfants</div>
                        <input type="number" name="children" title="Nombre d'enfants" value={formData.children} onChange={handleChange} className="bg-transparent text-2xl font-black text-[#0F172A] text-center w-full outline-none" />
                     </div>
                  </div>
               </div>

               <div className="space-y-6 p-8 bg-[#F8FAFC] rounded-[2.5rem] border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">
                     Budget maximum · par personne
                  </p>
                  <div className="text-center">
                     <span className="text-4xl font-black text-[#0F172A] tabular-nums">
                       {formatBudgetMad(formData.budgetMax)}
                     </span>
                     <p className="text-[10px] text-gray-400 font-bold mt-1">(~{formData.budgetMax.toLocaleString("fr-FR")} € / pers.)</p>
                  </div>
                  <input 
                    type="range" 
                    name="budgetMax" 
                    min="200" 
                    max="5000" 
                    step="50"
                    title="Budget maximum par personne"
                    value={formData.budgetMax}
                    onChange={handleChange}
                    className="w-full h-3 rounded-full appearance-none cursor-pointer accent-orange-600"
                    style={{
                      background: `linear-gradient(to right, #ea580c 0%, #ea580c ${((formData.budgetMax - 200) / 4800) * 100}%, #e5e7eb ${((formData.budgetMax - 200) / 4800) * 100}%, #e5e7eb 100%)`,
                    }}
                  />
                  <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                     <span>{formatBudgetMad(200)}</span>
                     <span>{formatBudgetMad(5000)} +</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                     {[500, 1000, 1500, 2000, 3000, 5000].map((preset) => (
                       <button
                         key={preset}
                         type="button"
                         onClick={() =>
                           setFormData((prev) => ({ ...prev, budgetMax: preset }))
                         }
                         className={`px-3 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${
                           formData.budgetMax === preset
                             ? "bg-orange-600 text-white"
                             : "bg-white border border-gray-100 text-gray-500 hover:border-orange-300"
                         }`}
                       >
                         {preset >= 5000 ? "5 000+" : formatBudgetMad(preset)}
                       </button>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
            <div className="space-y-4">
              <span className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em]">Étape 03/05 — Style & Confort</span>
              <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">Quel est votre <span className="text-orange-500">mood ?</span></h3>
            </div>

            <div className="space-y-8">
               <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Type de voyage (plusieurs choix possibles)</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                     {TRIP_TYPES.map(type => (
                       <button 
                         key={type.id}
                         type="button"
                         onClick={() => toggleItem("tripType", type.id)}
                         className={`p-6 rounded-[2rem] border transition-all flex flex-col items-center gap-3 group ${
                           formData.tripType.includes(type.id) 
                             ? "bg-[#0F172A] border-[#0F172A] text-white scale-105 shadow-xl" 
                             : "bg-[#F8FAFC] border-gray-100 text-gray-400 hover:border-orange-500/30"
                         }`}
                       >
                          <span className="text-3xl group-hover:scale-110 transition-transform">{type.icon}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">{type.label}</span>
                       </button>
                     ))}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Hébergement souhaité</label>
                    <select 
                      name="accommodation" 
                      value={formData.accommodation}
                      onChange={handleChange}
                      title="Type d'hébergement"
                      className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-5 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] appearance-none"
                    >
                       <option>Hôtel</option>
                       <option>Riad / Maison d'hôtes</option>
                       <option>Bivouac / Camping</option>
                       <option>Appartement</option>
                    </select>
                  </div>
                  <div className="space-y-3">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Transport local inclus ?</label>
                    <div className="flex gap-4">
                       <button 
                         type="button"
                         onClick={() => setFormData(f => ({ ...f, transportIncluded: true }))}
                         className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                           formData.transportIncluded ? "bg-orange-600 text-white shadow-lg" : "bg-[#F8FAFC] text-gray-400 border border-gray-100"
                         }`}
                       >Oui</button>
                       <button 
                         type="button"
                         onClick={() => setFormData(f => ({ ...f, transportIncluded: false }))}
                         className={`flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                           !formData.transportIncluded ? "bg-orange-600 text-white shadow-lg" : "bg-[#F8FAFC] text-gray-400 border border-gray-100"
                         }`}
                       >Non</button>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
            <div className="space-y-4">
              <span className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em]">Étape 04/05 — Activités & Spécificités</span>
              <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">Que voulez-vous <span className="text-orange-500">vivre ?</span></h3>
            </div>

            <div className="space-y-10">
               <div className="space-y-4">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Activités favorites</label>
                  <div className="flex flex-wrap gap-3">
                     {ACTIVITIES.map(act => (
                        <button 
                          key={act}
                          type="button"
                          onClick={() => toggleItem("activities", act)}
                          className={`px-6 py-3 rounded-full text-xs font-bold transition-all border ${
                            formData.activities.includes(act) 
                              ? "bg-orange-500 border-orange-500 text-white shadow-md" 
                              : "bg-white border-gray-100 text-gray-500 hover:border-orange-500/20"
                          }`}
                        >
                           {act}
                        </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Contraintes ou besoins spécifiques</label>
                  <textarea 
                    name="constraints" 
                    value={formData.constraints}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Allergies, régime alimentaire, besoin d'un guide parlant une langue spécifique, PMR..." 
                    className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-8 py-6 focus:ring-4 focus:ring-orange-500/10 outline-none font-medium text-[#0F172A] resize-none transition-all"
                  />
               </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-10 animate-in fade-in slide-in-from-right-8">
            <div className="space-y-4">
              <span className="text-orange-600 font-black text-[10px] uppercase tracking-[0.2em]">Étape 05/05 — Vos coordonnées</span>
              <h3 className="text-3xl font-black text-[#0F172A] tracking-tight">Prêt pour <span className="text-orange-500">l'aventure ?</span></h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Prénom & Nom</label>
                  <input type="text" name="clientName" title="Prénom et Nom" value={formData.clientName} onChange={handleChange} required className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-5 font-bold text-[#0F172A]" placeholder="Ex: Jean Dupont" />
               </div>
               <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                  <input type="email" name="clientEmail" title="Adresse email" value={formData.clientEmail} onChange={handleChange} required className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-5 font-bold text-[#0F172A]" placeholder="jean.dupont@email.com" />
               </div>
               <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Téléphone</label>
                  <input type="tel" name="clientPhone" title="Numéro de téléphone" value={formData.clientPhone} onChange={handleChange} className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-5 font-bold text-[#0F172A]" placeholder="+33 6 12 34 56 78" />
               </div>
               <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Pays de résidence</label>
                  <select name="clientCountry" value={formData.clientCountry} onChange={handleChange} title="Pays de résidence" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-5 font-bold text-[#0F172A]">
                     <option>France</option>
                     <option>Canada</option>
                     <option>Belgique</option>
                     <option>Suisse</option>
                     <option>Algérie</option>
                     <option>Maroc</option>
                  </select>
               </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-50">
               <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" name="consentRGPD" checked={formData.consentRGPD} onChange={handleChange} className="mt-1 w-5 h-5 accent-orange-600 rounded" required />
                  <span className="text-xs text-gray-500 leading-relaxed font-medium group-hover:text-[#0F172A] transition-colors">J'accepte que mes données soient transmises aux agences partenaires pour traiter ma demande.</span>
               </label>
               <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" name="acceptCGU" checked={formData.acceptCGU} onChange={handleChange} className="mt-1 w-5 h-5 accent-orange-600 rounded" required />
                  <span className="text-xs text-gray-500 leading-relaxed font-medium group-hover:text-[#0F172A] transition-colors">J'ai lu et j'accepte les <Link href="/legal/cgu" className="text-orange-600 underline">CGU</Link> et la <Link href="/legal/confidentialite" className="text-orange-600 underline">Politique de confidentialité</Link>.</span>
               </label>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-8 border-t border-gray-100">
          {step > 1 ? (
            <button 
              type="button" 
              onClick={prevStep}
              className="flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-[#0F172A] transition-all"
            >
              <ChevronLeft size={16} /> Précédent
            </button>
          ) : <div />}

          {step < 5 ? (
            <button 
              type="button" 
              onClick={nextStep}
              className="bg-[#0F172A] text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:bg-orange-600 transition-all shadow-xl shadow-black/10"
            >
              Suivant <ChevronRight size={16} />
            </button>
          ) : (
            <button 
              type="submit"
              className="bg-orange-600 text-white px-12 py-5 rounded-full font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-[#0F172A] transition-all shadow-xl shadow-orange-600/30 active:scale-95"
            >
              Trouver mon voyage <Sparkles size={18} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
