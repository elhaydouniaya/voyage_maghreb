"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Volume2, VolumeX, Play, Languages, Sparkles } from "lucide-react";
import { COUNTRY_IMAGES } from "@/lib/images";

const HERO_IMAGE = COUNTRY_IMAGES.MAROC[0];

const LANGUAGES = {
  fr: {
    name: "Français",
    code: "fr-FR",
    text: "Bienvenue sur Maghreb Voyage, votre porte d'entrée vers des destinations inoubliables.",
    label: "Bienvenue sur MaghrebVoyage",
  },
  en: {
    name: "English",
    code: "en-US",
    text: "Welcome to Maghreb Voyage, your gateway to unforgettable destinations.",
    label: "Welcome to MaghrebVoyage",
  },
  ar: {
    name: "العربية",
    code: "ar-SA",
    text: "مرحبًا بكم في ماغريب فوياج، حيث تبدأ أجمل الرحلات",
    label: "مرحبًا بكم في ماغريب فوياج",
  },
} as const;

type LangKey = keyof typeof LANGUAGES;

export default function HeroAnimatedWidget() {
  const [lang, setLang] = useState<LangKey>("fr");
  const [hasSpoken, setHasSpoken] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [speechOk, setSpeechOk] = useState(false);

  useEffect(() => {
    setSpeechOk(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const speak = (forceLang?: LangKey) => {
    if (!speechOk) return;

    const currentLang = forceLang || lang;
    const text = LANGUAGES[currentLang].text;

    try {
      window.speechSynthesis.cancel();
    } catch {
      /* ignore */
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = LANGUAGES[currentLang].code;
    utter.rate = 0.9;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);

    const voices = window.speechSynthesis.getVoices();
    const prefix = LANGUAGES[currentLang].code.split("-")[0];
    const voice =
      voices.find((v) => v.lang === LANGUAGES[currentLang].code) ||
      voices.find((v) => v.lang.startsWith(prefix)) ||
      voices[0];
    if (voice) utter.voice = voice;

    window.speechSynthesis.speak(utter);
    setHasSpoken(true);
  };

  const toggleMute = () => {
    if (speaking && speechOk) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    } else {
      speak();
    }
  };

  const changeLanguage = (newLang: LangKey) => {
    setLang(newLang);
    setShowLangMenu(false);
    speak(newLang);
  };

  useEffect(() => {
    if (!speechOk) return;

    const loadVoices = () => window.speechSynthesis.getVoices();
    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    const timer = setTimeout(() => {
      if (!hasSpoken) speak();
    }, 2000);

    return () => {
      clearTimeout(timer);
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechOk]);

  return (
    <div
      className="relative aspect-[4/5] rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white group bg-[#0F172A]"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMousePos({ x: 0, y: 0 })}
    >
      <div
        className="absolute inset-0 transition-transform duration-500 ease-out hero-ken-burns-wrap"
        style={{
          transform: `scale(1.12) translate(${mousePos.x * 24}px, ${mousePos.y * 24}px)`,
        }}
      >
        <Image
          src={HERO_IMAGE}
          alt="Maghreb"
          fill
          sizes="(max-width: 1024px) 100vw, 40vw"
          className="object-cover hero-ken-burns"
          priority
        />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none opacity-30 hero-shimmer-layer" />

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 z-10" />

      <div className="absolute inset-0 z-10 pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/20 rounded-full blur-[1px] hero-particle"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${(i * 17) % 100}%`,
              top: `${(i * 23) % 100}%`,
              animationDuration: `${18 + (i % 8)}s`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      {speaking && (
        <div className="absolute bottom-10 right-10 z-20 flex gap-1.5 items-end h-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-1 bg-white/80 rounded-full hero-sound-bar"
              style={{ animationDelay: `${i * 0.08}s` }}
            />
          ))}
        </div>
      )}

      <Link
        href="/recherche?mode=chat"
        className="absolute bottom-8 left-8 z-30 flex items-center gap-2 bg-orange-600/90 hover:bg-orange-600 backdrop-blur-md text-white font-black px-5 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl transition-all"
      >
        <Sparkles size={14} /> Matching IA
      </Link>

      <div className="absolute top-10 right-10 z-30 flex gap-4">
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-orange-600 transition-all shadow-2xl active:scale-95"
            aria-label="Changer de langue"
          >
            <Languages size={24} />
          </button>

          {showLangMenu && (
            <div className="absolute top-16 right-0 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl overflow-hidden min-w-[180px] border border-gray-100">
              {(Object.keys(LANGUAGES) as LangKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => changeLanguage(key)}
                  className={`w-full px-6 py-4 text-left text-xs font-black uppercase tracking-widest transition-all hover:bg-orange-600 hover:text-white ${
                    lang === key ? "text-orange-600 bg-orange-50" : "text-gray-900"
                  }`}
                >
                  {LANGUAGES[key].name}
                </button>
              ))}
            </div>
          )}
        </div>

        {speechOk && (
          <button
            type="button"
            onClick={toggleMute}
            className={`w-14 h-14 rounded-2xl border backdrop-blur-xl flex items-center justify-center text-white transition-all shadow-2xl active:scale-95 ${
              speaking
                ? "bg-orange-600 border-orange-400"
                : "bg-black/40 border-white/10 hover:bg-black/60"
            }`}
            aria-label={speaking ? "Couper la voix" : "Écouter le message"}
          >
            {speaking ? (
              <Volume2 size={24} className="animate-pulse" />
            ) : (
              <VolumeX size={24} />
            )}
          </button>
        )}
      </div>

      {!hasSpoken && speechOk && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/25 backdrop-blur-[1px]">
          <button
            type="button"
            onClick={() => speak()}
            className="w-24 h-24 rounded-full bg-orange-600 flex items-center justify-center shadow-[0_0_60px_rgba(234,88,12,0.4)] hover:scale-110 transition-transform"
            aria-label="Lire le message de bienvenue"
          >
            <Play size={36} className="text-white ml-2" />
          </button>
        </div>
      )}
    </div>
  );
}
