"use client";

import { useState, useEffect } from "react";
import { Calendar, MapPin, Loader2 } from "lucide-react";

type AgencyBooking = {
  id: string;
  confirmationCode: string;
  trip: string;
  destination: string;
  client: string;
  clientEmail: string;
  date: string;
  bookedAt: string;
  status: string;
  seats: number;
  amount: number;
  totalAmount: number;
};

const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: "bg-green-50 text-green-600 border border-green-100",
  PENDING_PAYMENT: "bg-orange-50 text-orange-600 border border-orange-100",
  CANCELLED: "bg-red-50 text-red-600 border border-red-100",
  REFUNDED: "bg-purple-50 text-purple-600 border border-purple-100",
  NO_SHOW: "bg-gray-100 text-gray-600 border border-gray-200",
};

const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: "Confirmée",
  PENDING_PAYMENT: "En attente paiement",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
  NO_SHOW: "Absent",
};

function formatFrDate(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AgencyBookingsPage() {
  const [bookings, setBookings] = useState<AgencyBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/agency/bookings", { cache: "no-store" });
        const data = await res.json();
        if (!res.ok) {
          if (!cancelled) setError(data.error || "Chargement impossible.");
          return;
        }
        if (!cancelled) setBookings(data.bookings || []);
      } catch {
        if (!cancelled) setError("Erreur réseau.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">
            Gestion des Réservations
          </h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
            Données en direct — synchronisées avec les réservations clients
          </p>
        </div>
        <a
          href="/api/agency/bookings/export"
          className="inline-flex items-center justify-center bg-[#0F172A] text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all"
        >
          Exporter CSV
        </a>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm font-bold">
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
        ) : bookings.length === 0 ? (
          <div className="py-24 text-center text-gray-400 text-sm font-bold">
            Aucune réservation reçue pour le moment.
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#F8FAFC] border-b border-gray-50">
              <tr>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Client
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Voyage
                </th>
                <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Départ
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {bookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 font-black text-xs">
                        {booking.client[0]}
                      </div>
                      <div>
                        <span className="text-sm font-bold text-[#0F172A] block">
                          {booking.client}
                        </span>
                        <span className="text-[10px] text-gray-400 font-medium">
                          {booking.clientEmail}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <MapPin size={14} className="text-orange-500 shrink-0" />
                      <span>
                        {booking.trip}
                        <span className="block text-[10px] text-gray-400 font-medium mt-0.5">
                          {booking.destination} · {booking.seats} pers.
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                      <Calendar size={14} />
                      {formatFrDate(booking.date)}
                    </div>
                    <p className="text-[10px] text-gray-300 font-bold mt-1">
                      Réservé {formatFrDate(booking.bookedAt)}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                        STATUS_STYLE[booking.status] ??
                        "bg-gray-50 text-gray-600 border border-gray-100"
                      }`}
                    >
                      {STATUS_LABEL[booking.status] ?? booking.status}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      #{booking.confirmationCode}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-sm font-black text-[#0F172A]">
                      €{booking.amount}
                    </span>
                    <span className="block text-[10px] text-gray-400 font-bold">
                      / €{booking.totalAmount} total
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
