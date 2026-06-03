"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Globe, X } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";
import { DemoAccountsBox } from "@/components/auth/DemoAccountsBox";

export default function AgencyLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "AGENCY") {
      window.location.href = "/agency/dashboard";
    }
  }, [status, session]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const outcome = await loginWithFreshSession(email, password, {
        requiredRole: "AGENCY",
      });
      if (!outcome.ok) {
        setError(outcome.error);
      }
    } catch (err) {
      setError("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-white flex items-center justify-center p-6 font-outfit overflow-y-auto z-50">
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

          <Link href="/" className="group cursor-pointer inline-block">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-orange-600/30 group-hover:scale-105 transition-transform">
              <Globe size={32} />
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2 text-white">Maghreb<span className="text-orange-500">Voyage</span></h1>
          </Link>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest text-orange-500">Espace Professionnel Agences</p>
        </div>

        <div className="p-10">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 mb-8 text-xs font-bold">
              <p className="flex items-center gap-2">
                <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  ✕
                </span>
                {error}
              </p>
              {error.includes("voyageur") && (
                <Link
                  href="/agency/register"
                  className="mt-3 inline-block text-orange-600 underline underline-offset-2"
                >
                  Devenir partenaire →
                </Link>
              )}
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

            <DemoAccountsBox portal="agency" />

            <Link href="/login" className="text-[10px] font-black text-gray-300 uppercase tracking-widest hover:text-[#0F172A] transition-colors block pt-2">
              ← Retour au portail Voyageur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
