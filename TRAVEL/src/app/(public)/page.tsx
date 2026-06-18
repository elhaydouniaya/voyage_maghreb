"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import MaghrebCarousel from "@/components/public/MaghrebCarousel";
import SafeImage from "@/components/ui/SafeImage";
import { formatPriceShort } from "@/lib/currency";
import { sanitizeImageUrl } from "@/lib/images";
import { 
  ArrowRight, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Star, 
  CheckCircle2,
  Globe,
  CalendarDays,
  Lock,
  UserCheck,
  CreditCard,
  MessageCircle,
  ChevronDown,
  Sparkles,
  Bot,
  X,
  Calendar
} from "lucide-react";

import DestinationsSection from "@/components/public/DestinationsSection";
import TripsGroupedBySeason from "@/components/trips/TripsGroupedBySeason";
import { groupTripsBySeason, SEASON_ORDER } from "@/lib/seasons";
import type { Season } from "@/lib/seasons";

const TRIP_TAG_COLORS: Record<string, string> = {
  DESERT: "bg-orange-500",
  CULTURE: "bg-[#0F172A]",
  ADVENTURE: "bg-orange-600",
  RELAXATION: "bg-[#10B981]",
  NATURE: "bg-emerald-600",
};

const TRIP_TYPE_LABELS: Record<string, string> = {
  DESERT: "Désert",
  CULTURE: "Culture",
  ADVENTURE: "Aventure",
  RELAXATION: "Détente",
  NATURE: "Nature",
};

function FeaturedTrips() {
  const [groupedTrips, setGroupedTrips] = useState<{ season: Season; trips: any[] }[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season>("SUMMER");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/trips")
      .then((res) => res.json())
      .then((data) => {
        const published = (data.trips || []).filter((t: any) => t.status === "PUBLISHED");
        const grouped = groupTripsBySeason(published);
        const seasonList = SEASON_ORDER;
        const result = (Object.keys(seasonList) as Season[])
          .sort((a, b) => seasonList[a] - seasonList[b])
          .map((season) => ({
            season,
            trips: grouped[season] || [],
          }))
          .filter((g) => g.trips.length > 0);
        setGroupedTrips(result);
        
        // Get current season
        const today = new Date();
        const month = today.getMonth() + 1;
        if (month >= 3 && month <= 5) setCurrentSeason("SPRING");
        else if (month >= 6 && month <= 8) setCurrentSeason("SUMMER");
        else if (month >= 9 && month <= 11) setCurrentSeason("AUTUMN");
        else setCurrentSeason("WINTER");
        
        // Set initial selected season
        setSelectedSeason(result.length > 0 ? result[0].season : null);
      })
      .catch(() => setGroupedTrips([]))
      .finally(() => setLoading(false));
  }, []);

  const seasonOptionsList = [
    { key: 'SPRING' as Season, emoji: '🌸', name: 'Printemps', dates: 'Mars à Mai' },
    { key: 'SUMMER' as Season, emoji: '☀️', name: 'Été', dates: 'Juin à Août' },
    { key: 'AUTUMN' as Season, emoji: '🍂', name: 'Automne', dates: 'Septembre à Novembre' },
    { key: 'WINTER' as Season, emoji: '❄️', name: 'Hiver', dates: 'Décembre à Février' },
  ];

  const filteredTrips = groupedTrips.filter((g) => {
    if (selectedSeason) return g.season === selectedSeason;
    return true;
  });

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-[3rem] overflow-hidden border border-gray-100 animate-pulse">
            <div className="aspect-[4/5] bg-gray-100" />
            <div className="p-8 space-y-4">
              <div className="h-6 bg-gray-100 rounded-lg w-3/4" />
              <div className="h-4 bg-gray-50 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (groupedTrips.length === 0) {
    return (
      <p className="text-center text-gray-400 font-bold uppercase tracking-widest text-xs py-12">
        Aucun voyage publié pour le moment — revenez bientôt.
      </p>
    );
  }

  return (
    <div className="space-y-10">

      {/* ── Creative expanding season selector ──────────────────────────── */}
      <div
        className="flex rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm"
        style={{ height: "128px" }}
      >
        {seasonOptionsList.map((option) => {
          const seasonTrips = groupedTrips.find((g) => g.season === option.key);
          const tripCount   = seasonTrips?.trips.length ?? 0;
          const isSelected  = selectedSeason === option.key;
          const isCurrent   = option.key === currentSeason;
          const isDisabled  = tripCount === 0;

          return (
            <button
              key={option.key}
              onClick={() => !isDisabled && setSelectedSeason(option.key)}
              disabled={isDisabled}
              aria-pressed={isSelected}
              style={{
                flex: isSelected ? "5 1 0%" : "1 1 0%",
                transition: "flex 0.55s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
              className={[
                "relative flex items-center overflow-hidden outline-none",
                "border-r border-gray-100 last:border-r-0",
                isSelected
                  ? "bg-orange-600 px-8 gap-6 cursor-default"
                  : isDisabled
                    ? "bg-gray-50 justify-center opacity-25 cursor-not-allowed"
                    : "bg-white justify-center cursor-pointer group hover:bg-orange-50/60",
              ].join(" ")}
            >
              {/* ── Collapsed state ── */}
              {!isSelected && (
                <div className="flex flex-col items-center gap-2">
                  <span className="text-2xl leading-none">{option.emoji}</span>
                  <span
                    className={[
                      "text-[8px] font-black uppercase tracking-[0.18em] whitespace-nowrap",
                      isDisabled
                        ? "text-gray-300"
                        : "text-gray-400 group-hover:text-orange-500 transition-colors duration-200",
                    ].join(" ")}
                  >
                    {option.name}
                  </span>

                  {/* Trip count badge (top-right) */}
                  {tripCount > 0 && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-orange-50 border border-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-[8px] font-black text-orange-500 leading-none">
                        {tripCount}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Expanded state ── */}
              {isSelected && (
                <div className="flex items-center gap-6 w-full animate-in fade-in duration-300">
                  {/* Emoji box */}
                  <div className="w-14 h-14 bg-white/15 border border-white/20 rounded-2xl flex items-center justify-center text-3xl shrink-0">
                    {option.emoji}
                  </div>

                  {/* Season info */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-white font-black text-xl uppercase tracking-tight leading-tight whitespace-nowrap">
                        {option.name}
                      </span>
                      {isCurrent && (
                        <div className="flex items-center gap-1.5 bg-white/15 border border-white/20 px-3 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-white/80 animate-pulse" />
                          <span className="text-[9px] font-black text-white/90 uppercase tracking-widest whitespace-nowrap">
                            En cours
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-orange-100/80 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                      {option.dates}
                    </span>
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap">
                      {tripCount} voyage{tripCount > 1 ? "s" : ""} disponible{tripCount > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="ml-auto shrink-0 w-12 h-12 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center">
                    <ArrowRight size={20} className="text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Trips grid ──────────────────────────────────────────────────── */}
      {filteredTrips.length > 0 ? (
        <TripsGroupedBySeason groupedTrips={filteredTrips} />
      ) : (
        <p className="text-center text-gray-400 font-bold uppercase tracking-widest text-xs py-12">
          Aucun voyage pour cette saison.
        </p>
      )}
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-outfit">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-40 px-6 min-h-[800px] flex items-center">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-12 items-center w-full">
          <div className="lg:col-span-3 text-center lg:text-left z-10">
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-[#0F172A] mb-8 leading-[1.1]">
              Votre prochain <br />
              voyage au Maghreb, <br />
              <span className="text-orange-500 underline decoration-4 underline-offset-8">commence ici.</span>
            </h1>
            <p className="text-lg text-gray-500 mb-12 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Des agences locales vérifiées, des expériences uniques, et un paiement 100% sécurisé.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center mt-12">
               <Link 
                 href="/recherche"
                 className="w-full sm:w-auto bg-orange-600 text-white font-black px-12 py-6 rounded-[2rem] text-sm uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-orange-600/30 active:scale-95 group"
               >
                 Trouver mon voyage <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
               </Link>
               <Link 
                 href="/voyages"
                 className="w-full sm:w-auto bg-[#0F172A] text-white font-black px-12 py-6 rounded-[2rem] text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-4 shadow-2xl shadow-black/20"
               >
                 Voir les voyages <ArrowRight size={18} />
               </Link>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 mt-12 justify-center lg:justify-start">
               <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <span>Explorez :</span>
                  <Link href="/voyages?destination=Maroc" className="hover:text-orange-500 transition-colors">Maroc</Link>
                  <Link href="/voyages?destination=Algérie" className="hover:text-orange-500 transition-colors">Algérie</Link>
                  <Link href="/voyages?destination=Tunisie" className="hover:text-orange-500 transition-colors">Tunisie</Link>
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 relative h-[500px] md:h-[600px]">
            <MaghrebCarousel autoPlay={true} interval={5000} />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 px-6 bg-white border-y border-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-4 tracking-tight">Comment ça marche</h2>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Votre voyage commence en 3 étapes simples</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-gray-100 relative group hover:border-orange-500/20 transition-all duration-500">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm mb-8 font-black text-2xl group-hover:bg-orange-600 group-hover:text-white transition-all">1</div>
               <h3 className="text-2xl font-black text-[#0F172A] mb-4">Décrivez votre projet</h3>
               <p className="text-gray-500 font-medium leading-relaxed">Indiquez vos préférences, votre budget et vos dates via notre formulaire guidé intelligent.</p>
            </div>
            {/* Step 2 */}
            <div className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-gray-100 relative group hover:border-orange-500/20 transition-all duration-500">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm mb-8 font-black text-2xl group-hover:bg-orange-600 group-hover:text-white transition-all">2</div>
               <h3 className="text-2xl font-black text-[#0F172A] mb-4">L’IA trouve les pépites</h3>
               <p className="text-gray-500 font-medium leading-relaxed">Notre moteur IA croise votre demande avec les voyages réels postés par nos agences partenaires.</p>
            </div>
            {/* Step 3 */}
            <div className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-gray-100 relative group hover:border-orange-500/20 transition-all duration-500">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm mb-8 font-black text-2xl group-hover:bg-orange-600 group-hover:text-white transition-all">3</div>
               <h3 className="text-2xl font-black text-[#0F172A] mb-4">Réservez en ligne</h3>
               <p className="text-gray-500 font-medium leading-relaxed">Payez votre acompte via Stripe et recevez instantanément votre confirmation par email.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trips */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-20">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight mb-4">Voyages à la une ✨</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Sélectionnés pour leur authenticité</p>
            </div>
            <Link href="/voyages" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors flex items-center gap-3 bg-white px-8 py-4 rounded-full border border-gray-100 shadow-sm">
               Explorer tout <ArrowRight size={14} />
            </Link>
          </div>

          <FeaturedTrips />
        </div>
      </section>

      {/* Destinations Section */}
      <DestinationsSection />

      {/* Trust Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0F172A] rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
             <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-8 text-center lg:text-left">
                   <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">Réservez en toute <span className="text-orange-500">confiance</span>.</h2>
                   <p className="text-gray-400 text-lg font-medium max-w-lg mx-auto lg:mx-0">Nous collaborons uniquement avec des agences locales vérifiées et expertes du terrain.</p>
                   
                   <div className="grid grid-cols-2 gap-8 pt-8">
                      <div className="space-y-4">
                         <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mx-auto lg:mx-0">
                            <ShieldCheck size={24} />
                         </div>
                         <h4 className="text-white font-black uppercase tracking-widest text-[10px]">Paiement Sécurisé</h4>
                         <p className="text-gray-500 text-xs">Vos transactions sont protégées par Stripe.</p>
                      </div>
                      <div className="space-y-4">
                         <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mx-auto lg:mx-0">
                            <CheckCircle2 size={24} />
                         </div>
                         <h4 className="text-white font-black uppercase tracking-widest text-[10px]">Agences Vérifiées</h4>
                         <p className="text-gray-500 text-xs">Chaque itinéraire est validé par nos experts.</p>
                      </div>
                   </div>
                </div>

                <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 text-center space-y-8">
                   <div className="text-5xl font-black text-white tracking-tighter">4.9/5</div>
                   <div className="flex justify-center gap-1">
                      {[1,2,3,4,5].map(i => <Star key={i} size={20} className="fill-orange-500 text-orange-500" />)}
                   </div>
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Note moyenne de nos voyageurs</p>
                   <div className="pt-8 border-t border-white/5 flex justify-center gap-6 opacity-30 grayscale brightness-200">
                      <Image src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" width={80} height={24} className="h-6 w-auto" alt="Stripe" unoptimized />
                      <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" width={40} height={24} className="h-6 w-auto" alt="Mastercard" unoptimized />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-4 tracking-tight">Questions fréquentes</h2>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Tout ce que vous devez savoir avant de partir</p>
          </div>

          <div className="space-y-6">
            {[
              { q: "Comment le chatbot collecte vos données ?", a: "Le chatbot recueille vos informations uniquement pour mieux personnaliser vos recommandations. Il vous pose quelques questions (préférences de destination, budget, dates, nombre de voyageurs, intérêts, style de voyage) et vous permet de sélectionner vos choix. Ces réponses servent à générer un guide de voyages adapté et à préparer votre réservation. Vous pouvez aussi modifier vos préférences à tout moment." },
              { q: "Les agences sont-elles vérifiées ?", a: "Oui, chaque agence sur MaghrebVoyage passe par un processus de vérification rigoureux (SIRET, licences, avis clients) avant de pouvoir publier." },
              { q: "Le paiement est-il sécurisé ?", a: "Absolument. Nous utilisons Stripe, le leader mondial du paiement, pour sécuriser vos transactions. Nous ne stockons jamais vos coordonnées bancaires." },
              { q: "Puis-je annuler ma réservation ?", a: "Chaque voyage a ses propres conditions d'annulation définies par l'agence. Vous pouvez les consulter sur la page détaillée du voyage." },
            ].map((faq, i) => (
              <div key={i} className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 hover:border-orange-500/20 transition-all duration-500 shadow-sm hover:shadow-xl">
                 <h4 className="text-lg font-black text-[#0F172A] mb-4 flex justify-between items-center group-hover:text-orange-600 transition-colors">
                    {faq.q}
                    <ChevronDown size={18} className="text-gray-300 group-hover:rotate-180 transition-transform" />
                 </h4>
                 <p className="text-gray-500 font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Newsletter Section */}
      <section className="py-32 px-6 bg-[#0F172A] relative overflow-hidden">
         <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
         <div className="max-w-4xl mx-auto relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Rejoignez l'aventure. 📬</h2>
            <p className="text-gray-400 text-lg font-medium mb-12 max-w-2xl mx-auto">
               Inscrivez-vous pour recevoir nos meilleurs itinéraires et des offres exclusives directement dans votre boîte mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
               <input 
                  type="email" 
                  placeholder="Votre email" 
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 transition-all font-medium"
               />
               <button className="bg-orange-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 whitespace-nowrap">
                  S'inscrire
               </button>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-8">Pas de spam, c'est promis. Désinscrivez-vous quand vous voulez.</p>
         </div>
      </section>

    </div>
  );
}
