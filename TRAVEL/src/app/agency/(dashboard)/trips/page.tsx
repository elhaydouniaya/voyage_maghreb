"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MapPin, Calendar, Users, Eye, Pencil, Trash2, Copy, Send, Check, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { getFallbackImage } from "@/lib/images";

// Mock data for frontend demonstration
const MOCK_TRIPS = [
  {
    id: "1",
    title: "Réveillon à Taghit 2025",
    slug: "reveillon-taghit-2025",
    destination: "Taghit, Algérie",
    startDate: "2024-12-27",
    endDate: "2025-01-02",
    totalPrice: 1250,
    depositAmount: 300,
    totalSpots: 12,
    bookedSpots: 8,
    status: "PUBLISHED",
    coverImage: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "2",
    title: "Trek dans le Tassili",
    slug: "trek-aventure-tassili",
    destination: "Djanet, Algérie",
    startDate: "2025-03-12",
    endDate: "2025-03-19",
    totalPrice: 1350,
    depositAmount: 350,
    totalSpots: 12,
    bookedSpots: 5,
    status: "FULL",
    coverImage: "https://images.unsplash.com/photo-1504233529578-6d46baba6d34?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "3",
    title: "Découverte de Marrakech",
    slug: "escapade-culturelle-marrakech",
    destination: "Marrakech, Maroc",
    startDate: "2025-04-05",
    endDate: "2025-04-12",
    totalPrice: 890,
    depositAmount: 200,
    totalSpots: 15,
    bookedSpots: 14,
    status: "PUBLISHED",
    coverImage: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "4",
    title: "Circuit des Kasbahs",
    slug: "circuit-kasbahs",
    destination: "Ouarzazate, Maroc",
    startDate: "2025-04-18",
    endDate: "2025-04-25",
    totalPrice: 950,
    depositAmount: 250,
    totalSpots: 14,
    bookedSpots: 0,
    status: "PENDING_REVIEW",
    coverImage: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=1000&auto=format&fit=crop",
  },
  {
    id: "5",
    title: "Dunes et Oasis",
    slug: "dunes-oasis",
    destination: "Timimoun, Algérie",
    startDate: "2025-05-01",
    endDate: "2025-05-08",
    totalPrice: 1100,
    depositAmount: 300,
    totalSpots: 10,
    bookedSpots: 4,
    status: "DRAFT",
    coverImage: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1000&auto=format&fit=crop",
  }
];


export default function AgencyTripsPage() {
  const [trips, setTrips] = useState(MOCK_TRIPS);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Load local trips from storage for the demo
    const localTrips = JSON.parse(localStorage.getItem("agency_trips") || "[]");
    if (localTrips.length > 0) {
      setTrips([...MOCK_TRIPS, ...localTrips]);
    }
  }, []);

  const filteredTrips = trips.filter(trip => 
    trip.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    trip.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopyLink = (slug: string, id: string) => {
    const url = `${window.location.origin}/trip/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWhatsApp = (slug: string, title: string) => {
    const url = `${window.location.origin}/trip/${slug}`;
    const text = `Découvrez notre voyage : ${title}\n\nRéservez ici : ${url}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const toggleStatus = (id: string, currentStatus: string) => {
    const statusOrder = ['DRAFT', 'PUBLISHED', 'FULL'];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
    
    setTrips(prev => prev.map(trip => 
      trip.id === id ? { ...trip, status: nextStatus } : trip
    ));
    
    // In a real app, this would be an API call
    console.log(`Status of trip ${id} changed to ${nextStatus}`);
  };

  return (
    <div className="space-y-12 pb-24">
      {/* Header with Back Button */}
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <Link href="/agency/dashboard" className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all active:scale-95 w-fit">
          <ArrowLeft size={24} className="text-[#0F172A]" />
        </Link>
        <div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">Mes Voyages</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">Gérez vos catalogues et suivez les départs</p>
        </div>
      </div>

      {/* Search & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <input 
              type="text" 
              placeholder="Rechercher un voyage..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-full px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            />
          </div>
          <Link 
            href="/agency/trips/new"
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-full text-xs font-black transition-all hover:shadow-2xl hover:shadow-orange-600/30 flex items-center gap-2 active:scale-95 whitespace-nowrap"
          >
            <Plus size={20} />
            Nouveau Voyage
          </Link>
        </div>
      </div>

      {/* Trips Grid/List */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 p-20 text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
            <MapPin className="text-gray-200" size={48} />
          </div>
          <h3 className="text-2xl font-black text-[#0F172A] mb-4">
            {searchQuery ? "Aucun voyage trouvé" : "Votre catalogue est vide"}
          </h3>
          <p className="text-gray-400 font-medium max-w-md mb-10">
            {searchQuery 
              ? `Aucun résultat pour "${searchQuery}". Essayez un autre mot-clé.`
              : "Commencez par créer votre premier voyage de groupe pour ouvrir les réservations aux voyageurs."}
          </p>
          {!searchQuery && (
            <Link 
              href="/agency/trips/new"
              className="bg-[#2563EB] text-white px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:scale-105 transition-all"
            >
              Créer un voyage
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {filteredTrips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-500 group">
              <div className="flex flex-col lg:flex-row">
                {/* Image Section */}
                <div className="lg:w-72 h-64 lg:h-auto relative overflow-hidden">
                  <img 
                    src={trip.coverImage} 
                    alt={trip.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getFallbackImage(trip.destination);
                    }}
                  />

                  <div className="absolute top-6 left-6 group/status">
                    <button 
                      onClick={() => toggleStatus(trip.id, trip.status)}
                      title="Cliquez pour changer le statut"
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg ${
                        trip.status === 'PUBLISHED' ? 'bg-[#10B981] text-white' :
                        trip.status === 'FULL' ? 'bg-red-500 text-white' :
                        'bg-white text-gray-400 border border-gray-100'
                      }`}
                    >
                      {trip.status === 'PUBLISHED' ? '● Publié' : trip.status === 'FULL' ? '● Complet' : '○ Brouillon'}
                    </button>
                    <div className="absolute top-full left-0 mt-2 bg-black text-white text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover/status:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      Changer le statut
                    </div>
                  </div>
                </div>

                {/* Info Section */}
                <div className="flex-1 p-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-3xl font-black text-[#0F172A] mb-4 tracking-tight">{trip.title}</h3>
                      <div className="flex flex-wrap gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                          <MapPin size={14} className="text-[#2563EB]" /> {trip.destination}
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-[#2563EB]" /> 
                          {(() => {
                            try {
                              return format(new Date(trip.startDate), 'MMM. yyyy', { locale: fr });
                            } catch (e) {
                              return trip.startDate;
                            }
                          })()}
                        </div>

                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-black text-[#2563EB] tracking-tighter">{trip.totalPrice}€</div>
                      <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Prix Total</div>
                    </div>
                  </div>

                  {/* Booking Progress */}
                  <div className="bg-[#F8FAFC] rounded-[2.5rem] p-8 border border-gray-100">
                    <div className="flex justify-between items-center mb-4 text-[10px] font-black uppercase tracking-widest">
                       <span className="text-gray-400">Remplissage</span>
                       <span className="text-[#0F172A]">{trip.bookedSpots} / {trip.totalSpots} Places</span>
                    </div>
                     <div className="w-full h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                        <div 
                          ref={(el) => { if (el) el.style.width = `${(trip.bookedSpots / trip.totalSpots) * 100}%`; }}
                          className="h-full bg-orange-600 transition-all duration-1000" 
                        />
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-6 pt-4 border-t border-gray-50">
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleCopyLink(trip.slug, trip.id)}
                        className={`flex items-center gap-3 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                          copiedId === trip.id ? 'bg-[#10B981] text-white' : 'bg-[#F8FAFC] text-[#0F172A] hover:bg-gray-100'
                        }`}
                      >
                        {copiedId === trip.id ? <Check size={14} /> : <Copy size={14} />}
                        {copiedId === trip.id ? 'Copié !' : 'Copier le lien'}
                      </button>
                      <button 
                        onClick={() => handleWhatsApp(trip.slug, trip.title)}
                        className="flex items-center gap-3 px-6 py-3 bg-[#25D366]/10 text-[#128C7E] rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-[#25D366]/20 transition-all"
                      >
                        <Send size={14} /> WhatsApp
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-4">
                       <Link 
                        href={`/trip/${trip.slug}`} 
                        target="_blank" 
                        className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#2563EB] hover:border-[#2563EB]/20 transition-all shadow-sm group/btn"
                       >
                          <Eye size={18} />
                          <span className="text-[8px] font-black uppercase tracking-widest hidden group-hover/btn:block">Voir</span>
                       </Link>
                       <Link 
                        href={`/agency/trips/${trip.id}/edit`} 
                        className="flex items-center gap-2 p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#2563EB] hover:border-[#2563EB]/20 transition-all shadow-sm group/btn"
                       >
                          <Pencil size={18} />
                          <span className="text-[8px] font-black uppercase tracking-widest hidden group-hover/btn:block">Éditer</span>
                       </Link>
                       <button 
                        onClick={() => {
                          if(confirm("Voulez-vous vraiment supprimer ce voyage ?")) {
                            setTrips(prev => prev.filter(t => t.id !== trip.id));
                          }
                        }}
                        className="flex items-center gap-2 p-3 text-gray-300 hover:text-red-500 transition-all group/btn"
                      >
                          <Trash2 size={18} />
                          <span className="text-[8px] font-black uppercase tracking-widest hidden group-hover/btn:block">Supprimer</span>
                       </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
