"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Sparkles, Map, CreditCard, Settings } from "lucide-react";

export default function EditTripPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    tripType: "AVENTURE",
    startDate: "",
    endDate: "",
    totalSpots: 10,
    totalPrice: 1000,
    depositAmount: 300,
    description: "",
    coverImage: "",
    inclusionsText: "",
    exclusionsText: "",
    meetingPoint: "",
  });

  useEffect(() => {
    async function load() {
      const tripId = params.id as string;
      try {
        const res = await fetch(`/api/agency/trips/${tripId}`);
        const data = await res.json();
        if (!res.ok || !data.trip) {
          setError(data.error || "Voyage non trouvé.");
          return;
        }
        const trip = data.trip;
        setFormData({
          title: trip.title,
          destination: trip.destination,
          tripType: trip.tripType,
          startDate: trip.startDate,
          endDate: trip.endDate,
          totalSpots: trip.totalSpots,
          totalPrice: trip.totalPrice,
          depositAmount: trip.depositAmount,
          description: trip.description,
          coverImage: trip.coverImage,
          inclusionsText: (trip.inclusions || []).join(", "),
          exclusionsText: (trip.exclusions || []).join(", "),
          meetingPoint: trip.meetingPoint || "",
        });
      } catch {
        setError("Impossible de charger le voyage.");
      }
    }
    load();
  }, [params.id]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === "totalSpots" || name === "totalPrice" || name === "depositAmount")
        ? (value === "" ? "" : Number(value))
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const tripId = params.id as string;
      const res = await fetch(`/api/agency/trips/${tripId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de la modification.");
        return;
      }

      router.push("/agency/trips");
    } catch {
      setError("Une erreur est survenue lors de la modification.");
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !formData.title) {
    return (
        <div className="max-w-4xl mx-auto py-20 text-center">
            <h2 className="text-2xl font-black text-[#0F172A] mb-4">{error}</h2>
            <Link href="/agency/trips" className="text-primary font-bold hover:underline">Retour à la liste</Link>
        </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24">
      <div className="flex items-center gap-6">
        <Link href="/agency/trips" className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all active:scale-95">
          <ArrowLeft size={24} className="text-[#0F172A]" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Modifier le Voyage</h1>
          <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Mettez à jour les détails de votre aventure</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1 */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
             <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <Map size={20} />
             </div>
             <h2 className="text-xl font-black text-[#0F172A]">Informations Générales</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label htmlFor="title" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Titre du voyage *</label>
              <input id="title" type="text" name="title" value={formData.title} onChange={handleChange} required placeholder="Ex: Réveillon à Taghit" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all" />
            </div>
            <div className="space-y-3">
              <label htmlFor="destination" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Destination *</label>
              <input id="destination" type="text" name="destination" value={formData.destination} onChange={handleChange} required placeholder="Ex: Marrakech, Maroc" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label htmlFor="tripType" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Type *</label>
              <select id="tripType" name="tripType" value={formData.tripType} onChange={handleChange} className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all">
                <option value="AVENTURE">AVENTURE</option>
                <option value="CULTURE">CULTURE</option>
                <option value="DETENTE">DETENTE</option>
                <option value="LUXE">LUXE</option>
                <option value="SPORT">SPORT</option>
              </select>
            </div>
            <div className="space-y-3">
              <label htmlFor="startDate" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Départ *</label>
              <input id="startDate" type="date" name="startDate" value={formData.startDate} onChange={handleChange} required placeholder="Date de départ" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all" />
            </div>
            <div className="space-y-3">
              <label htmlFor="endDate" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Retour *</label>
              <input id="endDate" type="date" name="endDate" value={formData.endDate} onChange={handleChange} required placeholder="Date de retour" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all" />
            </div>
          </div>
        </div>

        {/* Section 2 */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
          <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
             <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <CreditCard size={20} />
             </div>
             <h2 className="text-xl font-black text-[#0F172A]">Prix et Places</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <label htmlFor="totalPrice" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Prix Total (€) *</label>
              <input id="totalPrice" type="number" name="totalPrice" value={formData.totalPrice} onChange={handleChange} required min="1" placeholder="950" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all" />
            </div>
            <div className="space-y-3">
              <label htmlFor="depositAmount" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Acompte Stripe (€) *</label>
              <input id="depositAmount" type="number" name="depositAmount" value={formData.depositAmount} onChange={handleChange} required min="1" max={formData.totalPrice} placeholder="300" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-orange-600 transition-all" />
            </div>
            <div className="space-y-3">
              <label htmlFor="totalSpots" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de places *</label>
              <input id="totalSpots" type="number" name="totalSpots" value={formData.totalSpots} onChange={handleChange} required min="1" placeholder="12" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all" />
            </div>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-8">
          <div className="flex justify-between items-center border-b border-gray-50 pb-6">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                   <Settings size={20} />
                </div>
                <h2 className="text-xl font-black text-[#0F172A]">Détails du Voyage</h2>
             </div>
             <button type="button" className="text-[10px] font-black text-[#F59E0B] flex items-center gap-2 bg-[#F59E0B]/10 px-4 py-2 rounded-full hover:bg-[#F59E0B]/20 transition-all">
                <Sparkles size={14} /> GÉNÉRER AVEC L'IA
             </button>
          </div>
          
          <div className="space-y-3">
            <label htmlFor="description" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description détaillée *</label>
            <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={6} placeholder="Décrivez votre aventure en quelques paragraphes..." className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 focus:ring-4 focus:ring-primary/10 outline-none font-medium text-[#0F172A] placeholder:text-gray-300 transition-all resize-none"></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Inclus (virgules)</label>
              <textarea name="inclusionsText" value={formData.inclusionsText} onChange={handleChange} rows={3} placeholder="Hébergement, Guide local, Repas..." className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 focus:ring-4 focus:ring-primary/10 outline-none font-medium text-[#0F172A] placeholder:text-gray-300 transition-all resize-none"></textarea>
            </div>
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Non inclus (virgules)</label>
              <textarea name="exclusionsText" value={formData.exclusionsText} onChange={handleChange} rows={3} placeholder="Vols, Assurance, Dépenses..." className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 focus:ring-4 focus:ring-primary/10 outline-none font-medium text-[#0F172A] placeholder:text-gray-300 transition-all resize-none"></textarea>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Point de rendez-vous</label>
              <input type="text" name="meetingPoint" value={formData.meetingPoint} onChange={handleChange} placeholder="Ex: Aéroport d'Alger" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all" />
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Image (URL) *</label>
                <input 
                  type="url" 
                  name="coverImage" 
                  value={formData.coverImage} 
                  onChange={handleChange} 
                  required
                  placeholder="https://images.unsplash.com/..." 
                  className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-primary/10 outline-none font-bold text-[#0F172A] transition-all" 
                />
              </div>
              
              {/* Image Preview */}
              <div className="relative group aspect-video rounded-[2rem] overflow-hidden bg-gray-50 border-2 border-dashed border-gray-100 flex items-center justify-center transition-all">
                {formData.coverImage ? (
                  <img 
                    src={formData.coverImage} 
                    alt="Preview" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop';
                    }}
                  />
                ) : (
                  <div className="text-center p-10">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                      <Map size={32} />
                    </div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Aperçu de l'image s'affichera ici</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-6 pt-4">
          <button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-600/90 text-white px-10 py-4 rounded-full font-black shadow-xl shadow-orange-600/30 flex items-center gap-3 active:scale-95 disabled:opacity-50 transition-all">
            <Save size={20} />
            {isLoading ? "ENREGISTREMENT..." : "SAUVEGARDER LES MODIFICATIONS"}
          </button>
        </div>

      </form>
    </div>
  );
}
