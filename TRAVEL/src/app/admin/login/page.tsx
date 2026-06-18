"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Shield, X, Mail, Lock, Eye, EyeOff, ArrowRight, AlertTriangle } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";
import { DemoAccountsBox } from "@/components/auth/DemoAccountsBox";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.replace("/admin/dashboard");
    }
  }, [status, session, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const outcome = await loginWithFreshSession(email, password, { requiredRole: "ADMIN" });
      if (!outcome.ok) setError(outcome.error);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-6 font-outfit overflow-y-auto z-50"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "admin-backdrop") router.push("/");
      }}
      id="admin-backdrop"
    >
      {/* Fond sombre */}
      <div className="absolute inset-0 bg-[#0F172A]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#EA580C15,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_#EA580C08,_transparent_60%)]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" preserveAspectRatio="none">
          <defs>
            <pattern id="grid-admin" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-admin)" />
        </svg>
      </div>

      {/* Carte */}
      <div
        className="bg-white rounded-[2.5rem] shadow-2xl shadow-black/60 w-full max-w-md overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-300 my-8"
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

        {/* En-tête */}
        <div className="bg-[#0F172A] px-8 py-10 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_#EA580C20,_transparent_60%)]" />
          <div className="relative z-10">
            <Link href="/" className="group inline-block">
              <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-orange-600/40 group-hover:scale-105 transition-transform duration-200 ring-2 ring-orange-500/30">
                <Shield size={26} className="text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                Maghreb<span className="text-orange-500">Voyage</span>
              </h1>
            </Link>
            <div className="mt-3 inline-flex items-center gap-2 bg-orange-600/20 border border-orange-500/30 rounded-full px-4 py-1.5">
              <Shield size={11} className="text-orange-400" />
              <span className="text-orange-300 text-[11px] font-black uppercase tracking-widest">
                Espace Administration
              </span>
            </div>
          </div>
        </div>

        {/* Alerte accès restreint */}
        <div className="mx-6 -mt-3 relative z-10">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2.5">
            <AlertTriangle size={14} className="text-amber-600 shrink-0" />
            <p className="text-[11px] font-bold text-amber-700">
              Accès strictement réservé aux administrateurs système
            </p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="p-7 md:p-8 pt-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3.5 mb-5 text-sm font-semibold flex items-center gap-3 animate-in slide-in-from-top duration-200">
              <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center shrink-0 text-red-600 text-xs font-black">!</div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                Email administrateur
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@maghrebvoyage.com"
                  autoComplete="email"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                  required
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div>
              <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                Mot de passe
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
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
              className="w-full bg-orange-600 text-white font-black py-3.5 rounded-xl hover:bg-orange-700 transition-all disabled:opacity-50 mt-2 text-sm uppercase tracking-widest shadow-xl shadow-orange-600/25 flex items-center justify-center gap-2 hover:-translate-y-0.5"
            >
              {isLoading ? (
                <span className="animate-pulse">Vérification…</span>
              ) : (
                <>
                  Accéder au panel <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 pt-6 border-t border-gray-100 space-y-4">
            <DemoAccountsBox portal="admin" />
            <Link
              href="/login"
              className="text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors block text-center"
            >
              ← Retour espace voyageur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
