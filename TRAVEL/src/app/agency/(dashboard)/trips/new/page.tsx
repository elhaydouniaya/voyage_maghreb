"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Map, 
  CreditCard, 
  Settings, 
  Check
} from "lucide-react";
import TripImageUpload from "@/components/trips/TripImageUpload";

enum TripType {
  DESERT = "DESERT",
  CULTURE = "CULTURE",
  AVENTURE = "AVENTURE",
  FAMILLE = "FAMILLE",
  LUXE = "LUXE",
  NATURE = "NATURE",
  RELIGIEUX = "RELIGIEUX",
  HISTORIQUE = "HISTORIQUE",
}

enum PhysicalLevel {
  EASY = "EASY",
  MEDIUM = "MEDIUM",
  SPORT = "SPORT",
  EXPERT = "EXPERT",
}

export default function NewTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    tripType: TripType.AVENTURE,
    startDate: "",
    endDate: "",
    totalSpots: 12,
    meetingPoint: "",
    totalPrice: 800,
    depositAmount: 150,
    currency: "EUR",
    cancelPolicy: "",
    description: "",
    inclusionsText: "",
    exclusionsText: "",
    programDays: "",
    physicalLevel: PhysicalLevel.MEDIUM,
    guideLanguages: ["FR", "AR"],
    guideLanguagesText: "FR, AR",
    coverImage: "",
    images: [] as string[],
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === "totalSpots" || name === "totalPrice" || name === "depositAmount")
        ? (value === "" ? 0 : Number(value))
        : value
    }));
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
        nextStep();
        return;
    }

    setIsLoading(true);
    setError("");

    try {
      const langs = formData.guideLanguagesText
        .split(/[,;]+/)
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

      const programWithPolicy = formData.cancelPolicy.trim()
        ? `${formData.programDays}\n\n--- Politique d'annulation ---\n${formData.cancelPolicy.trim()}`
        : formData.programDays;

      const { cancelPolicy: _cp, guideLanguagesText: _gt, ...rest } = formData;

      const res = await fetch("/api/agency/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...rest,
          guideLanguages: langs.length ? langs : formData.guideLanguages,
          programDays: programWithPolicy,
          publish: true,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue lors de la création.");
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push("/agency/trips");
      }, 2000);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
               <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600">
                  <Map size={20} />
               </div>
               <h2 className="text-xl font-black text-[#0F172A]">Étape 1 : Informations Générales</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Titre du voyage *</label>
                <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] placeholder:text-gray-300 transition-all" placeholder="Ex: Trekking dans le Tassili N'Ajjer" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Destination *</label>
                <input type="text" name="destination" value={formData.destination} onChange={handleChange} required className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] placeholder:text-gray-300 transition-all" placeholder="Ex: Djanet, Algérie" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label htmlFor="tripType" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Type *</label>
                <select id="tripType" name="tripType" value={formData.tripType} onChange={handleChange} title="Type de voyage" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] appearance-none transition-all">
                  {Object.values(TripType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-3">
                <label htmlFor="startDate" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Départ *</label>
                <input id="startDate" type="date" name="startDate" value={formData.startDate} onChange={handleChange} required title="Date de départ" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all" />
              </div>
              <div className="space-y-3">
                <label htmlFor="endDate" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Retour *</label>
                <input id="endDate" type="date" name="endDate" value={formData.endDate} onChange={handleChange} required title="Date de retour" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label htmlFor="totalSpots" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Nombre de places *</label>
                  <input id="totalSpots" type="number" name="totalSpots" value={formData.totalSpots} onChange={handleChange} required min="1" title="Nombre total de places" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]" />
               </div>
               <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Point de rendez-vous</label>
                  <input type="text" name="meetingPoint" value={formData.meetingPoint} onChange={handleChange} placeholder="Ex: Aéroport d'Alger" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]" />
               </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
               <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600">
                  <CreditCard size={20} />
               </div>
               <h2 className="text-xl font-black text-[#0F172A]">Étape 2 : Prix et Paiement</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <label htmlFor="totalPrice" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Prix Total (€) *</label>
                <input id="totalPrice" type="number" name="totalPrice" value={formData.totalPrice} onChange={handleChange} required min="1" title="Prix total du voyage" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]" />
              </div>
              <div className="space-y-3">
                <label htmlFor="depositAmount" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Acompte Stripe (€) *</label>
                <input id="depositAmount" type="number" name="depositAmount" value={formData.depositAmount} onChange={handleChange} required min="1" max={formData.totalPrice} title="Montant de l'acompte" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-orange-600" />
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest ml-1">Payé à la réservation</p>
              </div>
              <div className="space-y-3">
                <label htmlFor="currency" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Devise</label>
                <select id="currency" name="currency" value={formData.currency} onChange={handleChange} title="Devise" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]">
                  <option value="EUR">EUR (€)</option>
                  <option value="DZD">DZD (DA)</option>
                  <option value="MAD">MAD (DH)</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
               <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Conditions d'annulation</label>
               <textarea name="cancelPolicy" value={formData.cancelPolicy} onChange={handleChange} rows={4} placeholder="Ex: Remboursement total jusqu'à 30 jours avant le départ..." className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 font-medium text-[#0F172A] outline-none resize-none"></textarea>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="flex justify-between items-center border-b border-gray-50 pb-6">
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-600">
                     <Settings size={20} />
                  </div>
                  <h2 className="text-xl font-black text-[#0F172A]">Étape 3 : Description et Programme</h2>
               </div>
            </div>
            
            <div className="space-y-3">
              <label htmlFor="description" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Description complète *</label>
              <textarea id="description" name="description" value={formData.description} onChange={handleChange} required rows={6} title="Description du voyage" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 font-medium text-[#0F172A] outline-none resize-none"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Inclus (séparés par des virgules)</label>
                <textarea name="inclusionsText" value={formData.inclusionsText} onChange={handleChange} rows={3} placeholder="Transport, Hébergement, Repas..." className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 font-medium text-[#0F172A] outline-none resize-none"></textarea>
              </div>
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Non inclus (séparés par des virgules)</label>
                <textarea name="exclusionsText" value={formData.exclusionsText} onChange={handleChange} rows={3} placeholder="Vols, Assurance, Dépenses..." className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 font-medium text-[#0F172A] outline-none resize-none"></textarea>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Programme jour par jour</label>
              <textarea name="programDays" value={formData.programDays} onChange={handleChange} rows={6} placeholder="Jour 1: Arrivée et accueil... Jour 2: Départ pour les dunes..." className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] px-6 py-5 font-medium text-[#0F172A] outline-none resize-none"></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-3">
                  <label htmlFor="physicalLevel" className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Niveau physique</label>
                  <select id="physicalLevel" name="physicalLevel" value={formData.physicalLevel} onChange={handleChange} title="Niveau physique" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]">
                     {Object.values(PhysicalLevel).map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                  </select>
               </div>
               <div className="space-y-3">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Langues du guide</label>
                  <input type="text" name="guideLanguagesText" value={formData.guideLanguagesText} onChange={handleChange} placeholder="FR, AR, EN..." className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 font-bold text-[#0F172A]" />
               </div>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
               <h2 className="text-xl font-black text-[#0F172A]">Étape 4 : Photos</h2>
            </div>
            <TripImageUpload
              coverImage={formData.coverImage}
              gallery={formData.images}
              onCoverChange={(url) => setFormData((prev) => ({ ...prev, coverImage: url }))}
              onGalleryChange={(images) => setFormData((prev) => ({ ...prev, images }))}
            />
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-24 font-outfit">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/agency/trips" className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all active:scale-95">
            <ArrowLeft size={24} className="text-[#0F172A]" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Publier un Voyage</h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Créez votre prochaine aventure de groupe</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
           {[1, 2, 3, 4].map(i => (
             <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i === step ? 'bg-orange-600 w-8' : i < step ? 'bg-orange-200' : 'bg-gray-100'}`} />
           ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-[2rem] text-sm font-bold">
          {error}
        </div>
      )}

      {isSuccess && (
        <div className="bg-[#10B981] text-white p-6 rounded-[2rem] shadow-xl shadow-[#10B981]/20 text-sm font-black uppercase tracking-widest flex items-center gap-4">
          <Check size={20} /> Voyage publié avec succès ! Redirection...
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-10 md:p-16 rounded-[3rem] shadow-sm border border-gray-100">
          {renderStep()}
        </div>

        <div className="flex justify-between items-center pt-4">
          {step > 1 ? (
            <button type="button" onClick={prevStep} className="px-8 py-4 text-gray-400 font-black uppercase tracking-widest text-xs hover:text-[#0F172A] transition-colors flex items-center gap-2">
              <ArrowLeft size={16} /> Précédent
            </button>
          ) : <div />}

          <div className="flex gap-6">
            {step < 4 ? (
              <button type="button" onClick={nextStep} className="bg-[#0F172A] text-white px-10 py-4 rounded-full font-black shadow-xl shadow-black/10 flex items-center gap-3 transition-all hover:bg-black active:scale-95">
                Suivant <ArrowRight size={20} />
              </button>
            ) : (
              <button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 text-white px-10 py-4 rounded-full font-black shadow-xl shadow-orange-600/30 flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50">
                <Save size={20} />
                {isLoading ? "PUBLICATION..." : "PUBLIER LE VOYAGE"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
