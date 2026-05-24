"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Users, Loader2, Mail, Calendar } from "lucide-react";

type AdminClient = {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  bookingsCount: number;
  travelRequestsCount: number;
  reviewsCount: number;
  favoritesCount: number;
  lastBooking: {
    trip: string;
    status: string;
    date: string;
  } | null;
};

function formatFrDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadClients = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/clients", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Chargement impossible.");
        return;
      }
      setClients(data.clients || []);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  const filtered = clients.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/dashboard"
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h3 className="text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-3">
              <Users className="text-orange-500" size={28} />
              Voyageurs
            </h3>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              {clients.length} compte{clients.length !== 1 ? "s" : ""} client
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-80">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            size={18}
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, email, téléphone..."
            className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-4 font-bold text-sm focus:ring-4 focus:ring-orange-500/10 outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-16 text-center">
          <Users className="mx-auto text-gray-200 mb-4" size={48} />
          <p className="text-gray-500 font-bold">Aucun voyageur trouvé.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 bg-[#F8FAFC]">
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Voyageur
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Inscription
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Activité
                  </th>
                  <th className="px-6 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Dernière réservation
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-gray-50 hover:bg-orange-50/30 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <p className="font-black text-[#0F172A]">{c.name}</p>
                      <p className="text-xs text-gray-500 font-bold flex items-center gap-1 mt-1">
                        <Mail size={12} />
                        {c.email}
                      </p>
                      {c.phone !== "—" && (
                        <p className="text-[10px] text-gray-400 mt-0.5">{c.phone}</p>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                        <Calendar size={12} />
                        {formatFrDate(c.registeredAt)}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex flex-wrap gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 px-3 py-1 rounded-full">
                          {c.bookingsCount} résa.
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-purple-50 text-purple-700 px-3 py-1 rounded-full">
                          {c.travelRequestsCount} IA
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                          {c.reviewsCount} avis
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      {c.lastBooking ? (
                        <div>
                          <p className="text-xs font-bold text-[#0F172A]">
                            {c.lastBooking.trip}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                            {formatFrDate(c.lastBooking.date)} · {c.lastBooking.status}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-bold">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
        Les réservations détaillées sont dans{" "}
        <Link href="/admin/bookings" className="text-orange-600 hover:underline">
          Réservations
        </Link>
        {" · "}
        Les demandes IA dans{" "}
        <Link href="/admin/ai-requests" className="text-orange-600 hover:underline">
          Demandes IA
        </Link>
      </p>
    </div>
  );
}
