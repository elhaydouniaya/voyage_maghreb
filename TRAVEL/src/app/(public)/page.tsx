"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import HeroAnimatedWidget from "@/components/public/HeroAnimatedWidget";
import { 
  ArrowRight, 
  MapPin, 
  ShieldCheck, 
  Zap, 
  Star, 
  CheckCircle2,
  Globe,
  CalendarDays,
  Lock,
  UserCheck,
  CreditCard,
  MessageCircle,
  ChevronDown,
  Sparkles,
  Bot,
  X,
  Calendar
} from "lucide-react";

import { NavbarAuth } from "@/components/auth/NavbarAuth";
import AIChatWidget from "@/components/ai/AIChatWidget";
import GuideTouristiqueIA from "@/components/ai/GuideTouristiqueIA";
import DestinationsSection from "@/components/public/DestinationsSection";
import MainNavbar from "@/components/layout/MainNavbar";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white font-outfit">
      {/* Navbar */}
      <MainNavbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-40 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-5 gap-12 items-center">
          <div className="lg:col-span-3 text-center lg:text-left z-10">
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-[#0F172A] mb-8 leading-[1.1]">
              Votre prochain <br />
              voyage au Maghreb, <br />
              <span className="text-orange-500 underline decoration-4 underline-offset-8">commence ici.</span>
            </h1>
            <p className="text-lg text-gray-500 mb-12 max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
              Des agences locales vérifiées, des expériences uniques, et un paiement 100% sécurisé.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start items-center mt-12">
               <Link 
                 href="/recherche"
                 className="w-full sm:w-auto bg-orange-600 text-white font-black px-12 py-6 rounded-[2rem] text-sm uppercase tracking-widest hover:bg-orange-700 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-orange-600/30 active:scale-95 group"
               >
                 Trouver mon voyage <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
               </Link>
               <Link 
                 href="/voyages"
                 className="w-full sm:w-auto bg-[#0F172A] text-white font-black px-12 py-6 rounded-[2rem] text-sm uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-4 shadow-2xl shadow-black/20"
               >
                 Voir les voyages <ArrowRight size={18} />
               </Link>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 mt-12 justify-center lg:justify-start">
               <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                  <span>Populaire :</span>
                  <Link href="/voyages?destination=Taghit" className="hover:text-orange-500 transition-colors">Taghit</Link>
                  <Link href="/voyages?destination=Marrakech" className="hover:text-orange-500 transition-colors">Marrakech</Link>
                  <Link href="/voyages?destination=Djerba" className="hover:text-orange-500 transition-colors">Djerba</Link>
               </div>
            </div>
          </div>

          <div className="lg:col-span-2 relative">
            <HeroAnimatedWidget />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-32 px-6 bg-white border-y border-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-4 tracking-tight">Comment ça marche</h2>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Votre voyage commence en 3 étapes simples</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Step 1 */}
            <div className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-gray-100 relative group hover:border-orange-500/20 transition-all duration-500">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm mb-8 font-black text-2xl group-hover:bg-orange-600 group-hover:text-white transition-all">1</div>
               <h3 className="text-2xl font-black text-[#0F172A] mb-4">Décrivez votre projet</h3>
               <p className="text-gray-500 font-medium leading-relaxed">Indiquez vos préférences, votre budget et vos dates via notre formulaire guidé intelligent.</p>
            </div>
            {/* Step 2 */}
            <div className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-gray-100 relative group hover:border-orange-500/20 transition-all duration-500">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm mb-8 font-black text-2xl group-hover:bg-orange-600 group-hover:text-white transition-all">2</div>
               <h3 className="text-2xl font-black text-[#0F172A] mb-4">L’IA trouve les pépites</h3>
               <p className="text-gray-500 font-medium leading-relaxed">Notre moteur IA croise votre demande avec les voyages réels postés par nos agences partenaires.</p>
            </div>
            {/* Step 3 */}
            <div className="bg-[#F8FAFC] p-12 rounded-[3.5rem] border border-gray-100 relative group hover:border-orange-500/20 transition-all duration-500">
               <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm mb-8 font-black text-2xl group-hover:bg-orange-600 group-hover:text-white transition-all">3</div>
               <h3 className="text-2xl font-black text-[#0F172A] mb-4">Réservez en ligne</h3>
               <p className="text-gray-500 font-medium leading-relaxed">Payez votre acompte via Stripe et recevez instantanément votre confirmation par email.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Trips */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-20">
            <div>
              <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] tracking-tight mb-4">Voyages à la une ✨</h2>
              <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Sélectionnés pour leur authenticité</p>
            </div>
            <Link href="/voyages" className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors flex items-center gap-3 bg-white px-8 py-4 rounded-full border border-gray-100 shadow-sm">
               Explorer tout <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                title: "Réveillon à Taghit 2025", 
                loc: "Taghit, Algérie", 
                price: "680", 
                left: "12 places",
                img: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=1000&auto=format&fit=crop",
                tag: "Désert",
                tagColor: "bg-orange-500",
                href: "/trip/reveillon-taghit-2025"
              },
              { 
                title: "Trésors du Maroc", 
                loc: "Marrakech & Fès", 
                price: "890", 
                left: "8 places",
                img: "https://images.unsplash.com/photo-1539020140153-e479b8c22e70?q=80&w=1000&auto=format&fit=crop",
                tag: "Culture",
                tagColor: "bg-[#0F172A]",
                href: "/trip/escapade-culturelle-marrakech"
              },
              { 
                title: "Atlas & Vallées Berbères", 
                loc: "Haut Atlas, Maroc", 
                price: "750", 
                left: "10 places",
                img: "https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?q=80&w=1000&auto=format&fit=crop",
                tag: "Aventure",
                tagColor: "bg-orange-600",
                href: "/trip/circuit-kasbahs"
              },
              { 
                title: "Évasion en Tunisie", 
                loc: "Djerba & Sud", 
                price: "560", 
                left: "15 places",
                img: "https://images.unsplash.com/photo-1549877452-9c387954fbc2?q=80&w=1000&auto=format&fit=crop",
                tag: "Détente",
                tagColor: "bg-[#10B981]",
                href: "/trip/sahara-oasis-4x4"
              },
            ].map((trip, i) => (
              <div key={i} className="group bg-white rounded-[3rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-700">
                <div className="relative aspect-[4/5] overflow-hidden">
                   <Image src={trip.img} alt={trip.title} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover transition-transform duration-[2000ms] group-hover:scale-110" />
                   <div className={`absolute top-6 left-6 ${trip.tagColor} text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-2xl`}>
                      {trip.tag}
                   </div>
                </div>
                <div className="p-8 space-y-6">
                   <div>
                      <h4 className="font-black text-[#0F172A] text-xl mb-1 tracking-tight group-hover:text-orange-600 transition-colors">{trip.title}</h4>
                      <div className="flex items-center gap-2 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                         <MapPin size={10} /> {trip.loc}
                      </div>
                   </div>
                   <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                      <div>
                         <div className="text-2xl font-black text-[#0F172A]">€{trip.price}</div>
                         <div className="text-[10px] text-orange-600 font-black uppercase tracking-widest">{trip.left} restantes</div>
                      </div>
                      <Link href={trip.href} className="w-12 h-12 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-[#0F172A] hover:bg-orange-600 hover:text-white transition-all shadow-sm">
                         <ArrowRight size={18} />
                      </Link>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Destinations Section */}
      <DestinationsSection />

      {/* Trust Section */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#0F172A] rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
             <div className="relative z-10 grid lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-8 text-center lg:text-left">
                   <h2 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight">Réservez en toute <span className="text-orange-500">confiance</span>.</h2>
                   <p className="text-gray-400 text-lg font-medium max-w-lg mx-auto lg:mx-0">Nous collaborons uniquement avec des agences locales vérifiées et expertes du terrain.</p>
                   
                   <div className="grid grid-cols-2 gap-8 pt-8">
                      <div className="space-y-4">
                         <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mx-auto lg:mx-0">
                            <ShieldCheck size={24} />
                         </div>
                         <h4 className="text-white font-black uppercase tracking-widest text-[10px]">Paiement Sécurisé</h4>
                         <p className="text-gray-500 text-xs">Vos transactions sont protégées par Stripe.</p>
                      </div>
                      <div className="space-y-4">
                         <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500 mx-auto lg:mx-0">
                            <CheckCircle2 size={24} />
                         </div>
                         <h4 className="text-white font-black uppercase tracking-widest text-[10px]">Agences Vérifiées</h4>
                         <p className="text-gray-500 text-xs">Chaque itinéraire est validé par nos experts.</p>
                      </div>
                   </div>
                </div>

                <div className="bg-white/5 backdrop-blur-3xl rounded-[3rem] border border-white/10 p-12 text-center space-y-8">
                   <div className="text-5xl font-black text-white tracking-tighter">4.9/5</div>
                   <div className="flex justify-center gap-1">
                      {[1,2,3,4,5].map(i => <Star key={i} size={20} className="fill-orange-500 text-orange-500" />)}
                   </div>
                   <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Note moyenne de nos voyageurs</p>
                   <div className="pt-8 border-t border-white/5 flex justify-center gap-6 opacity-30 grayscale brightness-200">
                      <Image src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" width={80} height={24} className="h-6 w-auto" alt="Stripe" unoptimized />
                      <Image src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" width={40} height={24} className="h-6 w-auto" alt="Mastercard" unoptimized />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black text-[#0F172A] mb-4 tracking-tight">Questions fréquentes</h2>
            <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-xs">Tout ce que vous devez savoir avant de partir</p>
          </div>

          <div className="space-y-6">
            {[
              { q: "Comment fonctionne l'assistant IA ?", a: "Notre assistant IA analyse vos préférences pour vous proposer les voyages les plus adaptés. Ce n'est pas un chat ouvert, mais un guide structuré vers votre réservation." },
              { q: "Les agences sont-elles vérifiées ?", a: "Oui, chaque agence sur MaghrebVoyage passe par un processus de vérification rigoureux (SIRET, licences, avis clients) avant de pouvoir publier." },
              { q: "Le paiement est-il sécurisé ?", a: "Absolument. Nous utilisons Stripe, le leader mondial du paiement, pour sécuriser vos transactions. Nous ne stockons jamais vos coordonnées bancaires." },
              { q: "Puis-je annuler ma réservation ?", a: "Chaque voyage a ses propres conditions d'annulation définies par l'agence. Vous pouvez les consulter sur la page détaillée du voyage." },
            ].map((faq, i) => (
              <div key={i} className="group bg-white rounded-[2.5rem] border border-gray-100 p-8 hover:border-orange-500/20 transition-all duration-500 shadow-sm hover:shadow-xl">
                 <h4 className="text-lg font-black text-[#0F172A] mb-4 flex justify-between items-center group-hover:text-orange-600 transition-colors">
                    {faq.q}
                    <ChevronDown size={18} className="text-gray-300 group-hover:rotate-180 transition-transform" />
                 </h4>
                 <p className="text-gray-500 font-medium leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Newsletter Section */}
      <section className="py-32 px-6 bg-[#0F172A] relative overflow-hidden">
         <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[150px] -translate-x-1/2 -translate-y-1/2" />
         <div className="max-w-4xl mx-auto relative z-10 text-center">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-8 tracking-tight">Rejoignez l'aventure. 📬</h2>
            <p className="text-gray-400 text-lg font-medium mb-12 max-w-2xl mx-auto">
               Inscrivez-vous pour recevoir nos meilleurs itinéraires et des offres exclusives directement dans votre boîte mail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
               <input 
                  type="email" 
                  placeholder="Votre email" 
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 transition-all font-medium"
               />
               <button className="bg-orange-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 whitespace-nowrap">
                  S'inscrire
               </button>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-8">Pas de spam, c'est promis. Désinscrivez-vous quand vous voulez.</p>
         </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-20 px-6 border-t border-gray-50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
                <Globe size={24} />
             </div>
             <span className="text-2xl font-black tracking-tight text-[#0F172A]">MaghrebVoyage</span>
          </div>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">
            © 2026 MaghrebVoyage — Fièrement construit pour l'aventure
          </p>
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-gray-400">
             <Link href="/legal/mentions" className="hover:text-orange-600 transition-colors">Mentions Légales</Link>
             <Link href="/legal/cgu" className="hover:text-orange-600 transition-colors">CGU</Link>
             <Link href="/legal/confidentialite" className="hover:text-orange-600 transition-colors">Confidentialité</Link>
             <Link href="/legal/remboursements" className="hover:text-orange-600 transition-colors">Remboursements</Link>
             <Link href="/about" className="hover:text-orange-600 transition-colors">À propos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
