"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Globe, X } from "lucide-react";
import { signIn } from "next-auth/react";

export default function AgencyLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking on the backdrop container, not on the modal
    const target = e.target as HTMLElement;
    if (target.id === "backdrop-container") {
      router.push("/");
    }
  };

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
    <div
      id="backdrop-container"
      className="fixed inset-0 bg-white flex items-center justify-center p-6 font-outfit overflow-y-auto z-50"
      onClick={handleBackdropClick}
    >
      {/* Animated Blurred Background */}
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

      <div 
        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden relative my-8 z-10 animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0F172A] px-8 py-12 text-white text-center relative overflow-hidden">
          {/* Close Button */}
          <button
            onClick={() => router.push("/")}
            className="absolute top-6 right-6 z-20 p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Fermer"
            type="button"
          >
            <X size={24} className="text-gray-400 hover:text-white" />
          </button>

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
