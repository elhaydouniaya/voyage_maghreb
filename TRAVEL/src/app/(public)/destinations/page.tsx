import Link from "next/link";
import { ArrowRight, MapPin, Search } from "lucide-react";

import DestinationCarousel from "@/components/public/DestinationCarousel";

import { COUNTRY_IMAGES } from "@/lib/images";

const destinations = [
  {
    name: "Maroc",
    description: "Des sommets de l'Atlas aux vagues de l'Atlantique, en passant par les médinas millénaires.",
    images: ["/rabat.jpg", "/tetouan.jpg", "/marrakesh.jpg", "/sahara.jpg", "/casa.jpg"],
    count: "12 voyages disponibles",
    regions: ["Marrakech", "Tétouan", "Casablanca", "Rabat"   , "Sahara"],
  },
  {
    name: "Algérie",
    description: "Le plus grand pays d'Afrique vous offre des paysages sahariens époustouflants et une côte méditerranéenne riche d'histoire.",
    images: ["/martyr.jpg", "/algercap.jpg", "/oran.jpg", "/constantine.jpg", "/bejaia.jpg"],
    count: "8 voyages disponibles",
    regions: ["Constantine", "Alger", "Oran", "Bejaia" , "Mausolée des Martyrs"],
  },
  {
    name: "Tunisie",
    description: "Entre farniente à Djerba, ruines de Carthage et l'hospitalité légendaire du Sud tunisien.",
    images: ["/caption.jpg", "/hammamet.jpg", "/constantine.jpg", "/monastir.jpg", "/sidibousaid.jpg"],
    count: "6 voyages disponibles",
    regions: ["Djerba", "Sidi Bou Saïd", "Constantine", "Tunis", "Hammamet" ],
  },
  {
    name: "Libye",
    description: "Des vestiges romains spectaculaires de Leptis Magna aux oasis ancestrales de Ghadamès.",
    images:["/libye_capi.jpg", "/elkhums.jpg", "/tripoli.jpg", "/plage_libye.jpg", "/photo2jpg.jpg"],
    count: "4 voyages disponibles",
    regions: ["Leptis Magna", "elkhums", "Tripoli", "Ghadamès", "Sabratha"],
  },
  {
    name: "Mauritanie",
    description: "Entre les dunes majestueuses de l'Adrar et le littoral sauvage du Banc d'Arguin.",
    images: ["/port-de-peche.jpg  ", "/chenguitti).jpg", "/aoulata.jpg", "/Chinguetti_libye.jpg", "/mauritanietourne.jpg"],
    count: "5 voyages disponibles",
    regions: ["Chinguetti", "Nouakchott",  "port de pêche", "aoulata", "Atar"],
  },
];

export default function DestinationsPage() {
  return (
    <div className="bg-[#F8FAFC]">
      {/* Hero */}
      <section className="py-16 pb-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-6xl md:text-8xl font-black text-[#0F172A] mb-8 tracking-tight">
            Explorez le <br />
            <span className="text-orange-500">Maghreb.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl font-medium leading-relaxed">
            Chaque destination raconte une histoire unique. Trouvez celle qui résonne avec vos envies d'évasion.
          </p>
        </div>
      </section>

      {/* Destinations List */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          {destinations.map((dest, i) => (
            <div key={i} className={`flex flex-col ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}>
              <div className="w-full lg:w-1/2 aspect-[16/10] rounded-[3rem] overflow-hidden shadow-2xl relative group">
                <DestinationCarousel images={dest.images} alt={dest.name} />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors pointer-events-none" />
              </div>
              
              <div className="w-full lg:w-1/2 space-y-8">
                <div className="inline-flex items-center gap-3 px-6 py-2 bg-white rounded-full border border-gray-100 shadow-sm text-[10px] font-black uppercase tracking-widest text-orange-600">
                  <MapPin size={12} /> {dest.count}
                </div>
                <h2 className="text-5xl font-black text-[#0F172A] tracking-tight">{dest.name}</h2>
                <p className="text-lg text-gray-500 font-medium leading-relaxed italic">
                  "{dest.description}"
                </p>
                
                <div className="flex flex-wrap gap-3">
                  {dest.regions.map((reg, j) => (
                    <span key={j} className="px-5 py-2 bg-[#0F172A]/5 rounded-xl text-[11px] font-bold text-[#0F172A] uppercase tracking-wider">
                      {reg}
                    </span>
                  ))}
                </div>

                <div className="pt-8">
                  <Link 
                    href={`/voyages?destination=${dest.name}`}
                    className="inline-flex items-center gap-4 bg-orange-600 text-white px-10 py-5 rounded-2xl font-black text-sm shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition-all group"
                  >
                    Explorer les voyages <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Search CTA */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto bg-orange-600 rounded-[4rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">Vous ne trouvez pas votre bonheur ?</h2>
              <p className="text-orange-100 text-lg font-medium mb-12 max-w-2xl mx-auto">
                Utilisez notre assistant IA pour créer une demande personnalisée. Nous trouverons l'agence parfaite pour vous.
              </p>
              <Link href="/recherche" className="inline-flex items-center gap-3 bg-[#0F172A] text-white px-12 py-5 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-2xl">
                Démarrer la recherche IA <Search size={18} />
              </Link>
           </div>
        </div>
      </section>

    </div>
  );
}
