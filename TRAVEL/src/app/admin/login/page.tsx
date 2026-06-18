"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ShieldCheck, Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";
import { DemoAccountsBox } from "@/components/auth/DemoAccountsBox";
import { AnimatedBackground } from "@/components/auth/AnimatedBackground";

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
    setError("");
    setIsLoading(true);
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
                  <ShieldCheck className="w-8 h-8 text-white" />
                </div>
              </Link>
              <h1 className="text-2xl font-bold text-orange-900 mb-1">
                Maghreb<span className="text-orange-600">Voyage</span>
              </h1>
              <p className="text-orange-700 text-sm">Espace Administration</p>
            </div>

            {/* Notice accès restreint */}
            <div className="bg-orange-100 border border-orange-300 rounded-lg p-4 mb-6 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-orange-900 font-semibold mb-1">Accès restreint</p>
                <p className="text-xs text-orange-700">
                  Réservé exclusivement aux administrateurs système MaghrebVoyage.
                </p>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3.5 mb-5 text-sm font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-orange-900">
                  Email administrateur
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@maghrebvoyage.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  className="flex h-9 w-full rounded-lg border border-orange-200 bg-white px-3 py-2 text-sm text-orange-900 shadow-xs placeholder:text-orange-300 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-orange-500/20 transition-shadow"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-orange-900">
                  Mot de passe
                </label>
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
                {isLoading ? "Vérification…" : "Accéder au panel admin"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-orange-200 space-y-4">
              <DemoAccountsBox portal="admin" />
              <Link
                href="/login"
                className="block text-center text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors"
              >
                ← Retour au portail Voyageur
              </Link>
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
