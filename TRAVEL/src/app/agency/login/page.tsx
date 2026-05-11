"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe } from "lucide-react";
import { signIn } from "next-auth/react";

export default function AgencyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Identifiants agence incorrects.");
      } else {
        // Role-based redirect — read session after sign-in
        // agency@test.com logs in as AGENCY, others are rejected
        if (email === "agency@test.com") {
          router.push("/agency/dashboard");
        } else if (email === "admin@maghrebvoyage.com") {
          router.push("/admin/dashboard");
        } else if (email === "client@test.com") {
          setError("Ce compte n'est pas un compte agence. Utilisez l'espace voyageur.");
          setIsLoading(false);
          return;
        } else {
          router.push("/agency/dashboard");
        }
      }
    } catch (err) {
      setError("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
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
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest text-orange-500">Espace Professionnel Agences</p>
        </div>

        <div className="p-10">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 mb-8 text-xs font-bold flex items-center gap-2">
              <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">✕</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email professionnel</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="contact@votre-agence.com"
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-orange-500/10 font-bold text-[#0F172A] transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mot de passe</label>
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
              className="w-full bg-[#0F172A] text-white font-black py-5 rounded-full shadow-xl shadow-gray-200 hover:bg-black transition-all disabled:opacity-50 mt-4 text-sm uppercase tracking-widest"
            >
              {isLoading ? "CONNEXION PRO..." : "ACCÉDER AU DASHBOARD"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center space-y-6">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
              Pas encore partenaire ?{" "}
              <Link href="/agency/register" className="text-orange-600 hover:underline font-black transition-colors">
                Devenir partenaire
              </Link>
            </p>
            
            <div className="bg-[#0F172A] text-white p-6 rounded-3xl text-center shadow-xl shadow-gray-100">
              <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-1">Accès Démo Agence</p>
              <p className="text-xs font-bold">agency@test.com / agency123</p>
            </div>

            <Link href="/login" className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-[#0F172A] transition-colors block pt-2">
              ← Retour au portail Voyageur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
