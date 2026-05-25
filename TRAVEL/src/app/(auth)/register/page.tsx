"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, X, Mail, Lock, User, Eye, EyeOff, CheckCircle2, Phone } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!formData.name.trim()) {
      setError("Le nom est requis.");
      setIsLoading(false);
      return;
    }

    if (!formData.email.trim()) {
      setError("L'email est requis.");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setIsLoading(false);
      return;
    }

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

      if (!res.ok) {
        setError(data.error || "Inscription impossible.");
        setIsLoading(false);
        return;
      }

      const loginOutcome = await loginWithFreshSession(
        formData.email.trim(),
        formData.password,
        { requiredRole: "CLIENT" }
      );

      if (!loginOutcome.ok) {
        router.push(
          `/login?registered=true&email=${encodeURIComponent(formData.email.trim())}`
        );
      }
      /* succès : redirection automatique vers /profile */
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
      setIsLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking on the backdrop container, not on the modal
    const target = e.target as HTMLElement;
    if (target.id === "backdrop-container") {
      router.push("/");
    }
  };

  const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <div
      id="backdrop-container"
      className="fixed inset-0 bg-white flex items-center justify-center p-4 font-outfit min-h-screen overflow-hidden"
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
          onClick={() => router.push("/")}
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
            <p className="text-orange-100 text-xs font-bold uppercase tracking-widest">Créer un compte</p>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-8 md:p-10 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm font-bold flex items-center gap-3 animate-in slide-in-from-top">
              <span className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                !
              </span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Nom complet
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  required
                  placeholder="Jean Dupont"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold text-gray-900 transition-all"
                />
              </div>
            </div>

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
                  required
                  placeholder="jean@email.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold text-gray-900 transition-all"
                />
              </div>
            </div>

            {/* Phone Field */}
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Téléphone <span className="text-gray-400 font-bold normal-case">(optionnel)</span>
              </label>
              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold text-gray-900 transition-all"
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
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent font-semibold text-gray-900 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Au moins 8 caractères</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  className={`w-full bg-gray-50 border-2 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:ring-2 focus:border-transparent font-semibold text-gray-900 transition-all ${
                    formData.confirmPassword
                      ? passwordsMatch
                        ? "border-green-200 focus:ring-green-500"
                        : "border-red-200 focus:ring-red-500"
                      : "border-gray-200 focus:ring-orange-500"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                {formData.confirmPassword && passwordsMatch && (
                  <CheckCircle2 className="absolute right-12 top-1/2 transform -translate-y-1/2 text-green-500" size={18} />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-700 text-white font-black py-3 rounded-xl shadow-lg shadow-orange-600/30 hover:shadow-xl hover:shadow-orange-600/40 hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 mt-6 uppercase tracking-widest text-sm"
            >
              {isLoading ? "Inscription..." : "Créer mon compte"}
            </button>
          </form>

          <div className="my-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs text-gray-400 font-bold">OU</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <GoogleSignInButton callbackUrl="/profile" />
          </div>

          {/* Login Link */}
          <p className="text-center text-sm text-gray-600 font-semibold mb-6">
            Vous avez déjà un compte?{" "}
            <Link
              href="/login"
              className="text-orange-600 font-black hover:text-orange-700 transition-colors"
            >
              Se connecter
            </Link>
          </p>

          {/* Agency Link */}
          <div className="pt-6 border-t border-gray-200 text-center">
            <Link
              href="/agency/register"
              className="text-xs font-black text-gray-500 uppercase tracking-widest hover:text-orange-600 transition-colors"
            >
              Vous êtes une agence? Créer un compte pro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
