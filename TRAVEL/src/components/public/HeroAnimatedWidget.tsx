"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, Play, Languages } from "lucide-react";

const LANGUAGES = {
  fr: {
    name: "Français",
    code: "fr-FR",
    text: "Bienvenue sur Maghreb Voyage, votre porte d’entrée vers des destinations inoubliables et des expériences uniques.",
    label: "Bienvenue sur MaghrebVoyage"
  },
  en: {
    name: "English",
    code: "en-US",
    text: "Welcome to Maghreb Voyage, your gateway to unforgettable destinations and unique experiences.",
    label: "Welcome to MaghrebVoyage"
  },
  ar: {
    name: "العربية",
    code: "ar-SA",
    text: "مرحبًا بكم في ماغريب فوياج، حيث تبدأ أجمل الرحلات",
    label: "مرحبًا بكم في ماغريب فوياج"
  }
};

export default function HeroAnimatedWidget() {
  const [lang, setLang] = useState<keyof typeof LANGUAGES>("fr");
  const [muted, setMuted] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle mouse move for parallax effect
  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const speak = (forceLang?: keyof typeof LANGUAGES) => {
    const currentLang = forceLang || lang;
    const text = LANGUAGES[currentLang].text;
    
    // For Arabic, use Google Translate TTS as it's more reliable
    if (currentLang === 'ar') {
      return speakArabicWithGoogle(text);
    }

    // For other languages, use native speech synthesis
    if (!("speechSynthesis" in window)) {
      console.error("Speech Synthesis not supported");
      return;
    }
    
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.error("Error canceling speech:", e);
    }

    const langCode = LANGUAGES[currentLang].code;
    console.log(`🎤 Speaking ${currentLang} (${langCode})`);
    
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langCode;
    utter.rate = 0.9;
    utter.pitch = 1.0;
    utter.volume = 1;

    utter.onstart = () => {
      setSpeaking(true);
      console.log(`▶ Speech started`);
    };
    
    utter.onend = () => {
      setSpeaking(false);
      console.log(`⏹ Speech ended`);
    };
    
    utter.onerror = (e) => {
      console.error(`❌ Speech error: ${e.error}`);
      setSpeaking(false);
    };

    const voices = window.speechSynthesis.getVoices();
    const targetLangCode = langCode.split('-')[0];
    
    const voice = 
      voices.find(v => v.lang === langCode) ||
      voices.find(v => v.lang.startsWith(targetLangCode)) ||
      voices[0];

    if (voice) {
      utter.voice = voice;
      console.log(`✓ Using voice: ${voice.name}`);
    }

    try {
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.error("Error speaking:", e);
      setSpeaking(false);
    }

    setHasSpoken(true);
    setMuted(false);
  };

  const speakArabicWithGoogle = (text: string) => {
    setSpeaking(true);
    console.log(`🎤 Speaking Arabic with Google Translate TTS`);
    
    try {
      // Use Google Translate TTS API endpoint
      const encodedText = encodeURIComponent(text);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ar&client=tw-ob`;
      
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => {
        setSpeaking(true);
        console.log(`▶ Arabic audio playing`);
      };
      
      audio.onended = () => {
        setSpeaking(false);
        console.log(`⏹ Arabic audio ended`);
      };
      
      audio.onerror = (e) => {
        console.error(`❌ Arabic audio error:`, e);
        setSpeaking(false);
        // Fallback to system speech synthesis
        fallbackToSystemSpeech(text);
      };
      
      audio.play().catch(err => {
        console.error("Error playing audio:", err);
        setSpeaking(false);
        // Fallback to system speech synthesis
        fallbackToSystemSpeech(text);
      });
    } catch (e) {
      console.error("Error with Google TTS:", e);
      setSpeaking(false);
      fallbackToSystemSpeech(text);
    }

    setHasSpoken(true);
    setMuted(false);
  };

  const fallbackToSystemSpeech = (text: string) => {
    console.log("⚠ Falling back to system speech synthesis");
    if (!("speechSynthesis" in window)) return;

    try {
      window.speechSynthesis.cancel();
      
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'ar-SA';
      utter.rate = 0.8;
      utter.pitch = 0.95;
      
      utter.onstart = () => setSpeaking(true);
      utter.onend = () => setSpeaking(false);
      utter.onerror = () => setSpeaking(false);
      
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.error("Fallback speech failed:", e);
      setSpeaking(false);
    }
  };

  const toggleMute = () => {
    if (speaking) {
      // Stop both speech synthesis and any playing audio
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeaking(false);
      setMuted(true);
    } else {
      speak();
      setMuted(false);
    }
  };

  const changeLanguage = (newLang: keyof typeof LANGUAGES) => {
    setLang(newLang);
    setShowLangMenu(false);
    speak(newLang);
  };

  useEffect(() => {
    // Load voices for non-Arabic languages
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      
      const handleVoicesChanged = () => {
        window.speechSynthesis.getVoices();
        console.log("Voices updated");
      };
      
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      // Auto-play after a delay
      const timer = setTimeout(() => {
        if (!hasSpoken) {
          console.log("Auto-playing welcome message...");
          speak();
        }
      }, 1500);
      
      return () => {
        clearTimeout(timer);
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div 
      className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group bg-[#0F172A]"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
    >
      {/* Background Image with Enhanced Parallax & Ken Burns */}
      <div 
        className="absolute inset-0 transition-transform duration-500 ease-out"
        style={{ 
          transform: `scale(1.15) translate(${mousePos.x * 30}px, ${mousePos.y * 30}px)` 
        }}
      >
        <img
          src="/maghreb_arch.png"
          alt="Maghreb"
          className="w-full h-full object-cover animate-ken-burns"
        />
        <style jsx>{`
          @keyframes kenBurns {
            0% { transform: scale(1); }
            50% { transform: scale(1.08); }
            100% { transform: scale(1); }
          }
          .animate-ken-burns {
            animation: kenBurns 45s ease-in-out infinite;
          }
        `}</style>
      </div>

      {/* Light Rays / Glimmer Effect */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-30">
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/10 to-transparent rotate-45 animate-shimmer" />
        <style jsx>{`
          @keyframes shimmer {
            0% { transform: translateX(-50%) rotate(45deg); }
            100% { transform: translateX(50%) rotate(45deg); }
          }
          .animate-shimmer {
            animation: shimmer 10s linear infinite;
          }
        `}</style>
      </div>

      {/* Dynamic Overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-10" />
      
      {/* Animated Dust Particles */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/20 rounded-full blur-[1px] animate-float"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDuration: `${Math.random() * 20 + 15}s`,
              animationDelay: `${Math.random() * 10}s`,
            }}
          />
        ))}
        <style jsx>{`
          @keyframes float {
            0% { transform: translateY(0) translateX(0) opacity: 0; }
            20% { opacity: 0.4; }
            80% { opacity: 0.4; }
            100% { transform: translateY(-200px) translateX(30px) opacity: 0; }
          }
          .animate-float {
            animation: float linear infinite;
          }
        `}</style>
      </div>

      {/* Audio Visualization (Bottom Right) */}
      {speaking && (
        <div className="absolute bottom-10 right-10 z-20 flex gap-1.5 items-end h-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="w-1 bg-white/80 rounded-full"
              style={{ 
                height: '100%', 
                animation: `soundBar 0.4s ease-in-out ${i * 0.08}s infinite alternate` 
              }}
            />
          ))}
          <style jsx>{`
            @keyframes soundBar {
              from { height: 30%; }
              to { height: 100%; }
            }
          `}</style>
        </div>
      )}

      {/* Top Navigation Controls - Kept for translation */}
      <div className="absolute top-10 right-10 z-30 flex gap-5">
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-orange-600 transition-all shadow-2xl active:scale-95"
          >
            <Languages size={24} />
          </button>
          
          {showLangMenu && (
            <div className="absolute top-16 right-0 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden min-w-[180px] border border-gray-100 animate-in fade-in zoom-in duration-300">
              {Object.entries(LANGUAGES).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => changeLanguage(key as keyof typeof LANGUAGES)}
                  className={`w-full px-6 py-4 text-left text-xs font-black uppercase tracking-widest transition-all hover:bg-orange-600 hover:text-white ${
                    lang === key ? 'text-orange-600 bg-orange-50' : 'text-gray-900'
                  }`}
                >
                  {value.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-2xl border backdrop-blur-xl flex items-center justify-center text-white transition-all duration-300 shadow-2xl active:scale-95 ${
            speaking ? 'bg-orange-600 border-orange-400' : 'bg-black/40 border-white/10 hover:bg-black/60'
          }`}
        >
          {speaking ? <Volume2 size={24} className="animate-pulse" /> : <VolumeX size={24} />}
        </button>
      </div>

      {/* Play Interaction Overlay */}
      {!hasSpoken && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity duration-500">
          <button 
            onClick={() => speak()}
            className="w-24 h-24 rounded-full bg-orange-600 flex items-center justify-center shadow-[0_0_60px_rgba(234,88,12,0.4)] hover:scale-110 transition-transform duration-500"
          >
            <Play size={36} className="text-white ml-2" />
          </button>
        </div>
      )}
    </div>
  );


}
