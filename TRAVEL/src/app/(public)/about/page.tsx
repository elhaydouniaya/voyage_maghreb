import Link from "next/link";
import { Globe, Heart, Shield, Users, ArrowLeft, Mail, Phone, MapPin } from "lucide-react";
import { NavbarAuth } from "@/components/auth/NavbarAuth";
import MainNavbar from "@/components/layout/MainNavbar";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white font-outfit">
      {/* Navbar */}
      <MainNavbar />

      <main className="pt-32 pb-20 px-6 max-w-5xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-orange-600 mb-12">
           <ArrowLeft size={14} /> Retour à l'accueil
        </Link>

        <section className="space-y-12">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-black text-[#0F172A] leading-tight">
              Redéfinir le voyage au <span className="text-orange-500">Maghreb</span>.
            </h1>
            <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-3xl">
              MaghrebVoyage est née d'une passion pour les paysages arides, les médinas millénaires et l'hospitalité légendaire de l'Afrique du Nord. Notre mission est de connecter les voyageurs du monde entier avec les meilleures agences locales vérifiées.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-12">
             <div className="p-10 bg-[#F8FAFC] rounded-[3rem] border border-gray-100 space-y-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                   <Shield size={24} />
                </div>
                <h3 className="text-xl font-black text-[#0F172A]">Confiance</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Chaque agence est rigoureusement sélectionnée pour garantir votre sécurité et la qualité de votre séjour.</p>
             </div>
             <div className="p-10 bg-[#F8FAFC] rounded-[3rem] border border-gray-100 space-y-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                   <Heart size={24} />
                </div>
                <h3 className="text-xl font-black text-[#0F172A]">Authenticité</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Nous privilégions les circuits qui favorisent l'économie locale et le respect des cultures ancestrales.</p>
             </div>
             <div className="p-10 bg-[#F8FAFC] rounded-[3rem] border border-gray-100 space-y-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-600 shadow-sm">
                   <Users size={24} />
                </div>
                <h3 className="text-xl font-black text-[#0F172A]">Communauté</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">MaghrebVoyage est avant tout une communauté de passionnés partageant leurs meilleures expériences.</p>
             </div>
          </div>

          <div className="pt-24 space-y-12">
             <h2 className="text-3xl font-black text-[#0F172A]">Nous contacter</h2>
             <div className="grid md:grid-cols-3 gap-12">
                <div className="flex gap-4">
                   <div className="shrink-0 w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                      <Mail size={18} />
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Email</div>
                      <div className="font-bold text-[#0F172A]">contact@maghrebvoyage.com</div>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="shrink-0 w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                      <Phone size={18} />
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Téléphone</div>
                      <div className="font-bold text-[#0F172A]">+213 (0) 555 12 34 56</div>
                   </div>
                </div>
                <div className="flex gap-4">
                   <div className="shrink-0 w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                      <MapPin size={18} />
                   </div>
                   <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Bureau</div>
                      <div className="font-bold text-[#0F172A]">Alger, Algérie</div>
                   </div>
                </div>
             </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0F172A] py-12 px-6 text-center mt-20">
         <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">
            © 2026 MaghrebVoyage — Fièrement construit pour l'aventure
         </p>
      </footer>
    </div>
  );
}
