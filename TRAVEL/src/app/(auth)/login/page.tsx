"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe } from "lucide-react";

import { signIn } from "next-auth/react";

export default function ClientLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Identifiants incorrects.");
      } else {
        // Role-based redirect for demo
        if (email === "admin@maghrebvoyage.com") {
          window.location.href = "/admin/dashboard";
        } else if (email === "agency@test.com") {
          window.location.href = "/agency/dashboard";
        } else {
          window.location.href = "/profile";
        }
      }
    } catch (err) {
      setError("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleAuth() {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/" });
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-outfit">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden">
        <div className="bg-[#0F172A] px-8 py-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-orange-600/30 hover:scale-105 transition-transform cursor-pointer">
               <Globe size={32} />
            </div>
          </Link>
          <h1 className="text-3xl font-black tracking-tight mb-2">Maghreb<span className="text-orange-500">Voyage</span></h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Espace Voyageur</p>
        </div>

        <div className="p-10">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 mb-8 text-xs font-bold flex items-center gap-2">
              <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">✕</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-orange-500/10 font-bold text-[#0F172A] transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex justify-between">
                <span>Mot de passe</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-orange-500/10 font-bold text-[#0F172A] transition-all"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange-600 text-white font-black py-5 rounded-full shadow-xl shadow-orange-600/20 hover:bg-orange-700 transition-all disabled:opacity-50 mt-4 text-sm uppercase tracking-widest"
            >
              {isLoading ? "CONNEXION..." : "SE CONNECTER"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center space-y-6">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-orange-600 hover:underline font-black transition-colors">
                S'inscrire gratuitement
              </Link>
            </p>
            
            <div className="bg-orange-50 border border-orange-100 p-6 rounded-3xl text-center">
              <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Accès Démo Voyageur</p>
              <p className="text-xs font-bold text-[#0F172A]">client@test.com / client123</p>
            </div>

            <Link href="/agency/login" className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-[#0F172A] transition-colors block pt-2">
              Accès Agence Partenaire →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
