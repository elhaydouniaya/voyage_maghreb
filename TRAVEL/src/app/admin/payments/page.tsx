"use client";

import { useEffect, useState } from "react";
import { ExternalLink, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  paidAt: string | null;
  createdAt: string;
  confirmationCode: string;
  clientName: string;
  agency: string;
  trip: string;
  stripeDashboardUrl: string | null;
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/payments")
      .then((res) => res.json())
      .then((data) => setPayments(data.payments || []))
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));
  }, []);

  const totalSucceeded = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            Acomptes encaissés (liste)
          </p>
          <p className="text-4xl font-black text-[#0F172A]">{totalSucceeded}€</p>
        </div>
        <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex items-center gap-4">
          <CreditCard className="text-orange-500" size={32} />
          <p className="text-sm text-gray-500 font-medium">
            Les remboursements se traitent depuis le dashboard Stripe, puis marquez la
            réservation comme remboursée dans Réservations.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <p className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            Chargement...
          </p>
        ) : payments.length === 0 ? (
          <p className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            Aucun paiement enregistré
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="p-6">Date</th>
                  <th className="p-6">Client</th>
                  <th className="p-6">Voyage</th>
                  <th className="p-6">Montant</th>
                  <th className="p-6">Statut</th>
                  <th className="p-6">Stripe</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-[#F8FAFC]/50">
                    <td className="p-6 text-sm font-bold text-gray-600">
                      {format(new Date(p.createdAt), "dd MMM yyyy", { locale: fr })}
                    </td>
                    <td className="p-6">
                      <p className="font-bold text-[#0F172A]">{p.clientName}</p>
                      <p className="text-[10px] text-gray-400 font-mono">{p.confirmationCode}</p>
                    </td>
                    <td className="p-6 text-sm font-medium text-gray-600">
                      {p.trip}
                      <span className="block text-[10px] text-gray-400">{p.agency}</span>
                    </td>
                    <td className="p-6 font-black text-orange-600">{p.amount}€</td>
                    <td className="p-6">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                          p.status === "SUCCEEDED"
                            ? "bg-green-100 text-green-700"
                            : p.status === "REFUNDED"
                              ? "bg-gray-100 text-gray-600"
                              : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="p-6">
                      {p.stripeDashboardUrl ? (
                        <a
                          href={p.stripeDashboardUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-orange-600 hover:underline"
                        >
                          Voir <ExternalLink size={12} />
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
