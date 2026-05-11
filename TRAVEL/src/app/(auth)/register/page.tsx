"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, ArrowLeft, Mail, Lock, User, Sparkles } from "lucide-react";

export default function ClientRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

    // MOCK REGISTER
    setTimeout(() => {
      router.push("/login?registered=true");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-12 px-6 font-outfit">
      <div className="bg-white rounded-[3.5rem] shadow-2xl w-full max-w-lg border border-gray-100 overflow-hidden">
        <div className="bg-[#0F172A] p-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 rounded-full blur-3xl" />
          <Link href="/" className="inline-flex items-center gap-2 mb-8 hover:scale-105 transition-transform">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
               <Globe size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">MaghrebVoyage</span>
          </Link>
          <h1 className="text-3xl font-black tracking-tight mb-2">Créer un compte</h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Rejoignez l'aventure au Maghreb</p>
        </div>

        <div className="p-10 md:p-12">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 mb-8 text-xs font-bold flex items-center gap-2">
              <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center shrink-0">✕</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nom complet</label>
              <div className="relative">
                 <User className="absolute left-4 top-4 text-gray-300" size={18} />
                 <input 
                  type="text" 
                  required
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-12 pr-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
              <div className="relative">
                 <Mail className="absolute left-4 top-4 text-gray-300" size={18} />
                 <input 
                  type="email" 
                  required
                  placeholder="jean@email.com"
                  value={formData.email}
                  onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-12 pr-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mot de passe</label>
              <div className="relative">
                 <Lock className="absolute left-4 top-4 text-gray-300" size={18} />
                 <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-12 pr-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirmer le mot de passe</label>
              <div className="relative">
                 <Lock className="absolute left-4 top-4 text-gray-300" size={18} />
                 <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl pl-12 pr-6 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A] transition-all"
                 />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white font-black py-5 rounded-full shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition-all disabled:opacity-50 mt-4 text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isLoading ? "INSCRIPTION..." : <>Créer mon compte <Sparkles size={16} /></>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-50 text-center space-y-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-orange-600 hover:underline font-black">
                Se connecter
              </Link>
            </p>
            <div className="h-px bg-gray-50 w-full" />
            <Link href="/agency/register" className="text-[10px] text-gray-400 hover:text-orange-600 font-black uppercase tracking-widest transition-colors">
               Vous êtes une agence ? Créer un compte pro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
