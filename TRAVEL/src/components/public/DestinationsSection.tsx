import Link from "next/image";
import LinkNext from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

const destinations = [
  {
    name: "Maroc",
    count: "12 voyages",
    image: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=800&auto=format&fit=crop",
    slug: "maroc"
  },
  {
    name: "Algérie",
    count: "8 voyages",
    image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=800&auto=format&fit=crop",
    slug: "algerie"
  },
  {
    name: "Tunisie",
    count: "6 voyages",
    image: "https://images.unsplash.com/photo-1549877452-9c387954fbc2?q=80&w=800&auto=format&fit=crop",
    slug: "tunisie"
  },
  {
    name: "Sahara",
    count: "15 voyages",
    image: "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=800&auto=format&fit=crop",
    slug: "sahara"
  }
];

export default function DestinationsSection() {
  return (
    <section className="py-32 px-6 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black text-[#0F172A] tracking-tight mb-6 leading-tight">
              Explorez les plus belles <span className="text-orange-500">destinations</span> du Maghreb.
            </h2>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">
              Des cités impériales aux oasis secrètes, découvrez des lieux d'exception sélectionnés par nos experts locaux.
            </p>
          </div>
          <LinkNext href="/destinations" className="group flex items-center gap-3 text-xs font-black uppercase tracking-widest text-[#0F172A] hover:text-orange-600 transition-colors">
            Voir tout <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center group-hover:border-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all"><ArrowRight size={14} /></div>
          </LinkNext>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {destinations.map((dest, i) => (
            <LinkNext key={i} href={`/voyages?destination=${dest.name}`} className="group relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-700">
              <img 
                src={dest.image} 
                alt={dest.name} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-10 left-10 right-10">
                <div className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-2">{dest.count}</div>
                <h3 className="text-3xl font-black text-white tracking-tight">{dest.name}</h3>
              </div>
              <div className="absolute top-10 right-10 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                <MapPin size={20} />
              </div>
            </LinkNext>
          ))}
        </div>
      </div>
    </section>
  );
}
