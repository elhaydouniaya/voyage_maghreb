"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  ShieldAlert,
  Briefcase,
  MapPin,
  Eye,
  Loader2,
} from "lucide-react";

type AdminTrip = {
  id: string;
  slug: string;
  agency: string;
  title: string;
  status: string;
  price: string;
  destination: string;
};

const STATUS_LABELS: Record<string, string> = {
  PUBLISHED: "Publié",
  DRAFT: "Brouillon",
  FULL: "Complet",
  CLOSED: "Fermé",
  CANCELLED: "Annulé",
};

export default function AdminTripsPage() {
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/trips", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Chargement impossible.");
        return;
      }
      setTrips(data.trips || []);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/trips/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Mise à jour impossible.");
        return;
      }
      setTrips((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
      );
    } catch {
      alert("Erreur réseau.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = trips.filter((t) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      t.title.toLowerCase().includes(q) ||
      t.agency.toLowerCase().includes(q) ||
      t.destination.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
              Modération des voyages
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Catalogue en direct depuis la base de données
            </p>
          </div>
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Voyage, agence, pays..."
              className="bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold w-64 shadow-sm outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm font-bold">
            {error}
          </div>
        )}

        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-24 text-gray-400">
              <Loader2 className="animate-spin" size={24} />
              <span className="text-xs font-black uppercase tracking-widest">
                Chargement...
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center text-gray-400 text-sm font-bold">
              Aucun voyage trouvé.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-gray-50">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Voyage / Agence
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Destination
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Statut
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Modération
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Prix
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((trip) => (
                  <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-8">
                      <p className="text-sm font-black text-[#0F172A]">{trip.title}</p>
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1">
                        Par {trip.agency}
                      </p>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                        <MapPin size={14} className="text-[#2563EB]" /> {trip.destination}
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          trip.status === "PUBLISHED" || trip.status === "FULL"
                            ? "bg-green-50 text-green-600 border border-green-100"
                            : trip.status === "DRAFT"
                              ? "bg-orange-50 text-orange-600 border border-orange-100"
                              : "bg-red-50 text-red-600 border border-red-100"
                        }`}
                      >
                        {STATUS_LABELS[trip.status] || trip.status}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex gap-2">
                        {updatingId === trip.id ? (
                          <Loader2 className="animate-spin text-gray-400" size={20} />
                        ) : (
                          <>
                            {trip.status !== "PUBLISHED" && trip.status !== "FULL" && (
                              <button
                                type="button"
                                onClick={() => updateStatus(trip.id, "PUBLISHED")}
                                className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                title="Publier"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                            )}
                            {(trip.status === "PUBLISHED" || trip.status === "FULL") && (
                              <button
                                type="button"
                                onClick={() => updateStatus(trip.id, "CANCELLED")}
                                className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                title="Retirer du catalogue"
                              >
                                <ShieldAlert size={18} />
                              </button>
                            )}
                            <Link
                              href={`/trip/${trip.slug}`}
                              className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:bg-orange-500 hover:text-white transition-all shadow-sm"
                              title="Voir le voyage"
                            >
                              <Eye size={18} />
                            </Link>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span className="text-base font-black text-[#0F172A]">
                        {trip.price}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
    </div>
  );
}
