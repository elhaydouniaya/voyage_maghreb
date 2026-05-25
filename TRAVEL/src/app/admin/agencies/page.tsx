"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Mail,
  Phone,
  Building2,
  Loader2,
} from "lucide-react";

type AgencyRow = {
  id: string;
  name: string;
  manager: string;
  email: string;
  phone: string;
  status: string;
  siret: string;
  trips: number;
};

const STATUS_LABELS: Record<string, string> = {
  VERIFIED: "Vérifiée",
  PENDING: "En attente",
  UNDER_REVIEW: "En revue",
  REJECTED: "Refusée",
  SUSPENDED: "Suspendue",
};

export default function AdminAgenciesPage() {
  const [agencies, setAgencies] = useState<AgencyRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAgencies = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/agencies", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de charger les agences.");
        setAgencies([]);
        return;
      }
      setAgencies(data.agencies || []);
    } catch {
      setError("Erreur réseau.");
      setAgencies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgencies();
  }, [loadAgencies]);

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/agencies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Mise à jour impossible.");
        return;
      }
      setAgencies((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
    } catch {
      alert("Erreur réseau.");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = agencies.filter((a) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.siret.toLowerCase().includes(q) ||
      a.manager.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
              Gestion des Partenaires
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Données en direct depuis la base — valider les nouvelles agences
            </p>
          </div>

          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Nom, SIRET, Email..."
              className="bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold w-64 shadow-sm outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        {error && (
          <div className="mb-8 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm font-bold">
            {error}
            {error.includes("administrateur") && (
              <span className="block mt-2 text-xs font-medium">
                Connectez-vous via{" "}
                <Link href="/admin/login" className="underline">
                  /admin/login
                </Link>{" "}
                (compte seed : admin@maghrebvoyage.com).
              </span>
            )}
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
              Aucune agence trouvée.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-gray-50">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Agence / Gérant
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    SIRET / Contact
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Statut
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Modérer
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Voyages
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((agency) => (
                  <tr
                    key={agency.id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-8 py-8">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#F8FAFC] rounded-2xl flex items-center justify-center text-[#0F172A] font-black text-xl border border-gray-100 shadow-sm">
                          {agency.name[0]}
                        </div>
                        <div>
                          <p className="text-base font-black text-[#0F172A]">
                            {agency.name}
                          </p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Building2 size={10} /> Gérant: {agency.manager}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <p className="text-xs font-black text-orange-600 mb-2 uppercase tracking-widest">
                        {agency.siret}
                      </p>
                      <div className="flex flex-col gap-1 text-[10px] text-gray-400 font-bold">
                        <span className="flex items-center gap-2">
                          <Mail size={12} /> {agency.email}
                        </span>
                        <span className="flex items-center gap-2">
                          <Phone size={12} /> {agency.phone}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          agency.status === "VERIFIED"
                            ? "bg-green-50 text-green-600 border border-green-100"
                            : agency.status === "PENDING" ||
                                agency.status === "UNDER_REVIEW"
                              ? "bg-orange-50 text-orange-600 border border-orange-100"
                              : agency.status === "REJECTED"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : "bg-gray-800 text-white"
                        }`}
                      >
                        {STATUS_LABELS[agency.status] || agency.status}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex gap-2">
                        {updatingId === agency.id ? (
                          <Loader2 className="animate-spin text-gray-400" size={20} />
                        ) : (
                          <>
                            {agency.status !== "VERIFIED" && (
                              <button
                                type="button"
                                onClick={() => updateStatus(agency.id, "VERIFIED")}
                                className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-green-500 hover:bg-green-500 hover:text-white transition-all shadow-sm"
                                title="Valider l'agence"
                              >
                                <CheckCircle2 size={18} />
                              </button>
                            )}
                            {agency.status === "VERIFIED" && (
                              <button
                                type="button"
                                onClick={() => updateStatus(agency.id, "SUSPENDED")}
                                className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-gray-800 hover:bg-gray-800 hover:text-white transition-all shadow-sm"
                                title="Suspendre l'agence"
                              >
                                <ShieldAlert size={18} />
                              </button>
                            )}
                            {(agency.status === "PENDING" ||
                              agency.status === "UNDER_REVIEW") && (
                              <button
                                type="button"
                                onClick={() => updateStatus(agency.id, "REJECTED")}
                                className="w-10 h-10 bg-white border border-gray-100 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                title="Rejeter"
                              >
                                <XCircle size={18} />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <div className="text-sm font-black text-[#0F172A]">
                        {agency.trips}
                      </div>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                        Publiés
                      </p>
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
