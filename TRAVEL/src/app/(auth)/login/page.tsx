"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Globe, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";
import { DemoAccountsBox } from "@/components/auth/DemoAccountsBox";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AnimatedBackground } from "@/components/auth/AnimatedBackground";
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
    if (!email || !password) { setError("Veuillez remplir tous les champs."); return; }
    setIsLoading(true);
    setError("");
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
      className="min-h-screen w-full relative overflow-hidden bg-[#fef3e2] font-outfit"
      onClick={() => router.push("/")}
    >
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <div className="bg-white/80 backdrop-blur-xl border border-orange-200 rounded-2xl shadow-2xl p-8">

            {/* En-tête */}
            <div className="flex flex-col items-center mb-8">
              <Link href="/" className="group">
                <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform duration-200">
                  <Globe className="w-8 h-8 text-white" />
                </div>
              </Link>
              <h1 className="text-2xl font-bold text-orange-900 mb-1">
                Maghreb<span className="text-orange-600">Voyage</span>
              </h1>
              <p className="text-orange-700 text-sm">Espace Voyageur</p>
            </div>

            {successMessage && (
              <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3.5 mb-5 text-sm font-medium flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                {successMessage}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3.5 mb-5 text-sm font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-orange-900">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="vous@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="flex h-9 w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-orange-900 shadow-xs placeholder:text-orange-300 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-orange-500/20 transition-shadow"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-orange-900">
                    Mot de passe
                  </label>
                  <Link href="/forgot-password" className="text-xs text-orange-600 hover:text-orange-800 font-medium hover:underline">
                    Oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    className="flex h-9 w-full rounded-lg border border-orange-200 bg-white px-3 py-2 pr-10 text-sm text-orange-900 shadow-xs placeholder:text-orange-300 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-orange-500/20 transition-shadow"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-700 transition-colors"
                    aria-label={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full h-11 items-center justify-center rounded-lg bg-orange-600 px-8 text-sm font-medium text-white shadow-lg shadow-orange-900/30 hover:bg-orange-700 transition-colors disabled:pointer-events-none disabled:opacity-50"
              >
                {isLoading ? "Connexion en cours…" : "Se connecter"}
              </button>
            </form>

            {/* OAuth */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-orange-200" />
              <span className="text-xs text-orange-400 font-medium">OU</span>
              <div className="flex-1 h-px bg-orange-200" />
            </div>
            <GoogleSignInButton callbackUrl="/profile" />

            <div className="mt-6 pt-6 border-t border-orange-200 space-y-4">
              <p className="text-center text-sm text-orange-700">
                Pas encore de compte ?{" "}
                <Link href="/register" className="text-orange-600 hover:text-orange-800 font-semibold underline">
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

              <div className="flex justify-center gap-6 pt-1">
                <Link href="/agency/login" className="text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors">
                  Accès Agence →
                </Link>
                <Link href="/admin/login" className="text-xs text-orange-400 hover:text-orange-600 font-medium transition-colors">
                  Administration
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-xs text-orange-500">Protégé par un système de sécurité professionnel</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ClientLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fef3e2] flex items-center justify-center">
        <div className="w-12 h-12 bg-orange-600 rounded-xl animate-pulse" />
      </div>
    }>
      <ClientLoginForm />
    </Suspense>
  );
}
