import Link from "next/link";
import { Globe, ArrowRight, MapPin, Search } from "lucide-react";
import { NavbarAuth } from "@/components/auth/NavbarAuth";
import AIChatWidget from "@/components/ai/AIChatWidget";
import MainNavbar from "@/components/layout/MainNavbar";

const destinations = [
  {
    name: "Maroc",
    description: "Des sommets de l'Atlas aux vagues de l'Atlantique, en passant par les médinas millénaires.",
    image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=1200&auto=format&fit=crop",
    count: "12 voyages disponibles",
    regions: ["Marrakech", "Fès", "Chefchaouen", "Essaouira"]
  },
  {
    name: "Algérie",
    description: "Le plus grand pays d'Afrique vous offre des paysages sahariens époustouflants et une côte méditerranéenne riche d'histoire.",
    image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1200&auto=format&fit=crop",
    count: "8 voyages disponibles",
    regions: ["Taghit", "Alger", "Oran", "Constantine"]
  },
  {
    name: "Tunisie",
    description: "Entre farniente à Djerba, ruines de Carthage et l'hospitalité légendaire du Sud tunisien.",
    image: "https://images.unsplash.com/photo-1549877452-9c387954fbc2?q=80&w=1200&auto=format&fit=crop",
    count: "6 voyages disponibles",
    regions: ["Djerba", "Sidi Bou Saïd", "Tozeur", "Tunis"]
  },
  {
    name: "Sahara",
    description: "Une expérience spirituelle au cœur des dunes les plus hautes du monde. L'immensité à perte de vue.",
    image: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=1200&auto=format&fit=crop",
    count: "15 voyages disponibles",
    regions: ["Grand Erg Occidental", "Tassili n'Ajjer", "Merzouga"]
  }
];

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] font-outfit">
      {/* Navbar */}
      <MainNavbar />

      {/* Hero */}
      <section className="pt-40 pb-20 px-6 bg-white">
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
                <img 
                  src={dest.image} 
                  alt={dest.name} 
                  className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
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

      {/* Footer */}
      <footer className="bg-white py-20 px-6 border-t border-gray-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                <Globe size={24} />
             </div>
             <span className="text-2xl font-black tracking-tight text-[#0F172A]">MaghrebVoyage</span>
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            © 2026 MaghrebVoyage — Fièrement construit pour l'aventure
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
             <Link href="/legal/mentions" className="hover:text-orange-600 transition-colors">Mentions Légales</Link>
             <Link href="/legal/cgu" className="hover:text-orange-600 transition-colors">CGV</Link>
             <Link href="/legal/confidentialite" className="hover:text-orange-600 transition-colors">Confidentialité</Link>
             <Link href="/about" className="hover:text-orange-600 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>
      <AIChatWidget />
    </div>
  );
}
