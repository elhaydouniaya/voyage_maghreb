"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Shield, X } from "lucide-react";
import { loginWithFreshSession } from "@/lib/login-client";
import { DemoAccountsBox } from "@/components/auth/DemoAccountsBox";

export default function AdminLoginPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      router.replace("/admin/dashboard");
    }
  }, [status, session, router]);

  const handleBackdropClick = (e: React.MouseEvent) => {
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
      const outcome = await loginWithFreshSession(email, password, {
        requiredRole: "ADMIN",
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

  return (
    <div
      id="backdrop-container"
      className="fixed inset-0 bg-[#0F172A] flex items-center justify-center p-6 font-outfit overflow-y-auto z-50"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 -left-40 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 -right-32 w-80 h-80 bg-orange-600/5 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div
        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md border border-gray-100 overflow-hidden relative my-8 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#0F172A] px-8 py-12 text-white text-center relative overflow-hidden">
          <button
            onClick={() => router.push("/")}
            className="absolute top-6 right-6 z-20 p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Fermer"
            type="button"
          >
            <X size={24} className="text-gray-400 hover:text-white" />
          </button>

          <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl shadow-orange-600/30">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight mb-2">
            Maghreb<span className="text-orange-500">Voyage</span>
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest text-orange-500">
            Espace Administration
          </p>
        </div>

        <div className="p-10">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-2xl p-4 mb-8 text-xs font-bold flex items-center gap-2">
              <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                ✕
              </span>{" "}
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Email administrateur
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@maghrebvoyage.com"
                className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:outline-none focus:ring-4 focus:ring-orange-500/10 font-bold text-[#0F172A] transition-all"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                Mot de passe
              </label>
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
              className="w-full bg-orange-600 text-white font-black py-5 rounded-full shadow-xl hover:bg-orange-700 transition-all disabled:opacity-50 mt-4 text-sm uppercase tracking-widest"
            >
              {isLoading ? "CONNEXION..." : "ACCÉDER AU PANEL"}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center space-y-4">
            <DemoAccountsBox portal="admin" />
            <Link
              href="/login"
              className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors block"
            >
              ← Retour espace voyageur
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
