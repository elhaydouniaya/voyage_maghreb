"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Lock, ArrowLeft } from "lucide-react";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur.");
        return;
      }
      router.push("/login?registered=true&email=" + encodeURIComponent(email));
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

  if (!email || !token) {
    return (
      <p className="text-red-600 font-bold text-sm">
        Lien invalide.{" "}
        <Link href="/forgot-password" className="text-orange-600 underline">
          Demander un nouveau lien
        </Link>
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Nouveau mot de passe"
          className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-100 bg-[#F8FAFC] font-medium"
        />
      </div>
      <div className="relative">
        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
        <input
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirmer le mot de passe"
          className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-100 bg-[#F8FAFC] font-medium"
        />
      </div>
      {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50"
      >
        {loading ? "Enregistrement..." : "Réinitialiser"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 font-outfit">
      <div className="w-full max-w-md bg-white rounded-[2rem] border border-gray-100 shadow-xl p-10">
        <Link href="/login" className="inline-flex items-center gap-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-8 hover:text-orange-600">
          <ArrowLeft size={14} /> Retour connexion
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white">
            <Globe size={20} />
          </div>
          <h1 className="text-2xl font-black text-[#0F172A]">Nouveau mot de passe</h1>
        </div>
        <Suspense fallback={<p className="text-gray-400">Chargement...</p>}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}
