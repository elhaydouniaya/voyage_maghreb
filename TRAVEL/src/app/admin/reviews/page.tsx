"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";

type ReviewRow = {
  id: string;
  author: string;
  email: string | null;
  rating: number;
  title: string;
  destination: string;
  status: string;
  date: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Publié",
  REJECTED: "Refusé",
};

const FILTERS = [
  { value: "ALL", label: "Tous" },
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Publiés" },
  { value: "REJECTED", label: "Refusés" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [filter, setFilter] = useState("PENDING");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/reviews?status=${filter}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de charger les avis.");
        setReviews([]);
        return;
      }
      setReviews(data.reviews || []);
    } catch {
      setError("Erreur réseau.");
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const updateStatus = async (id: string, status: "APPROVED" | "REJECTED") => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Mise à jour impossible.");
        return;
      }
      await loadReviews();
    } catch {
      alert("Erreur réseau.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-10 pb-24">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <Link
          href="/admin/dashboard"
          className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 w-fit"
        >
          <ArrowLeft size={24} className="text-[#0F172A]" />
        </Link>
        <div>
          <h1 className="text-4xl font-black text-[#0F172A] tracking-tight">
            Modération des avis
          </h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">
            Validez ou refusez les témoignages clients
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f.value
                ? "bg-[#0F172A] text-white"
                : "bg-white border border-gray-100 text-gray-400 hover:text-[#0F172A]"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-red-600 text-sm font-bold bg-red-50 px-6 py-4 rounded-2xl">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-20 text-gray-400">
          <Loader2 className="animate-spin" size={32} />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-gray-100 p-16 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
          Aucun avis pour ce filtre
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      r.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-700"
                        : r.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {STATUS_LABELS[r.status] || r.status}
                  </span>
                  <span className="text-[10px] text-gray-400 font-bold">{r.date}</span>
                </div>
                <h3 className="text-xl font-black text-[#0F172A]">{r.title}</h3>
                <p className="text-sm text-gray-500">
                  {r.author}
                  {r.email ? ` · ${r.email}` : ""} · {r.destination}
                </p>
                <div className="flex items-center gap-1 text-amber-500">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
              </div>

              {r.status === "PENDING" && (
                <div className="flex gap-3 shrink-0">
                  <button
                    type="button"
                    disabled={updatingId === r.id}
                    onClick={() => updateStatus(r.id, "APPROVED")}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {updatingId === r.id ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Publier
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === r.id}
                    onClick={() => updateStatus(r.id, "REJECTED")}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-red-200 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-red-50 disabled:opacity-50"
                  >
                    <XCircle size={14} />
                    Refuser
                  </button>
                </div>
              )}

              {r.status !== "PENDING" && (
                <div className="flex items-center gap-2 text-gray-300 text-[10px] font-black uppercase tracking-widest">
                  <Clock size={14} />
                  Traité
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
