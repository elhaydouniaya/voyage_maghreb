"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, Eye, EyeOff, AlertCircle, CheckCircle2, User, Mail, Phone } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { AnimatedBackground } from "@/components/auth/AnimatedBackground";

export default function ClientRegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordsMatch =
    formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.name.trim()) { setError("Le nom est requis."); setIsLoading(false); return; }
    if (!formData.email.trim()) { setError("L'email est requis."); setIsLoading(false); return; }
    if (formData.password.length < 8) { setError("Le mot de passe doit contenir au moins 8 caractères."); setIsLoading(false); return; }
    if (formData.password !== formData.confirmPassword) { setError("Les mots de passe ne correspondent pas."); setIsLoading(false); return; }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || undefined,
          password: formData.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Inscription impossible."); setIsLoading(false); return; }

      const loginOutcome = await loginWithFreshSession(formData.email.trim(), formData.password, { requiredRole: "CLIENT" });
      if (!loginOutcome.ok) {
        router.push(`/login?registered=true&email=${encodeURIComponent(formData.email.trim())}`);
      }
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden bg-[#fef3e2] font-outfit"
      onClick={() => router.push("/")}
    >
      <AnimatedBackground />

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 py-8">
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
              <p className="text-orange-700 text-sm">Créer un compte Voyageur</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3.5 mb-5 text-sm font-medium flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nom */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-orange-900">Nom complet</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                  <input
                    id="name"
                    type="text"
                    placeholder="Votre nom complet"
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="flex h-9 w-full rounded-lg border border-orange-200 bg-white pl-9 pr-3 py-2 text-sm text-orange-900 shadow-xs placeholder:text-orange-300 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-orange-500/20 transition-shadow"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-sm font-medium text-orange-900">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                  <input
                    id="email"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    autoComplete="email"
                    required
                    className="flex h-9 w-full rounded-lg border border-orange-200 bg-white pl-9 pr-3 py-2 text-sm text-orange-900 shadow-xs placeholder:text-orange-300 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-orange-500/20 transition-shadow"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-sm font-medium text-orange-900">
                  Téléphone <span className="text-orange-400 font-normal text-xs">(optionnel)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400" />
                  <input
                    id="phone"
                    type="tel"
                    placeholder="+212 6 00 00 00 00"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    className="flex h-9 w-full rounded-lg border border-orange-200 bg-white pl-9 pr-3 py-2 text-sm text-orange-900 shadow-xs placeholder:text-orange-300 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-orange-500/20 transition-shadow"
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-orange-900">Mot de passe</label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    required
                    className="flex h-9 w-full rounded-lg border border-orange-200 bg-white px-3 py-2 pr-10 text-sm text-orange-900 shadow-xs placeholder:text-orange-300 focus-visible:border-orange-500 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-orange-500/20 transition-shadow"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-orange-500 hover:text-orange-700 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-orange-400">Au moins 8 caractères</p>
              </div>

              {/* Confirmer */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-orange-900">Confirmer le mot de passe</label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                    className={`flex h-9 w-full rounded-lg border bg-white px-3 py-2 pr-10 text-sm text-orange-900 shadow-xs placeholder:text-orange-300 focus-visible:outline-none focus-visible:ring-[3px] transition-shadow ${
                      formData.confirmPassword
                        ? passwordsMatch
                          ? "border-green-400 focus-visible:border-green-500 focus-visible:ring-green-500/20"
                          : "border-red-300 focus-visible:border-red-400 focus-visible:ring-red-400/20"
                        : "border-orange-200 focus-visible:border-orange-500 focus-visible:ring-orange-500/20"
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {formData.confirmPassword && passwordsMatch && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-orange-500 hover:text-orange-700 transition-colors">
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex w-full h-11 items-center justify-center rounded-lg bg-orange-600 px-8 text-sm font-medium text-white shadow-lg shadow-orange-900/30 hover:bg-orange-700 transition-colors disabled:pointer-events-none disabled:opacity-50 mt-2"
              >
                {isLoading ? "Inscription en cours…" : "Créer mon compte"}
              </button>
            </form>

            {/* OAuth */}
            <div className="my-5 flex items-center gap-3">
              <div className="flex-1 h-px bg-orange-200" />
              <span className="text-xs text-orange-400 font-medium">OU</span>
              <div className="flex-1 h-px bg-orange-200" />
            </div>
            <GoogleSignInButton callbackUrl="/profile" />

            <div className="mt-6 pt-6 border-t border-orange-200 space-y-3 text-center">
              <p className="text-sm text-orange-700">
                Déjà un compte ?{" "}
                <Link href="/login" className="text-orange-600 hover:text-orange-800 font-semibold underline">
                  Se connecter
                </Link>
              </p>
              <Link href="/agency/register" className="block text-xs text-orange-500 hover:text-orange-700 font-medium transition-colors">
                Vous êtes une agence ? Créer un compte pro →
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
