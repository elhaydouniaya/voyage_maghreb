"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Globe, X, Mail, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";
import { DemoAccountsBox } from "@/components/auth/DemoAccountsBox";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { useSession } from "next-auth/react";

function ClientLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirection si déjà connecté
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = session.user.role;
      if (role === "ADMIN") router.replace("/admin/dashboard");
      else if (role === "AGENCY") router.replace("/agency/dashboard");
      else {
        const cb = searchParams.get("callbackUrl");
        router.replace(cb && cb.startsWith("/") ? cb : "/profile");
      }
    }
  }, [status, session, router, searchParams]);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage("Compte créé avec succès. Connectez-vous avec votre email et mot de passe.");
      const prefill = searchParams.get("email");
      if (prefill) setEmail(prefill);
    }
    if (searchParams.get("error") === "google_role") {
      setError("Ce compte est agence ou admin. Utilisez la connexion email sur la page dédiée.");
    }
  }, [searchParams]);

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
      const outcome = await loginWithFreshSession(email, password, { requiredRole: "CLIENT" });
      if (!outcome.ok) setError(outcome.error);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-white flex items-center justify-center p-4 font-outfit overflow-hidden"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "backdrop") router.push("/");
      }}
      id="backdrop"
    >
      {/* Fond animé */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/40 to-white" />
        <div className="absolute top-20 -left-40 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl animate-pulse delay-500" />
        <svg className="absolute inset-0 w-full h-full opacity-5" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#EA580C" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Carte modale */}
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-10 border border-gray-100 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-5 right-5 z-20 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label="Fermer"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {/* En-tête */}
        <div className="bg-gradient-to-br from-orange-600 via-orange-600 to-orange-700 px-8 py-10 text-white text-center relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <Link href="/" className="group inline-block">
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl group-hover:scale-105 transition-transform duration-200">
                <Globe size={28} className="text-orange-600" />
              </div>
              <h1 className="text-2xl font-black tracking-tight">
                Maghreb<span className="text-orange-200">Voyage</span>
              </h1>
            </Link>
            <div className="mt-3 inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 bg-orange-300 rounded-full animate-pulse" />
              <span className="text-orange-100 text-[11px] font-black uppercase tracking-widest">
                Espace Voyageur
              </span>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="p-7 md:p-8 overflow-y-auto flex-1">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-3.5 mb-5 text-sm font-semibold flex items-center gap-3">
              <CheckCircle2 size={18} className="text-green-600 shrink-0" />
              {successMessage}
            </div>
          )}

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
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  autoComplete="email"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
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
                  Mot de passe oublié ?
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
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold text-gray-900 transition-all placeholder:text-gray-300 text-sm"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Bouton connexion */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white font-black py-3.5 rounded-xl shadow-lg shadow-orange-600/25 hover:shadow-xl hover:shadow-orange-600/35 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:translate-y-0 mt-2 text-sm uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span className="animate-pulse">Connexion en cours…</span>
              ) : (
                <>
                  Se connecter <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* OAuth */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-[11px] text-gray-400 font-bold">OU</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <GoogleSignInButton callbackUrl="/profile" />

          {/* Inscription */}
          <p className="text-center text-sm text-gray-500 font-semibold mt-5 mb-4">
            Pas encore de compte ?{" "}
            <Link href="/register" className="text-orange-600 font-black hover:text-orange-700 transition-colors">
              S'inscrire gratuitement
            </Link>
          </p>

          <DemoAccountsBox
            portal="client"
            onSelectAccount={(account) => {
              setEmail(account.email);
              setPassword(account.password);
              setError("");
            }}
          />

          {/* Liens portails */}
          <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col items-center gap-2">
            <Link
              href="/agency/login"
              className="text-[11px] font-black text-gray-500 uppercase tracking-widest hover:text-orange-600 transition-colors inline-flex items-center gap-1.5"
            >
              Accès Agence Partenaire <ArrowRight size={12} />
            </Link>
            <Link
              href="/admin/login"
              className="text-[10px] font-bold text-gray-300 uppercase tracking-widest hover:text-gray-500 transition-colors"
            >
              Administration
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 bg-white flex items-center justify-center font-outfit">
          <div className="w-12 h-12 bg-orange-600 rounded-xl animate-pulse flex items-center justify-center">
            <Globe size={24} className="text-white" />
          </div>
        </div>
      }
    >
      <ClientLoginForm />
    </Suspense>
  );
}
