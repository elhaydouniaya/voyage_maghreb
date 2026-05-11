"use client";

import { useState, useEffect, useRef } from "react";
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  MapPin,
  Compass
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const AIChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'bot' | 'user', content: string, type?: string, trip?: any}[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    
    const savedMessages = localStorage.getItem("ai_chat_history");
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
      initializedRef.current = true;
    } else if (isOpen && messages.length === 0) {
      setMessages([
        { 
          role: 'bot', 
          content: "Bonjour ! Je suis votre guide MaghrebVoyage. 🌵 Où rêvez-vous de partir ? Dites-moi tout !" 
        }
      ]);
      initializedRef.current = true;
    }
  }, [isOpen]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("ai_chat_history", JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (text?: string) => {
    const messageText = text || input;
    if (!messageText.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: messageText }]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response + Matching
    setTimeout(async () => {
      // If the user mentions a destination, we try to match
      const destinations = ["Algérie", "Maroc", "Tunisie", "Mauritanie", "Libye", "Taghit", "Marrakech", "Djanet"];
      const foundDest = destinations.find(d => messageText.toLowerCase().includes(d.toLowerCase()));

      if (foundDest) {
        // Mock matching logic
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: `Génial ! ${foundDest} est une destination magnifique. J'ai trouvé quelque chose qui pourrait vous plaire :`,
          type: 'recommendation'
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'bot', 
          content: "C'est noté ! Pour vous aider au mieux, je vous suggère d'utiliser notre configurateur complet qui analysera 18 points de contrôle pour votre voyage idéal." 
        }]);
      }
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] font-outfit">
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Fermer l'assistant" : "Ouvrir l'assistant IA"}
        className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center transition-all duration-500 hover:scale-110 active:scale-95 ${
          isOpen ? 'bg-[#0F172A] text-white rotate-90' : 'bg-orange-600 text-white'
        }`}
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} className="animate-pulse" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-24 right-0 w-[400px] h-[600px] bg-white rounded-[3rem] shadow-2xl border border-gray-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 duration-500">
           {/* Header */}
           <div className="bg-[#0F172A] p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
                    <Bot size={20} />
                 </div>
                 <div>
                    <h4 className="font-black text-sm">Assistant Maghreb</h4>
                    <div className="flex items-center gap-1.5">
                       <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                       <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Expert Voyage</span>
                    </div>
                 </div>
              </div>
              <Sparkles size={18} className="text-orange-500" />
           </div>

           {/* Messages */}
           <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F8FAFC]/50 scroll-smooth">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in duration-300`}>
                   <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-medium leading-relaxed ${
                     msg.role === 'user' ? 'bg-[#0F172A] text-white rounded-tr-none' : 'bg-white border border-gray-100 text-[#0F172A] rounded-tl-none shadow-sm'
                   }`}>
                      {msg.content}
                   </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                   <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                      <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce" />
                      <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1 h-1 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                   </div>
                </div>
              )}
           </div>

           {/* Input */}
           <div className="p-6 bg-white border-t border-gray-100">
              <div className="relative">
                 <input 
                   type="text" 
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                   placeholder="Posez votre question..." 
                   title="Votre message"
                   className="w-full bg-[#F8FAFC] border border-gray-100 rounded-xl pl-4 pr-12 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-orange-500/10 transition-all"
                 />
                 <button 
                   onClick={() => handleSend()}
                   title="Envoyer le message"
                   className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#0F172A] text-white rounded-lg flex items-center justify-center hover:bg-orange-600 transition-all"
                 >
                    <Send size={14} />
                 </button>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                 <Link href="/recherche" className="w-full bg-orange-50 text-orange-600 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-center border border-orange-100/50 hover:bg-orange-100 transition-all flex items-center justify-center gap-2">
                    <Compass size={14} /> Utiliser le configurateur complet
                 </Link>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export { AIChatWidget };
export default AIChatWidget;
