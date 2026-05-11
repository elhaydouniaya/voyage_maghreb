"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  MapPin, 
  Users, 
  Calendar, 
  Compass,
  ArrowRight,
  ChevronRight,
  Bot,
  Send,
  RefreshCcw,
  CheckCircle2,
  Heart
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import Toast, { useToast } from "@/components/ui/Toast";
import SkeletonTripCard from "@/components/ui/SkeletonLoaders";

interface Message {
  role: "bot" | "user";
  content: string | React.ReactNode;
  type?: "text" | "options" | "results" | "loading" | "options_retry";
}

const TRIP_TYPES = [
  { id: "DESERT", label: "Désert", icon: "🌵" },
  { id: "CULTURE", label: "Culture", icon: "🕌" },
  { id: "AVENTURE", label: "Aventure", icon: "🎒" },
  { id: "FAMILLE", label: "Famille", icon: "👨‍👩‍👧‍👦" },
  { id: "LUXE", label: "Luxe", icon: "✨" },
  { id: "RELIGIEUX", label: "Religieux", icon: "🌙" },
];

export default function GuideTouristiqueIA() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [formData, setFormData] = useState({
    destination: "",
    numberOfTravelers: 2,
    budgetMax: 1500,
    tripType: [] as string[],
    startDate: "",
  });
  const [results, setResults] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const { toast, showToast, hideToast } = useToast();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Initial greeting
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    
    addBotMessage("Bonjour ! Je suis votre guide MaghrebVoyage. 🌵 Je vais vous aider à configurer votre voyage idéal en quelques instants.");
    setTimeout(() => {
      addBotMessage("Pour commencer, quelle destination vous fait rêver ? (Ex: Sahara, Marrakech, Djerba...)");
      setStep(1);
    }, 1500);
  }, []);

  const addBotMessage = (content: string | React.ReactNode, type: Message["type"] = "text") => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { role: "bot", content, type }]);
      setIsTyping(false);
    }, 1000);
  };

  const addUserMessage = (content: string) => {
    setMessages(prev => [...prev, { role: "user", content, type: "text" }]);
  };

  const handleInputSubmit = (value: string) => {
    if (!value.trim()) return;
    addUserMessage(value);
    processNextStep(value);
  };

  const processNextStep = async (value: string) => {
    if (step === 1) {
      setFormData(prev => ({ ...prev, destination: value }));
      addBotMessage(`C'est noté, ${value} est un excellent choix ! ✈️`);
      setTimeout(() => {
        addBotMessage("Combien de voyageurs ferez-vous partie de l'aventure ?");
        setStep(2);
      }, 1000);
    } else if (step === 2) {
      const num = parseInt(value) || 2;
      setFormData(prev => ({ ...prev, numberOfTravelers: num }));
      addBotMessage(`Parfait, une équipe de ${num} explorateurs ! 👥`);
      setTimeout(() => {
        addBotMessage("Quel style de voyage recherchez-vous ?", "options");
        setStep(3);
      }, 1000);
    }
  };

  const selectTripType = (type: string) => {
    setFormData(prev => ({ ...prev, tripType: [type] }));
    addUserMessage(TRIP_TYPES.find(t => t.id === type)?.label || type);
    addBotMessage("Excellent choix. Enfin, quel serait votre budget maximum par personne ?");
    setStep(4);
  };

  const handleBudgetSubmit = (budget: string) => {
    const b = parseInt(budget) || 1500;
    setFormData(prev => ({ ...prev, budgetMax: b }));
    addUserMessage(`${b}€ par personne`);
    
    // Personalized Recap for "Memory" feel with City Highlights
    const cityHighlights = formData.destination.toLowerCase().includes("marrakech") 
      ? "les souks vibrants et le jardin Majorelle" 
      : formData.destination.toLowerCase().includes("sahara") 
        ? "les dunes dorées et les nuits étoilées" 
        : "les trésors cachés de la région";
        
    const recap = `C'est noté ! Un voyage ${formData.tripType[0]?.toLowerCase()} à ${formData.destination} pour ${formData.numberOfTravelers} personnes. J'adore cette destination, surtout pour ${cityHighlights}. Laissez-moi analyser nos 52 voyages pour vous...`;
    
    addBotMessage(recap);
    setStep(5);
    performMatch(b);
  };

  const toggleFavorite = (trip: any) => {
    try {
      const favs = JSON.parse(localStorage.getItem("mv_favorites") || "[]");
      const exists = favs.find((f: any) => f.id === trip.id);
      let updated;
      if (exists) {
        updated = favs.filter((f: any) => f.id !== trip.id);
      } else {
        updated = [trip, ...favs];
      }
      localStorage.setItem("mv_favorites", JSON.stringify(updated));
      showToast(exists ? "Retiré des favoris" : "Ajouté aux favoris", exists ? "info" : "success");
    } catch (e) {
      console.error(e);
    }
  };

  const saveToHistory = (results: any[], summary: string) => {
    try {
      const history = JSON.parse(localStorage.getItem("travel_ai_history") || "[]");
      const newEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        destination: formData.destination,
        summary,
        results: results.slice(0, 3), // Save top 3 matches
      };
      // Keep only last 10 searches
      const updatedHistory = [newEntry, ...history].slice(0, 10);
      localStorage.setItem("travel_ai_history", JSON.stringify(updatedHistory));
    } catch (e) {
      console.error("Error saving history", e);
    }
  };

  const restartSearch = () => {
    setMessages([]);
    setFormData({
      destination: "",
      numberOfTravelers: 2,
      budgetMax: 1500,
      tripType: [] as string[],
      startDate: "",
    });
    setResults([]);
    setStep(1);
    addBotMessage("C'est reparti ! 🚀 Quelle nouvelle destination vous tente ? (Ex: Sahara, Marrakech, Djerba...)");
  };

  const performMatch = async (budget: number) => {
    setIsTyping(true);
    try {
      const response = await fetch("/api/ai/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, budgetMax: budget })
      });
      const data = await response.json();
      
      if (data.success) {
        setTimeout(() => {
          setResults(data.results);
          if (data.results && data.results.length > 0) {
            addBotMessage("J'ai trouvé des correspondances exceptionnelles pour vous ! Voici mes recommandations personnalisées :", "results");
            saveToHistory(data.results, data.summary);
          } else {
            addBotMessage("Malheureusement, je n'ai trouvé aucun voyage correspondant exactement à vos critères pour le moment. 🌵");
            setTimeout(() => {
              addBotMessage("Souhaitez-vous élargir vos critères ou recommencer la recherche ?", "options_retry");
            }, 1000);
          }
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      addBotMessage("Oups, j'ai eu un petit souci technique. Voulez-vous réessayer ?");
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="bg-white rounded-[3rem] md:rounded-[4rem] shadow-2xl border border-gray-100 overflow-hidden flex flex-col h-[700px] md:h-[800px] font-outfit relative">
      {/* Header */}
      <div className="bg-[#0F172A] p-6 md:p-8 text-white flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Bot size={24} />
           </div>
           <div>
              <h3 className="font-black text-lg tracking-tight">Guide Touristique IA</h3>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Expert Destinations Maghreb</span>
              </div>
           </div>
        </div>
        <div className="hidden md:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-full border border-white/10">
           <Sparkles size={14} className="text-orange-500" />
           <span className="text-[10px] font-black uppercase tracking-widest">Analyse en temps réel</span>
        </div>
      </div>

      {/* Chat History */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 bg-[#F8FAFC]/50 scroll-smooth">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            {msg.role === "bot" && (
              <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mr-3 mt-1 shrink-0">
                <Bot size={16} />
              </div>
            )}
            <div className={`max-w-[85%] space-y-4 ${msg.role === "user" ? "flex flex-col items-end" : ""}`}>
              {msg.type === "text" && (
                <div className={`p-5 md:p-6 rounded-[2rem] text-sm md:text-base font-medium leading-relaxed shadow-sm border ${
                  msg.role === "user" 
                    ? "bg-[#0F172A] text-white rounded-tr-none border-[#0F172A]" 
                    : "bg-white text-[#0F172A] rounded-tl-none border-gray-100"
                }`}>
                  {msg.content}
                </div>
              )}

              {msg.type === "options" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-xl">
                   {TRIP_TYPES.map(type => (
                     <button 
                       key={type.id}
                       onClick={() => selectTripType(type.id)}
                       className="p-4 md:p-6 bg-white border border-gray-100 rounded-[2rem] hover:border-orange-500 hover:shadow-xl hover:scale-105 transition-all group text-center space-y-2"
                     >
                        <span className="text-3xl block">{type.icon}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-orange-600">{type.label}</span>
                     </button>
                   ))}
                </div>
              )}

              {msg.type === "options_retry" && (
                <div className="flex flex-col gap-4 w-full max-w-sm">
                   <button 
                     onClick={restartSearch}
                     className="w-full py-4 bg-[#0F172A] text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center gap-3 shadow-lg"
                   >
                      <RefreshCcw size={14} /> Recommencer la recherche
                   </button>
                   <button 
                     onClick={restartSearch}
                     className="w-full py-4 border-2 border-[#0F172A] text-[#0F172A] rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
                   >
                      <Compass size={14} /> Explorer d'autres destinations
                   </button>
                </div>
              )}

              {msg.type === "results" && results.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
                   {results.map((trip, idx) => (
                     <div key={trip.id} className="bg-white rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-xl group hover:border-orange-500/30 transition-all duration-500 animate-in zoom-in-95 delay-150">
                        <div className="h-40 relative">
                           <Image src={trip.coverImage} alt={trip.title} fill className="object-cover" />
                           <div className="absolute top-4 left-4 bg-orange-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg">
                              {trip.compatibility}% MATCH
                           </div>
                           <button 
                             onClick={() => toggleFavorite(trip)}
                             title="Ajouter aux favoris"
                             className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-white hover:text-red-500 transition-all shadow-lg border border-white/30 group/fav"
                           >
                              <Heart size={14} className="group-active/fav:scale-125 transition-transform" />
                           </button>
                        </div>
                        <div className="p-6 space-y-4">
                           <h4 className="font-black text-[#0F172A] leading-tight text-sm">{trip.title}</h4>
                           <div className="flex justify-between items-center">
                              <div className="flex flex-col">
                                 <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">À partir de</span>
                                 <span className="text-xl font-black text-[#0F172A]">{trip.totalPrice || trip.price || 0}€</span>
                              </div>
                              <Link href={`/trip/${trip.slug}`} className="bg-[#0F172A] text-white text-[9px] font-black px-6 py-3 rounded-full hover:bg-orange-600 transition-all uppercase tracking-widest shadow-lg shadow-black/5">
                                 Découvrir
                              </Link>
                           </div>
                        </div>
                     </div>
                   ))}
                   <div className="md:col-span-2 pt-8 flex flex-col sm:flex-row gap-4">
                      <button 
                        onClick={restartSearch}
                        className="flex-1 py-4 border-2 border-dashed border-gray-200 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-orange-500 hover:text-orange-600 transition-all flex items-center justify-center gap-3"
                      >
                         <RefreshCcw size={14} /> Recommencer la recherche
                      </button>
                      <button 
                        onClick={() => {
                          const url = `${window.location.origin}/recherche?dest=${formData.destination}&budget=${formData.budgetMax}`;
                          navigator.clipboard.writeText(url);
                          showToast("Lien magique copié ! Partagez-le avec vos amis.", "success");
                        }}
                        className="flex-1 py-4 bg-orange-100 text-orange-600 rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-orange-200 transition-all flex items-center justify-center gap-3 border border-orange-200 shadow-sm"
                      >
                         <Sparkles size={14} /> Générer mon lien magique
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex flex-col gap-6 animate-in fade-in">
             <div className="flex justify-start">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 mr-3 shrink-0">
                   <Bot size={16} />
                </div>
                <div className="bg-white border border-gray-100 p-5 rounded-[2rem] rounded-tl-none flex gap-1.5 shadow-sm">
                   <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce" />
                   <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                   <div className="w-1.5 h-1.5 bg-orange-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
             </div>
             
             {step === 5 && (
               <div className="ml-11 grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl opacity-50">
                  <SkeletonTripCard />
                  <SkeletonTripCard />
               </div>
             )}
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-6 md:p-8 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto relative">
          {step === 4 ? (
            <div className="flex flex-col gap-4 animate-in slide-in-from-bottom-4">
               <input 
                 type="range" 
                 min="200" 
                 max="5000" 
                 step="100" 
                 defaultValue="1500"
                 id="budget-range-input"
                 title="Budget range"
                 className="w-full h-2 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-orange-600"
               />
               <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-gray-400">200€</span>
                  <button 
                    onClick={() => {
                      const val = (document.getElementById("budget-range-input") as HTMLInputElement).value;
                      handleBudgetSubmit(val);
                    }}
                    className="bg-orange-600 text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:bg-[#0F172A] transition-all"
                  >
                    Confirmer le budget
                  </button>
                  <span className="text-xs font-bold text-gray-400">5000€+</span>
               </div>
            </div>
          ) : step === 5 ? (
            <div className="text-center py-4">
               <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] animate-pulse">Analyse de vos préférences en cours...</span>
            </div>
          ) : (
            <>
              <input 
                type="text" 
                placeholder={step === 1 ? "Ex: Sahara, Marrakech..." : step === 2 ? "Ex: 2, 4, 1..." : "Tapez votre réponse..."}
                title="Chat input"
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-[2rem] pl-8 pr-16 py-6 text-sm font-bold outline-none focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-gray-300"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleInputSubmit((e.target as HTMLInputElement).value);
                    (e.target as HTMLInputElement).value = "";
                  }
                }}
              />
              <button 
                onClick={() => {
                  const input = document.querySelector('input[title="Chat input"]') as HTMLInputElement;
                  handleInputSubmit(input.value);
                  input.value = "";
                }}
                title="Envoyer"
                className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-orange-600 text-white rounded-2xl flex items-center justify-center hover:bg-[#0F172A] transition-all shadow-lg shadow-orange-600/20"
              >
                <ArrowRight size={20} />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Floating Sparkles Decoration */}
      <div className="absolute bottom-32 left-10 opacity-10 pointer-events-none">
         <Compass size={120} className="text-orange-600 rotate-12" />
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  );
}
