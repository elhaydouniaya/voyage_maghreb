"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Globe, X, Mail, Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";
import { sanitizeCallbackUrl } from "@/lib/auth-redirect";
import { DemoAccountsBox } from "@/components/auth/DemoAccountsBox";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

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

  const callbackUrl = sanitizeCallbackUrl(
    searchParams.get("callbackUrl"),
    searchParams.get("guide") === "1" ? "/profile?tab=guide-ia" : "/"
  );
  const openGuideAfterLogin =
    !searchParams.get("callbackUrl") && searchParams.get("guide") === "1";

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "CLIENT") {
      window.location.href = callbackUrl;
    }
  }, [status, session, callbackUrl]);

  useEffect(() => {
    if (searchParams.get("registered") === "true") {
      setSuccessMessage(
        "Compte créé avec succès. Connectez-vous avec votre email et mot de passe."
      );
      const prefill = searchParams.get("email");
      if (prefill) setEmail(prefill);
    }
    if (searchParams.get("error") === "google_role") {
      setError(
        "Ce compte est agence ou admin. Utilisez la connexion email sur la page dédiée."
      );
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
      const outcome = await loginWithFreshSession(email, password, {
        requiredRole: "CLIENT",
        openGuide: openGuideAfterLogin,
        callbackUrl: searchParams.get("callbackUrl") || undefined,
      });
      if (!outcome.ok) {
        setError(outcome.error);
      }
    } catch {
      setError("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking on the backdrop container, not on the modal
    const target = e.target as HTMLElement;
    if (target.id === "backdrop-container") {
      router.push(callbackUrl);
    }
  };

  return (
    <div
      id="backdrop-container"
      className="fixed inset-0 bg-white flex items-center justify-center p-4 font-outfit overflow-hidden"
      onClick={handleBackdropClick}
    >
      {/* Animated Blurred Background - Similar to Home Page */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/40 to-white" />

        {/* Animated Blur Shapes */}
        <div className="absolute top-20 -left-40 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 -right-32 w-80 h-80 bg-blue-100/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl animate-pulse delay-500" />

        {/* Animated Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Modal Card */}
      <div 
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative overflow-hidden animate-in fade-in zoom-in-95 duration-300 z-10 border border-white/80 backdrop-blur-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => router.push(callbackUrl)}
          className="absolute top-6 right-6 z-10 p-2 hover:bg-gray-100 rounded-full transition-colors"
          title="Fermer"
        >
          <X size={24} className="text-gray-600" />
        </button>

        {/* Header with Gradient */}
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 px-8 py-12 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-orange-600 mx-auto mb-6 shadow-xl">
              <Globe size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-1">
              Maghreb<span className="text-orange-200">Voyage</span>
            </h1>
            <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">
              Espace Voyageur
            </p>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 md:p-10 overflow-y-auto flex-1 max-h-[calc(90vh-200px)]">
          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 mb-6 text-sm font-bold flex items-center gap-3">
              <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top">
              <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                !
              </span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Email
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold text-gray-900 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Mot de passe
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold text-gray-900 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-xs font-bold text-orange-600 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white font-black py-3 rounded-xl shadow-lg shadow-orange-600/30 hover:shadow-xl hover:shadow-orange-600/40 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 mt-6 uppercase tracking-widest text-sm"
            >
              {isLoading ? "Connexion en cours..." : "Se Connecter"}
            </button>
          </form>

          <div className="mt-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-bold">OU</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <GoogleSignInButton callbackUrl={callbackUrl} />
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-gray-600 font-semibold mb-6">
            Pas encore de compte?{" "}
            <Link
              href="/register"
              className="text-orange-600 font-black hover:text-orange-700 transition-colors"
            >
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

          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-3">
            <Link
              href="/agency/login"
              className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-orange-600 transition-colors inline-flex items-center gap-2"
            >
              Accès Agence Partenaire
              <span>→</span>
            </Link>
            <Link
              href="/admin/login"
              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors block"
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
          <p className="text-sm font-bold text-gray-500">Chargement...</p>
        </div>
      }
    >
      <ClientLoginForm />
    </Suspense>
  );
}
