"use client";

import { useState } from "react";
import Link from "next/link";
import { Globe, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur.");
        return;
      }
      setMessage(data.message);
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="text-2xl font-black text-[#0F172A]">Mot de passe oublié</h1>
        </div>
        <p className="text-sm text-gray-500 mb-8">
          Entrez votre email. Si un compte existe, vous recevrez un lien de réinitialisation.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
              className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-100 bg-[#F8FAFC] font-medium"
            />
          </div>
          {error && <p className="text-red-600 text-sm font-bold">{error}</p>}
          {message && <p className="text-green-700 text-sm font-bold">{message}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {loading ? "Envoi..." : "Envoyer le lien"}
          </button>
        </form>
      </div>
    </div>
  );
}
