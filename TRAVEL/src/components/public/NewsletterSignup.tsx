"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage" }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Erreur lors de l'inscription.");
        return;
      }

      setStatus("ok");
      setMessage("Merci ! Vérifiez votre boîte mail.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Erreur réseau. Réessayez.");
    }
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Votre email"
          disabled={status === "loading"}
          className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 transition-all font-medium disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-orange-600 text-white font-black px-8 py-4 rounded-2xl hover:bg-orange-700 transition-all shadow-xl shadow-orange-600/20 whitespace-nowrap disabled:opacity-70 flex items-center justify-center gap-2 min-w-[140px]"
        >
          {status === "loading" ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Envoi...
            </>
          ) : (
            "S'inscrire"
          )}
        </button>
      </form>
      {message && (
        <p
          className={`text-sm font-bold mt-4 ${
            status === "ok" ? "text-green-400" : "text-red-400"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
