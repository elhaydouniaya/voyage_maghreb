"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Building2, X, Mail, Lock, Eye, EyeOff, ArrowRight, Shield } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";
import { DemoAccountsBox } from "@/components/auth/DemoAccountsBox";

export default function AgencyLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "AGENCY") {
      router.replace("/agency/dashboard");
    }
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.replace("/admin/dashboard");
    }
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const outcome = await loginWithFreshSession(email, password, { requiredRole: "AGENCY" });
      if (!outcome.ok) setError(outcome.error);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 font-outfit overflow-y-auto z-50">
      {/* Fond navy animé */}
      <div className="absolute inset-0 bg-[#0F172A]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0F172A]" />
        <div className="absolute top-20 -left-40 w-96 h-96 bg-orange-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-32 w-80 h-80 bg-orange-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-500/3 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-5" preserveAspectRatio="none">
          <defs>
            <pattern id="grid-agency" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#EA580C" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-agency)" />
        </svg>
      </div>

      {/* Carte */}
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/40 w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-5 right-5 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Fermer"
          type="button"
        >
          <X size={20} className="text-gray-400" />
        </button>

        {/* En-tête navy */}
        <div className="bg-[#0F172A] px-8 py-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-600/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <Link href="/" className="group inline-block">
              <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-600/30 group-hover:scale-105 transition-transform duration-200">
                <Building2 size={26} className="text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                Maghreb<span className="text-orange-500">Voyage</span>
              </h1>
            </Link>
            <div className="mt-3 inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 border border-white/10">
              <Shield size={11} className="text-orange-400" />
              <span className="text-gray-300 text-[11px] font-black uppercase tracking-widest">
                Espace Professionnel Agences
              </span>
            </div>
          </div>
        </div>

        {/* Badge partenaire */}
        <div className="mx-6 -mt-3 relative z-10">
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <Shield size={14} className="text-orange-600 shrink-0" />
            <p className="text-[11px] font-bold text-orange-700">
              Réservé aux agences partenaires validées par MaghrebVoyage
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="p-7 md:p-8 pt-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 mb-5 text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top duration-200">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center shrink-0 text-red-600 text-xs font-black">!</div>
              <div>
                {error}
                {error.toLowerCase().includes("voyageur") && (
                  <Link href="/agency/register" className="block mt-1 text-orange-600 font-black hover:underline text-xs">
                    Devenir partenaire →
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                Email professionnel
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@votre-agence.com"
                  autoComplete="email"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent font-semibold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">
                  Mot de passe
                </label>
                <Link href="/forgot-password" className="text-[11px] font-bold text-orange-600 hover:underline">
                  Oublié ?
                </Link>
              </div>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-[#0F172A] focus:border-transparent font-semibold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Masquer" : "Afficher"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#0F172A] text-white font-black py-3.5 rounded-xl hover:bg-[#1E293B] transition-all disabled:opacity-50 mt-2 text-sm uppercase tracking-widest shadow-xl shadow-gray-900/20 flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="animate-pulse">Connexion en cours…</span>
              ) : (
                <>
                  Accéder au dashboard <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-gray-100 space-y-4">
            <p className="text-center text-sm text-gray-500 font-semibold">
              Pas encore partenaire ?{" "}
              <Link href="/agency/register" className="text-orange-600 font-black hover:text-orange-700 transition-colors">
                Créer un compte agence
              </Link>
            </p>

            <DemoAccountsBox portal="agency" />

            <Link
              href="/login"
              className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-[#0F172A] transition-colors block text-center"
            >
              ← Portail Voyageur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
