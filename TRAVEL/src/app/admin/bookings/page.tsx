"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2 } from "lucide-react";

type AdminBooking = {
  id: string;
  confirmationCode: string;
  agency: string;
  trip: string;
  client: string;
  status: string;
  date: string;
  amount: number;
  canRefund?: boolean;
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmée",
  PENDING_PAYMENT: "En attente",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
  NO_SHOW: "Absent",
};

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-green-50 text-green-600 border border-green-100",
  PENDING_PAYMENT: "bg-orange-50 text-orange-600 border border-orange-100",
  CANCELLED: "bg-red-50 text-red-600 border border-red-100",
  REFUNDED: "bg-purple-50 text-purple-600 border border-purple-100",
  NO_SHOW: "bg-gray-100 text-gray-600 border border-gray-200",
};

function formatFrDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("filter") === "refunds") {
      setStatusFilter("REFUNDS");
    }
  }, []);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/bookings", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Chargement impossible.");
        return;
      }
      setBookings(data.bookings || []);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const filtered = bookings.filter((b) => {
    const q = search.trim().toLowerCase();
    const matchesSearch =
      !q ||
      b.client.toLowerCase().includes(q) ||
      b.agency.toLowerCase().includes(q) ||
      b.trip.toLowerCase().includes(q) ||
      b.confirmationCode.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "REFUNDS" && b.status === "CANCELLED") ||
      b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleResendEmail = async (id: string) => {
    setResendingId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend_confirmation" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Renvoi impossible.");
        return;
      }
      alert(data.message || "Emails renvoyés au client et à l'agence.");
    } catch {
      alert("Erreur réseau.");
    } finally {
      setResendingId(null);
    }
  };

  const handleRefund = async (id: string) => {
    if (!confirm("Confirmer le remboursement de l'acompte pour cette réservation ?")) {
      return;
    }
    setRefundingId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "refund" }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Remboursement impossible.");
        return;
      }
      await loadBookings();
    } catch {
      alert("Erreur réseau.");
    } finally {
      setRefundingId(null);
    }
  };

  return (
    <div className="max-w-7xl">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">
              Supervision des réservations
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
              Toutes les agences · données en direct
            </p>
          </div>
          <div className="relative">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Client, agence, code..."
              className="bg-white border border-gray-100 rounded-2xl pl-12 pr-6 py-4 text-xs font-bold w-64 shadow-sm outline-none focus:ring-4 focus:ring-orange-500/5 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </header>

        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: "ALL", label: "Toutes" },
            { id: "REFUNDS", label: "À rembourser" },
            { id: "CONFIRMED", label: "Confirmées" },
            { id: "CANCELLED", label: "Annulées" },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setStatusFilter(f.id)}
              className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest ${
                statusFilter === f.id
                  ? "bg-[#0F172A] text-white"
                  : "bg-white border border-gray-100 text-gray-400"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

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
              Aucune réservation trouvée.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#F8FAFC] border-b border-gray-50">
                <tr>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Client / Agence
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Voyage
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Date
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Statut
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Réf.
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Acompte
                  </th>
                  <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-8">
                      <p className="text-sm font-black text-[#0F172A]">{booking.client}</p>
                      <p className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mt-1">
                        {booking.agency}
                      </p>
                    </td>
                    <td className="px-8 py-8">
                      <p className="text-xs font-bold text-gray-600">{booking.trip}</p>
                    </td>
                    <td className="px-8 py-8">
                      <p className="text-xs font-bold text-gray-500">
                        {formatFrDate(booking.date)}
                      </p>
                    </td>
                    <td className="px-8 py-8">
                      <span
                        className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                          STATUS_STYLE[booking.status] ??
                          "bg-gray-50 text-gray-600 border border-gray-100"
                        }`}
                      >
                        {STATUS_LABELS[booking.status] ?? booking.status}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        #{booking.confirmationCode}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <span className="text-base font-black text-[#0F172A]">
                        €{booking.amount}
                      </span>
                    </td>
                    <td className="px-8 py-8">
                      <div className="flex flex-wrap gap-2">
                        {booking.status === "CONFIRMED" && (
                          <button
                            type="button"
                            disabled={resendingId === booking.id}
                            onClick={() => handleResendEmail(booking.id)}
                            className="px-4 py-2 bg-orange-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-orange-700 disabled:opacity-50"
                          >
                            {resendingId === booking.id ? "..." : "Renvoyer email"}
                          </button>
                        )}
                        {booking.canRefund && (
                          <button
                            type="button"
                            disabled={refundingId === booking.id}
                            onClick={() => handleRefund(booking.id)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-purple-700 disabled:opacity-50"
                          >
                            {refundingId === booking.id ? "..." : "Rembourser"}
                          </button>
                        )}
                      </div>
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
