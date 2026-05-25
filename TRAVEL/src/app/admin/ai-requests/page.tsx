"use client";

import { Fragment, useState, useEffect } from "react";
import { Search, MapPin, Users, Eye, Bot } from "lucide-react";

type AiRequest = {
  id: string;
  date: string;
  destination: string;
  travelers: number;
  budget: string;
  status: string;
  statusRaw?: string;
  statusLabel?: string;
  clientName: string;
  clientEmail: string;
  summary?: string | null;
};

const STATUS_FILTERS = [
  { id: "ALL", label: "Toutes" },
  { id: "MATCHED", label: "Avec match" },
  { id: "NO_MATCH", label: "Sans match" },
  { id: "NEW", label: "Nouvelles" },
  { id: "BOOKED", label: "Converties" },
] as const;

function statusBadgeClass(status: string) {
  if (status === "MATCHED") return "bg-green-50 text-green-600 border border-green-100";
  if (status === "BOOKED") return "bg-blue-50 text-blue-600 border border-blue-100";
  if (status === "NEW") return "bg-orange-50 text-orange-600 border border-orange-100";
  return "bg-red-50 text-red-600 border border-red-100";
}

function statusBadgeLabel(r: AiRequest) {
  if (r.statusLabel) return r.statusLabel;
  if (r.status === "MATCHED") return "Correspondance trouvée";
  if (r.status === "BOOKED") return "Réservation / paiement";
  if (r.status === "NEW") return "En attente IA";
  return "Aucun match";
}

export default function AdminAIRequestsPage() {
  const [requests, setRequests] = useState<AiRequest[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUS_FILTERS)[number]["id"]>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/ai-requests");
        if (res.ok) {
          const data = await res.json();
          setRequests(data.requests || []);
        }
      } catch {
        /* ignore */
      }
    }
    load();
  }, []);

  const filteredRequests = requests.filter((r) => {
    const q = search.toLowerCase();
    const matchesSearch =
      r.destination.toLowerCase().includes(q) ||
      r.clientEmail.toLowerCase().includes(q) ||
      r.clientName.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-3">
            <Bot className="text-orange-500" size={28} />
            Demandes du configurateur IA
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
            Suivi des intentions de voyage (chat + formulaire)
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                statusFilter === f.id
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-600/20"
                  : "bg-white border border-gray-100 text-gray-400 hover:text-orange-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <div className="mb-6 relative max-w-md">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          placeholder="Destination, client, email..."
          className="bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold w-full shadow-sm outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#F8FAFC] border-b border-gray-50">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Moment
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Demande client
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Statut IA
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Résumé
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Détails
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filteredRequests.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-8 py-16 text-center text-xs font-bold text-gray-400 uppercase tracking-widest"
                >
                  Aucune demande pour ce filtre
                </td>
              </tr>
            ) : (
              filteredRequests.map((r) => (
                <Fragment key={r.id}>
                  <tr className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-8 text-xs font-bold text-gray-400">
                      {r.date}
                    </td>
                    <td className="px-8 py-8">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm font-black text-[#0F172A]">
                          <MapPin size={14} className="text-orange-500" />{" "}
                          {r.destination}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          <span className="flex items-center gap-1">
                            <Users size={12} /> {r.travelers} pers.
                          </span>
                          <span>Budget: {r.budget}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 font-bold">
                          {r.clientName} · {r.clientEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-8 py-8">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusBadgeClass(r.status)}`}
                      >
                        {statusBadgeLabel(r)}
                      </span>
                      {r.statusRaw && (
                        <p className="text-[9px] text-gray-400 font-mono mt-2">
                          {r.statusRaw}
                        </p>
                      )}
                    </td>
                    <td className="px-8 py-8 text-xs font-bold text-gray-500 max-w-xs truncate">
                      {r.summary || "—"}
                    </td>
                    <td className="px-8 py-8">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(expandedId === r.id ? null : r.id)
                        }
                        className="p-3 bg-[#F8FAFC] border border-gray-100 rounded-xl text-gray-400 hover:text-orange-600 transition-all"
                        title="Voir le résumé IA"
                      >
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                  {expandedId === r.id && r.summary && (
                    <tr>
                      <td colSpan={5} className="px-8 pb-8">
                        <div className="bg-[#F8FAFC] rounded-2xl p-6 text-sm text-gray-600 leading-relaxed border border-gray-100">
                          <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2">
                            Synthèse IA
                          </p>
                          {r.summary}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
