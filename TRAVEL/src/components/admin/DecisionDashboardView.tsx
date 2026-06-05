"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import ChartContainer from "@/components/admin/ChartContainer";
import {
  TrendingUp,
  TrendingDown,
  RefreshCcw,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Eye,
} from "lucide-react";

type Kpi = {
  id: string;
  label: string;
  value: string;
  change: number;
  unit: string;
};

type FunnelStep = { step: string; label: string; count: number; dropOff: number };
type Objective = {
  metric: string;
  actual: number;
  target: number;
  unit: string;
  achievementRate: number;
  status: string;
};
type Alert = {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  metric?: string;
  value?: string;
};

type DashboardData = {
  period: { label: string };
  kpis: Kpi[];
  funnel: FunnelStep[];
  monthlyTrend: { label: string; events: number; bookings: number }[];
  segmentBreakdown: { name: string; value: number }[];
  topTrips: { name: string; views: number }[];
  objectives: Objective[];
  alerts: Alert[];
  engagement: { totalEvents: number; eventsChange: number; uniqueSessions: number; avgEventsPerSession?: number };
};

const PIE_COLORS = ["#2563eb", "#ea580c", "#10b981", "#8b5cf6", "#64748b"];

const statusStyles: Record<string, string> = {
  good: "bg-emerald-50 text-emerald-700 border-emerald-200",
  watch: "bg-amber-50 text-amber-700 border-amber-200",
  alert: "bg-red-50 text-red-700 border-red-200",
};

const objectiveStyles: Record<string, string> = {
  "En bonne voie": "text-emerald-600",
  "À surveiller": "text-amber-600",
  "À améliorer": "text-red-600",
};

export default function DecisionDashboardView() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodOffset, setPeriodOffset] = useState(0);
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ period: String(periodOffset) });
      if (roleFilter !== "ALL") params.set("role", roleFilter);
      const res = await fetch(`/api/admin/decision-dashboard?${params}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
      else setData(null);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [periodOffset, roleFilter]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center py-24">
        Chargement du tableau décisionnel...
      </p>
    );
  }

  if (!data) {
    return (
      <p className="text-center text-red-500 font-bold py-24">
        Impossible de charger les analytics comportementales.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-[2rem] border border-gray-100 px-8 py-5 shadow-sm">
        <div>
          <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.25em]">
            Tableau de bord décisionnel
          </p>
          <h1 className="text-2xl font-black text-[#0F172A] mt-1">
            Analytics comportementales & performance
          </h1>
          <p className="text-xs text-gray-400 font-bold mt-1">
            Période : {data.period.label} · Parcours utilisateurs · Détection d&apos;anomalies
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={periodOffset}
            onChange={(e) => setPeriodOffset(Number(e.target.value))}
            className="px-4 py-3 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest bg-white"
            aria-label="Période"
          >
            <option value={0}>Mois en cours</option>
            <option value={1}>Mois précédent</option>
            <option value={2}>Il y a 2 mois</option>
          </select>
          <button
            type="button"
            onClick={load}
            className="flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-200 text-xs font-black uppercase tracking-widest hover:bg-gray-50"
          >
            <RefreshCcw size={14} /> Actualiser
          </button>
          <button
            type="button"
            onClick={() => setFiltersOpen((o) => !o)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${
              filtersOpen
                ? "bg-orange-600 text-white"
                : "bg-[#0F172A] text-white"
            }`}
          >
            <Filter size={14} /> Filtres
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="bg-white rounded-[1.5rem] border border-gray-100 px-8 py-5 shadow-sm flex flex-wrap items-center gap-4">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
            Profil utilisateur
          </p>
          {[
            { value: "ALL", label: "Tous" },
            { value: "CLIENT", label: "Voyageurs" },
            { value: "AGENCY", label: "Agences" },
            { value: "ADMIN", label: "Admins" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setRoleFilter(opt.value)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest border transition-colors ${
                roleFilter === opt.value
                  ? "bg-orange-50 border-orange-300 text-orange-700"
                  : "border-gray-200 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {data.kpis.map((kpi) => (
          <div
            key={kpi.id}
            className="bg-white rounded-[1.75rem] border border-gray-100 p-6 shadow-sm"
          >
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
              {kpi.label}
            </p>
            <p className="text-2xl font-black text-[#0F172A] mt-2">{kpi.value}</p>
            <div
              className={`flex items-center gap-1 mt-2 text-xs font-bold ${
                kpi.change >= 0 ? "text-emerald-600" : "text-red-500"
              }`}
            >
              {kpi.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {kpi.change >= 0 ? "+" : ""}
              {kpi.change}
              {kpi.unit} vs mois préc.
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-lg font-black text-[#0F172A] mb-1">
            Évolution activité & conversions
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">
            Événements comportementaux vs réservations confirmées
          </p>
          <ChartContainer heightClass="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <LineChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="events"
                  name="Événements"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="bookings"
                  name="Réservations"
                  stroke="#ea580c"
                  strokeWidth={3}
                  dot={{ fill: "#ea580c" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-lg font-black text-[#0F172A] mb-1">Répartition par profil</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
            Segmentation collaborative
          </p>
          <ChartContainer heightClass="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={data.segmentBreakdown}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {data.segmentBreakdown.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-lg font-black text-[#0F172A] mb-1">
            Parcours utilisateur (funnel)
          </h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">
            User Journey Analytics — de la visite à la réservation
          </p>
          <ChartContainer heightClass="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data.funnel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                <YAxis dataKey="label" type="category" width={110} tick={{ fontSize: 9 }} />
                <Tooltip
                  formatter={(value, _name, props) => {
                    const drop = props.payload?.dropOff;
                    return [`${value}${drop ? ` (−${drop}% étape préc.)` : ""}`, "Sessions"];
                  }}
                />
                <Bar dataKey="count" fill="#0F172A" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-lg font-black text-[#0F172A] mb-1">Top 5 voyages consultés</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">
            Intérêt catalogue (vues comportementales)
          </p>
          <ChartContainer heightClass="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={data.topTrips}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="views" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <h3 className="text-lg font-black text-[#0F172A] mb-4">Indicateurs & alertes</h3>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-4">
            Détection d&apos;anomalies — plateforme collaborative
          </p>
          <ul className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {data.alerts.map((alert) => (
              <li
                key={alert.id}
                className={`rounded-2xl border p-4 ${statusStyles[alert.status] ?? statusStyles.watch}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {alert.status === "good" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <AlertTriangle size={16} />
                    )}
                    <span className="text-sm font-black">{alert.title}</span>
                  </div>
                  {alert.value && (
                    <span className="text-[10px] font-black uppercase">{alert.value}</span>
                  )}
                </div>
                <p className="text-xs mt-2 opacity-90">{alert.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-[#0F172A]">Performance par objectif</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                Optimisation plateforme — réalisé vs cible
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
              <Eye size={14} />
              {data.engagement.uniqueSessions} sessions · {data.engagement.totalEvents} événements
              {data.engagement.avgEventsPerSession != null && (
                <> · {data.engagement.avgEventsPerSession} év./session</>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400 border-b border-gray-100">
                  <th className="text-left py-3 pr-4">Indicateur</th>
                  <th className="text-right py-3 px-2">Réalisé</th>
                  <th className="text-right py-3 px-2">Cible</th>
                  <th className="text-left py-3 px-4 min-w-[140px]">Atteinte</th>
                  <th className="text-left py-3 pl-2">Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.objectives.map((obj) => (
                  <tr key={obj.metric} className="border-b border-gray-50">
                    <td className="py-4 pr-4 font-bold text-[#0F172A]">{obj.metric}</td>
                    <td className="py-4 px-2 text-right font-black">
                      {obj.actual}
                      {obj.unit}
                    </td>
                    <td className="py-4 px-2 text-right text-gray-400">
                      {obj.target}
                      {obj.unit}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-orange-500 rounded-full transition-all"
                            style={{ width: `${Math.min(obj.achievementRate, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-black w-10">{obj.achievementRate}%</span>
                      </div>
                    </td>
                    <td
                      className={`py-4 pl-2 text-xs font-black ${objectiveStyles[obj.status] ?? ""}`}
                    >
                      {obj.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
