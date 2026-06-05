"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  XCircle,
  Share2,
  Navigation,
  Check,
  Users,
  Star,
  Lightbulb,
  Sparkles,
  CloudSun,
} from "lucide-react";
import TripGallery from "@/components/trips/TripGallery";
import BookingForm from "@/components/booking/BookingForm";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import SafeImage from "@/components/ui/SafeImage";
import { formatPriceShort } from "@/lib/currency";

type AgencyInfo = {
  id?: string;
  slug?: string;
  name: string;
  rating?: number;
  reviews?: number;
};

type TripDetail = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  startDate: string;
  description: string;
  meetingPoint: string;
  tripType: string;
  duration?: string;
  durationDays?: number;
  agency: AgencyInfo;
  images: string[];
  coverImage?: string | null;
  inclusions: string[];
  exclusions: string[];
  totalSpots: number;
  bookedSpots: number;
  status?: string;
  totalPrice: number;
  depositAmount: number;
};

type RelatedTrip = {
  id: string;
  slug: string;
  title: string;
  destination: string;
  coverImage: string;
  totalPrice: number;
};

export default function TripDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [relatedTrips, setRelatedTrips] = useState<RelatedTrip[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const enrich = (found: TripDetail): TripDetail => ({
      ...found,
      duration: found.durationDays
        ? `${found.durationDays} Jours`
        : found.duration || "7 Jours",
      agency: found.agency
        ? {
            id: found.agency.id,
            slug: found.agency.slug,
            name: found.agency.name,
            rating: 4.9,
            reviews: 120,
          }
        : { name: "MaghrebVoyage Partner", rating: 5.0, reviews: 1 },
      images:
        Array.isArray(found.images) && found.images.length > 0
          ? found.images
          : [
              found.coverImage ||
                "https://images.unsplash.com/photo-1505051508008-923feaf90180?q=80&w=2070&auto=format&fit=crop",
            ],
      inclusions: found.inclusions || [],
      exclusions: found.exclusions || [],
    });

    async function load() {
      try {
        const res = await fetch(`/api/trips/${slug}`);
        if (res.ok) {
          const data = await res.json();
          if (data.trip) {
            setTrip(enrich(data.trip as TripDetail));
            setRelatedTrips((data.relatedTrips || []) as RelatedTrip[]);
            return;
          }
        }
      } catch {
        /* ignore */
      }

      setNotFound(true);
    }

    load();
  }, [slug]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-6 px-6">
        <p className="text-2xl font-black text-[#0F172A]">Voyage introuvable</p>
        <p className="text-gray-500 text-center max-w-md">
          Ce voyage n&apos;existe plus ou n&apos;est pas encore publié.
        </p>
        <Link
          href="/voyages"
          className="bg-[#2563EB] text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest"
        >
          Voir tous les voyages
        </Link>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4 px-6">
        <p className="text-2xl font-black text-[#0F172A]">Chargement du voyage...</p>
        <p className="text-gray-500 text-center max-w-md">
          Nous préparons les détails de votre aventure.
        </p>
      </div>
    );
  }

  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Découvre ce voyage sur MaghrebVoyage : ${trip.title}`;
    const encodedUrl = encodeURIComponent(url);
    const encodedText = encodeURIComponent(text);

    const shareUrls: Record<string, string> = {
      whatsapp: `https://wa.me/?text=${encodedText}%0A${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      instagram: `https://www.instagram.com/`,
      tiktok: `https://www.tiktok.com/`,
    };

    if (platform === 'instagram' || platform === 'tiktok') {
      navigator.clipboard.writeText(`${text}\n${url}`);
      alert(`Lien copié ! Partagez-le sur ${platform === 'instagram' ? 'Instagram' : 'TikTok'} 📱`);
      window.open(shareUrls[platform], '_blank');
    } else {
      window.open(shareUrls[platform], '_blank');
    }
  };


  return (
    <div>
      <main className="max-w-7xl mx-auto px-6 py-10">
        <Breadcrumbs />
        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Main Content (Left) */}
          <div className="lg:col-span-2 space-y-12">
            <TripGallery images={trip?.images || []} title={trip?.title || ""} />

            {/* Title & Info */}
            <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 flex flex-col gap-4">
                  <div className="flex gap-3 bg-white/80 backdrop-blur-md rounded-full p-2 shadow-lg border border-gray-100">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(window.location.href);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2500);
                      }}
                      className="text-gray-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all relative"
                      title="Copier le lien"
                    >
                      <Share2 size={18} />
                      {linkCopied && (
                        <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0F172A] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                          Lien copié !
                        </span>
                      )}
                    </button>

                    <button 
                      onClick={() => handleShare('whatsapp')}
                      className="text-green-500 w-10 h-10 rounded-full flex items-center justify-center hover:bg-green-500 hover:text-white transition-all font-black text-lg"
                      title="Partager sur WhatsApp"
                    >
                      W
                    </button>

                    <button 
                      onClick={() => handleShare('facebook')}
                      className="text-blue-600 w-10 h-10 rounded-full flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all font-black text-lg"
                      title="Partager sur Facebook"
                    >
                      f
                    </button>

                    <button 
                      onClick={() => handleShare('instagram')}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 text-white w-10 h-10 rounded-full flex items-center justify-center hover:shadow-lg transition-all font-black text-lg"
                      title="Partager sur Instagram"
                    >
                      📷
                    </button>

                    <button 
                      onClick={() => handleShare('tiktok')}
                      className="bg-black text-white w-10 h-10 rounded-full flex items-center justify-center hover:shadow-lg transition-all font-black text-lg"
                      title="Partager sur TikTok"
                    >
                      🎵
                    </button>
                  </div>

                  <div className="bg-orange-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2 w-fit">
                    <CheckCircle2 size={12} /> Départ Garanti
                  </div>
               </div>
               
               <div className="flex items-center gap-2 text-orange-600 text-[10px] font-black uppercase tracking-widest mb-6">
                  ✨ {trip.tripType} • {trip.duration}
               </div>
               <h1 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-8 leading-tight tracking-tight">{trip.title}</h1>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  <div className="space-y-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Destination</span>
                     <div className="flex items-center gap-2 text-[#0F172A] font-black">
                        <MapPin size={18} className="text-orange-500" /> {trip.destination}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Départ</span>
                     <div className="flex items-center gap-2 text-[#0F172A] font-black">
                        <Calendar size={18} className="text-orange-500" /> {trip.startDate}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Note Agence</span>
                     <div className="flex items-center gap-2 text-[#0F172A] font-black">
                        <Star size={18} className="text-orange-400 fill-orange-400" /> {trip.agency.rating}
                     </div>
                  </div>
                  <div className="space-y-2">
                     <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Disponibilité</span>
                     <div className="flex items-center gap-2 text-[#0F172A] font-black">
                        <Users size={18} className="text-orange-500" /> {trip.totalSpots - trip.bookedSpots} places
                     </div>
                  </div>
               </div>
            </div>

            {/* Description */}
            <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm">
               <h2 className="text-2xl font-black text-[#0F172A] mb-8">Description</h2>
               <p className="text-gray-500 leading-relaxed font-medium mb-10 text-lg">
                  {trip.description}
               </p>
               
               <div className="flex items-center gap-6 p-8 bg-[#F8FAFC] rounded-[2.5rem] border border-gray-100">
                  <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-orange-600 shadow-sm">
                    <Navigation size={32} />
                  </div>
                  <div>
                     <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Point de rendez-vous</div>
                     <div className="text-lg font-black text-[#0F172A]">{trip.meetingPoint}</div>
                  </div>
               </div>
            </div>

            {/* Inclusions & Exclusions (Module C.4) */}
            <div className="grid md:grid-cols-2 gap-8">
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black text-[#0F172A] mb-6 flex items-center gap-3">
                     <CheckCircle2 size={20} className="text-[#10B981]" /> Inclus
                  </h3>
                  <ul className="space-y-4">
                     {trip.inclusions.map((item: string, i: number) => (
                       <li key={i} className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                          <div className="w-5 h-5 bg-[#10B981]/10 rounded-full flex items-center justify-center text-[#10B981] shrink-0">
                             <Check size={12} strokeWidth={4} />
                          </div>
                          {item}
                       </li>
                     ))}
                  </ul>
               </div>
               <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
                  <h3 className="text-lg font-black text-[#0F172A] mb-6 flex items-center gap-3">
                     <XCircle size={20} className="text-red-500" /> Non Inclus
                  </h3>
                  <ul className="space-y-4">
                     {trip.exclusions.map((item: string, i: number) => (
                       <li key={i} className="flex items-center gap-3 text-sm text-gray-400 font-medium opacity-60">
                          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-500 shrink-0">
                             <XCircle size={12} />
                          </div>
                          {item}
                       </li>
                     ))}
                  </ul>
               </div>
            </div>

            {/* Programme Détaillé (Module C.4) */}
            <div className="bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm">
               <h2 className="text-3xl font-black text-[#0F172A] mb-12 tracking-tight">Programme du voyage</h2>
               <div className="space-y-12 relative before:absolute before:left-6 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-50">
                  {[
                    { day: "Jour 1", title: "Arrivée et accueil", desc: "Accueil à l'aéroport et transfert vers votre hébergement. Premier dîner traditionnel pour s'immerger dans l'ambiance locale." },
                    { day: "Jour 2", title: "Exploration et immersion", desc: "Départ pour les premières étapes du circuit. Découverte des paysages et rencontre avec les guides locaux." },
                    { day: "Jour 3-5", title: "Le cœur de l'aventure", desc: "Immersion totale. Bivouac sous les étoiles, randonnées ou visites de sites historiques majeurs." },
                    { day: "Dernier Jour", title: "Clôture et départ", desc: "Derniers achats souvenirs et transfert vers l'aéroport. Fin d'une aventure inoubliable." },
                  ].map((item, i) => (
                    <div key={i} className="relative pl-16 group">
                       <div className="absolute left-0 top-0 w-12 h-12 bg-white border-4 border-[#F8FAFC] rounded-2xl shadow-sm flex items-center justify-center text-orange-600 font-black text-xs z-10 group-hover:bg-orange-600 group-hover:text-white transition-all">
                          {i + 1}
                       </div>
                       <h4 className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">{item.day}</h4>
                       <h3 className="text-xl font-black text-[#0F172A] mb-3">{item.title}</h3>
                       <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-xl">{item.desc}</p>
                    </div>
                  ))}
               </div>
            </div>

            {/* Guide Touristique (Module Guide Long Terme) */}
            <div className="mt-12 bg-white rounded-[4rem] p-12 border border-gray-100 shadow-sm relative overflow-hidden group hover:border-orange-500/20 transition-all duration-500">
               <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
               <h3 className="text-3xl font-black text-[#0F172A] mb-10 flex items-center gap-4">
                  <Sparkles size={28} className="text-orange-500 animate-pulse" /> Guide Touristique Maghreb
               </h3>
               <div className="grid md:grid-cols-2 gap-12">
                  <div className="space-y-6">
                     <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                        <Lightbulb size={24} />
                     </div>
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Culture & Hospitalité</h4>
                     <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        Dans cette région, l'hospitalité est une valeur sacrée. Un thé à la menthe ne se refuse jamais ! C'est le moment idéal pour échanger avec les locaux. Prévoyez des vêtements couvrants pour les visites culturelles et les lieux de culte.
                     </p>
                  </div>
                  <div className="space-y-6">
                     <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                        <MapPin size={24} />
                     </div>
                     <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Le Saviez-vous ?</h4>
                     <p className="text-sm text-gray-500 leading-relaxed font-medium">
                        Le climat du désert est surprenant : les journées sont chaudes mais les nuits peuvent être glaciales. Nous vous conseillons d'adopter la technique de l'oignon (plusieurs couches de vêtements) pour rester à l'aise tout au long du voyage.
                     </p>
                  </div>
               </div>
            </div>
          </div>

          {/* Sticky Sidebar (Right) */}
          <div className="relative">
             <div className="sticky top-32 space-y-8">
                {trip.agency?.id && (
                  <Link
                    href={`/agence/${trip.agency.slug || trip.agency.id}`}
                    className="block bg-[#F8FAFC] rounded-[2.5rem] border border-gray-100 p-6 hover:border-orange-500/30 transition-all text-center"
                  >
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                      Organisé par
                    </p>
                    <p className="text-lg font-black text-[#0F172A]">{trip.agency.name}</p>
                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mt-2">
                      Voir tous les voyages de cette agence →
                    </p>
                  </Link>
                )}

                <div id="booking-section" className="bg-white rounded-[4rem] border border-gray-100 shadow-2xl p-4 space-y-8 scroll-mt-32">
                   <BookingForm 
                     tripId={trip.id}
                     destination={trip.destination}
                     startDate={trip.startDate}
                     coverImage={trip.coverImage || ""}
                     tripTitle={trip.title}
                     totalPrice={trip.totalPrice}
                     depositAmount={trip.depositAmount}
                     spotsLeft={trip.totalSpots - trip.bookedSpots}
                     isSoldOut={
                       trip.status === "FULL" ||
                       trip.bookedSpots >= trip.totalSpots
                     }
                   />
                </div>

                {/* Weather Widget */}
                <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm p-8 space-y-6 overflow-hidden relative group transition-all duration-500 hover:shadow-xl hover:border-blue-500/20">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                   <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <CloudSun size={14} className="text-blue-500" /> Prévisions Météo
                   </h4>
                   <div className="flex justify-between items-center">
                      <div>
                         <div className="text-3xl font-black text-[#0F172A] tracking-tighter">
                            {trip.destination.toLowerCase().includes("sahara") || trip.destination.toLowerCase().includes("marrakech") ? "32°C" : "24°C"}
                         </div>
                         <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {trip.destination.toLowerCase().includes("sahara") ? "Chaud & Sec" : "Ensoleillé"}
                         </div>
                      </div>
                      <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
                         <CloudSun size={24} />
                      </div>
                   </div>
                   <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                      {[
                        { d: "Lun", t: trip.destination.toLowerCase().includes("sahara") ? 34 : 22 },
                        { d: "Mar", t: trip.destination.toLowerCase().includes("sahara") ? 35 : 25 },
                        { d: "Mer", t: trip.destination.toLowerCase().includes("sahara") ? 33 : 24 },
                      ].map((day, idx) => (
                        <div key={idx} className="text-center">
                           <div className="text-[8px] font-black text-gray-300 uppercase mb-1">{day.d}</div>
                           <div className="text-xs font-black text-[#0F172A]">{day.t}°</div>
                        </div>
                      ))}
                   </div>
                </div>
             </div>
          </div>

        </div>

        {/* Other trips from same agency (Module E.2) */}
        <div className="mt-32 space-y-12">
           <div className="flex justify-between items-end">
              <div>
                 <h2 className="text-3xl font-black text-[#0F172A] tracking-tight mb-4">Autres aventures de l'agence</h2>
                 <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Partez avec la même expertise</p>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedTrips.length === 0 && (
                <p className="text-gray-400 font-bold text-sm col-span-full">
                  Aucun autre voyage de cette agence pour le moment.
                </p>
              )}
              {relatedTrips.map((otherTrip) => (
                <Link key={otherTrip.id} href={`/trip/${otherTrip.slug}`} className="group bg-white rounded-[3rem] border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500">
                   <div className="h-48 relative">
                      <SafeImage src={otherTrip.coverImage} alt={otherTrip.title} fill destination={otherTrip.destination} className="object-cover transition-transform duration-700 group-hover:scale-110" />
                   </div>
                   <div className="p-8">
                      <h4 className="font-black text-[#0F172A] mb-2 group-hover:text-orange-600 transition-colors">{otherTrip.title}</h4>
                      <div className="flex justify-between items-center mt-4">
                         <div>
                           <span className="text-xl font-black text-[#0F172A]">{formatPriceShort(otherTrip.totalPrice)}</span>
                           <p className="text-[9px] text-gray-400 font-bold">(~{Math.round(otherTrip.totalPrice)} €)</p>
                         </div>
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Voir plus →</span>
                      </div>
                   </div>
                </Link>
              ))}
           </div>
        </div>
      </main>

    </div>
  );
}
