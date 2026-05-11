"use client";

import { useState, useEffect } from "react";
import { 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  Check, 
  MapPin, 
  Users, 
  Euro, 
  Calendar, 
  Plane, 
  Home, 
  Search,
  CheckCircle2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

const TRIP_STYLES = ["Détente", "Sportif", "Gastronomique", "Photographie", "Rencontres"];
const ACTIVITIES = ["Randonnée", "Sandboard", "Thé traditionnel", "Visite de souk", "Bivouac", "Spa & Hammam", "Quad"];

export default function MultiStepSearch() {
  const [step, setStep] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [summary, setSummary] = useState("");

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
    localStorage.setItem("travel_request_draft", JSON.stringify(formData));
  }, [formData]);

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
    setIsAnalyzing(true);
    setStep(6); // Analysis step

    try {
      const response = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (data.success) {
        setResults(data.results);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error("Match error", err);
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false);
      }, 3000); // Simulate AI processing for "wow" factor as requested in PRD
    }
  };

  const progress = (step / 5) * 100;

  if (step === 6) {
    return (
      <div className="bg-white rounded-[4rem] shadow-2xl border border-gray-100 p-12 md:p-20 text-center space-y-12">
        {isAnalyzing ? (
          <div className="space-y-8 animate-in fade-in duration-1000">
            <div className="relative w-32 h-32 mx-auto">
               <div className="absolute inset-0 bg-orange-500/20 rounded-full animate-ping" />
               <div className="relative bg-orange-600 w-32 h-32 rounded-full flex items-center justify-center text-white shadow-2xl">
                  <Sparkles size={48} className="animate-pulse" />
               </div>
            </div>
            <div>
               <h2 className="text-3xl font-black text-[#0F172A] tracking-tight mb-2">Analyse en cours...</h2>
               <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Notre IA explore les meilleures opportunités pour vous</p>
            </div>
            <div className="max-w-xs mx-auto space-y-4">
               <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
                  <div className="h-full bg-orange-600 animate-progress w-full" />
               </div>
               <p className="text-xs text-gray-400 italic">"Génération du profil voyageur..."</p>
            </div>
          </div>
        ) : (
          <div className="space-y-12 animate-in slide-in-from-bottom-8 duration-700">
            <div className="space-y-4">
              <h2 className="text-4xl font-black text-[#0F172A] tracking-tight">Nous avons trouvé vos <span className="text-orange-500">pépites.</span></h2>
              <p className="text-gray-500 font-medium max-w-lg mx-auto">{summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {results.length > 0 ? results.map((trip, i) => (
                 <div key={trip.id} className="bg-[#F8FAFC] rounded-[3rem] overflow-hidden border border-gray-100 group hover:shadow-2xl transition-all duration-500">
                    <div className="h-48 relative">
                       <Image src={trip.coverImage} alt={trip.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                       <div className="absolute top-6 left-6 bg-orange-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg">
                          {trip.compatibility}% COMPATIBLE
                       </div>
                    </div>
                    <div className="p-8 text-left space-y-6">
                       <div>
                          <h4 className="font-black text-[#0F172A] text-lg leading-tight mb-2">{trip.title}</h4>
                          <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                             <MapPin size={12} className="text-orange-500" /> {trip.destination}
                          </div>
                       </div>
                       <div className="flex justify-between items-center pt-6 border-t border-gray-200/50">
                          <div className="text-2xl font-black text-[#0F172A]">{trip.totalPrice}€</div>
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
            
            <div className="pt-8">
               <button onClick={() => setStep(1)} className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors">
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
                     placeholder="Ex: Sahara, Marrakech, Djerba..." 
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

               <div className="space-y-6">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between">
                     Budget maximum / pers. <span className="text-orange-600">{formData.budgetMax}€</span>
                  </label>
                  <input 
                    type="range" 
                    name="budgetMax" 
                    min="200" 
                    max="5000" 
                    step="100"
                    title="Budget maximum par personne"
                    value={formData.budgetMax}
                    onChange={handleChange}
                    className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-600" 
                  />
                  <div className="flex justify-between text-[9px] font-black text-gray-300 uppercase tracking-widest">
                     <span>Eco (200€)</span>
                     <span>Premium (5000€)</span>
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
