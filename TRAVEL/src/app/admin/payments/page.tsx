"use client";

import { useEffect, useState } from "react";
import { ExternalLink, CreditCard, Link2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

type PaymentRow = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payoutMode?: string;
  platformFeeCents?: number;
  agencyNetCents?: number;
  paidAt: string | null;
  createdAt: string;
  confirmationCode: string;
  clientName: string;
  agency: string;
  trip: string;
  stripeDashboardUrl: string | null;
};

type StripeConnectOverview = {
  summary: {
    totalAgencies: number;
    withStripeAccount: number;
    payoutsActive: number;
    pendingOnboarding: number;
  };
  agencies: Array<{
    id: string;
    name: string;
    email: string;
    country: string;
    verificationStatus: string;
    connectStatus: "not_started" | "onboarding" | "active" | "restricted";
  }>;
};

const CONNECT_LABELS: Record<string, string> = {
  not_started: "Non connecté",
  onboarding: "Onboarding",
  active: "Actif",
  restricted: "Restreint",
};

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [stripeConnect, setStripeConnect] = useState<StripeConnectOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/payments")
      .then((res) => res.json())
      .then((data) => {
        setPayments(data.payments || []);
        setStripeConnect(data.stripeConnect || null);
      })
      .catch(() => {
        setPayments([]);
        setStripeConnect(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalSucceeded = payments
    .filter((p) => p.status === "SUCCEEDED")
    .reduce((acc, p) => acc + p.amount, 0);

  const summary = stripeConnect?.summary;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Paiements</h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
          Acomptes clients & Stripe Connect agences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Acomptes encaissés" value={`${totalSucceeded} €`} />
        <StatCard
          label="Agences Connect actives"
          value={summary ? String(summary.payoutsActive) : "—"}
        />
        <StatCard
          label="Comptes Stripe créés"
          value={summary ? String(summary.withStripeAccount) : "—"}
        />
        <StatCard
          label="Onboarding en cours"
          value={summary ? String(summary.pendingOnboarding) : "—"}
        />
      </div>

      {stripeConnect && stripeConnect.agencies.length > 0 && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex items-center gap-3">
            <Link2 className="text-orange-600" size={22} />
            <h2 className="font-black text-[#0F172A]">Stripe Connect — agences</h2>
          </div>
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50">
                  <th className="p-4">Agence</th>
                  <th className="p-4">Pays</th>
                  <th className="p-4">Connect</th>
                </tr>
              </thead>
              <tbody>
                {stripeConnect.agencies.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 hover:bg-[#F8FAFC]/50">
                    <td className="p-4 font-bold text-[#0F172A]">{a.name}</td>
                    <td className="p-4 text-gray-500">{a.country}</td>
                    <td className="p-4">
                      <span
                        className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${
                          a.connectStatus === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : a.connectStatus === "onboarding"
                              ? "bg-orange-50 text-orange-700"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {CONNECT_LABELS[a.connectStatus]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[2.5rem] border border-gray-100 p-6 shadow-sm flex items-start gap-4">
        <CreditCard className="text-orange-500 shrink-0" size={28} />
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          Les remboursements se traitent depuis le dashboard Stripe. Les acomptes avec
          Connect actif incluent la commission plateforme (voir PLATFORM_FEE_PERCENT).
        </p>
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
                  <th className="p-6">Répartition</th>
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
                    <td className="p-6 text-[10px] font-bold text-gray-500">
                      {p.payoutMode === "connect" ? (
                        <>
                          <span className="text-emerald-600 block">Connect</span>
                          Plateforme {(p.platformFeeCents || 0) / 100}€ · Agence{" "}
                          {(p.agencyNetCents || 0) / 100}€
                        </>
                      ) : (
                        "Plateforme"
                      )}
                    </td>
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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
        {label}
      </p>
      <p className="text-2xl font-black text-[#0F172A]">{value}</p>
    </div>
  );
}
