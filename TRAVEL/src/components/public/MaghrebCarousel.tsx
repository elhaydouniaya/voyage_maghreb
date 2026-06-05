"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Play, Languages } from "lucide-react";

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

const COUNTRIES = [
  {
    name: "Maroc",
    image: "/maroc-riad.jpg",
    description: "Riad traditionnel",
    gradient: ""
  },
  {
    name: "Algérie",
    image: "/alger.jpg",
    description: "Mémorial du martyr", 
    gradient: "" 
  },
  {
    name: "Tunisie",
    image: "/tunisie.jpg",
    description: "Sidi Bou Saïd",
    gradient: ""
  },
  {
    name: "Libye",
    image: "/libye_capi.jpg",
    description: "capitale de la Libye",
    gradient: ""
  },
  {
    name: "Mauritanie",
    image: "/Chinguetti_libye.jpg",
    description: "Chinguetti",
    gradient: ""
  }
];

interface MaghrebCarouselProps {
  autoPlay?: boolean;
  interval?: number;
}

export default function MaghrebCarousel({ autoPlay = true, interval = 5000 }: MaghrebCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(autoPlay);

  // Audio State
  const [lang, setLang] = useState<keyof typeof LANGUAGES>("fr");
  const [hasSpoken, setHasSpoken] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  useEffect(() => {
    if (!isAutoPlay) return;

    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % COUNTRIES.length);
    }, interval);

    return () => clearInterval(timer);
  }, [isAutoPlay, interval]);

  const goToSlide = (index: number) => {
    setCurrent(index);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(autoPlay), 10000);
  };

  const goToPrevious = () => {
    setCurrent((prev) => (prev - 1 + COUNTRIES.length) % COUNTRIES.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(autoPlay), 10000);
  };

  const goToNext = () => {
    setCurrent((prev) => (prev + 1) % COUNTRIES.length);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(autoPlay), 10000);
  };

  const speak = (forceLang?: keyof typeof LANGUAGES) => {
    const currentLang = forceLang || lang;
    const text = LANGUAGES[currentLang].text;
    
    if (currentLang === 'ar') {
      return speakArabicWithGoogle(text);
    }

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
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = langCode;
    utter.rate = 0.9;
    utter.pitch = 1.0;
    utter.volume = 1;

    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
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

    if (voice) utter.voice = voice;

    try {
      window.speechSynthesis.speak(utter);
    } catch (e) {
      console.error("Error speaking:", e);
      setSpeaking(false);
    }

    setHasSpoken(true);
  };

  const speakArabicWithGoogle = (text: string) => {
    setSpeaking(true);
    try {
      const encodedText = encodeURIComponent(text);
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodedText}&tl=ar&client=tw-ob`;
      
      const audio = new Audio(audioUrl);
      audio.onplay = () => setSpeaking(true);
      audio.onended = () => setSpeaking(false);
      audio.onerror = () => {
        setSpeaking(false);
        fallbackToSystemSpeech(text);
      };
      
      audio.play().catch(() => {
        setSpeaking(false);
        fallbackToSystemSpeech(text);
      });
    } catch {
      setSpeaking(false);
      fallbackToSystemSpeech(text);
    }
    setHasSpoken(true);
  };

  const fallbackToSystemSpeech = (text: string) => {
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
    } catch {
      setSpeaking(false);
    }
  };

  const toggleMute = () => {
    if (speaking) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeaking(false);
    } else {
      speak();
    }
  };

  const changeLanguage = (newLang: keyof typeof LANGUAGES) => {
    setLang(newLang);
    setShowLangMenu(false);
    speak(newLang);
  };

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      const handleVoicesChanged = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
      
      return () => {
        window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      };
    }
     
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden rounded-[3rem] group">
      {/* Carousel Images */}
      <div className="relative w-full h-full">
        {COUNTRIES.map((country, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <img
              src={country.image}
              alt={country.name}
              className="w-full h-full object-cover"
            />
            {/* Overlay with gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-t ${country.gradient} opacity-30`}
            />
            
            {/* Content Overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white z-10">
              <div className="transition-all duration-500 transform translate-y-0">
                <p className="text-sm font-semibold uppercase tracking-widest mb-2 opacity-80">
                  {country.description}
                </p>
                <h3 className="text-5xl font-black tracking-tight">{country.name}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 z-0 pointer-events-none" />

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

      {/* Navigation Buttons */}
      <button
        onClick={goToPrevious}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 backdrop-blur-md hover:bg-white w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-2xl opacity-0 group-hover:opacity-100"
        aria-label="Previous country"
      >
        <ChevronLeft size={24} className="text-gray-900" />
      </button>

      <button
        onClick={goToNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/80 backdrop-blur-md hover:bg-white w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl hover:shadow-2xl opacity-0 group-hover:opacity-100"
        aria-label="Next country"
      >
        <ChevronRight size={24} className="text-gray-900" />
      </button>

      {/* Dots Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {COUNTRIES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === current
                ? "bg-white w-8 h-3"
                : "bg-white/50 w-3 h-3 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Top Navigation Controls (Language & Audio) */}
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
