"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Mail,
  Phone,
  Building2,
  Loader2,
  Star,
  MessageSquare,
  X,
  ExternalLink,
  Globe,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Maximize2,
  ChevronDown,
  ChevronUp,
  GripHorizontal,
} from "lucide-react";

type ModalSize = "normal" | "large" | "fullscreen";

const MODAL_SIZE_CLASSES: Record<ModalSize, string> = {
  normal: "max-w-4xl w-full h-[min(82vh,820px)]",
  large: "max-w-6xl w-full h-[min(92vh,960px)]",
  fullscreen: "max-w-[98vw] w-full h-[96vh]",
};

type AgencyRow = {
  id: string;
  name: string;
  manager: string;
  email: string;
  phone: string;
  status: string;
  siret: string;
  trips: number;
  reviewCount: number;
  reviewAverage: number | null;
};

type AgencyReview = {
  id: string;
  platform: string;
  platformLabel: string;
  author: string;
  rating: number;
  title: string;
  content: string;
  location: string;
  sourceUrl: string | null;
  date: string;
};

type ReviewStats = {
  total: number;
  average: number | null;
  positive: number;
  neutral: number;
  negative: number;
  recommendation: "FAVORABLE" | "MIXED" | "UNFAVORABLE" | "UNKNOWN";
};

type PlatformSummary = {
  platform: string;
  label: string;
  count: number;
};

const PLATFORM_COLORS: Record<string, string> = {
  GOOGLE: "bg-blue-50 text-blue-700 border-blue-100",
  TRIPADVISOR: "bg-green-50 text-green-700 border-green-100",
  FACEBOOK: "bg-indigo-50 text-indigo-700 border-indigo-100",
  TRUSTPILOT: "bg-emerald-50 text-emerald-700 border-emerald-100",
  VIATOR: "bg-orange-50 text-orange-700 border-orange-100",
};

const RECOMMENDATION_CONFIG = {
  FAVORABLE: {
    label: "Réputation favorable",
    detail: "Les avis externes sont majoritairement positifs — validation recommandée.",
    className: "bg-green-50 border-green-100 text-green-800",
    icon: ThumbsUp,
  },
  MIXED: {
    label: "Réputation mitigée",
    detail: "Avis positifs et négatifs — analysez les commentaires avant de décider.",
    className: "bg-orange-50 border-orange-100 text-orange-800",
    icon: Minus,
  },
  UNFAVORABLE: {
    label: "Réputation défavorable",
    detail: "Plusieurs avis négatifs signalés — prudence avant validation.",
    className: "bg-red-50 border-red-100 text-red-800",
    icon: ThumbsDown,
  },
  UNKNOWN: {
    label: "Aucune donnée",
    detail: "Aucun avis trouvé sur les plateformes externes.",
    className: "bg-gray-50 border-gray-100 text-gray-600",
    icon: Globe,
  },
} as const;

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
  const [reviewsModalAgency, setReviewsModalAgency] = useState<AgencyRow | null>(null);
  const [agencyReviews, setAgencyReviews] = useState<AgencyReview[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviewPlatforms, setReviewPlatforms] = useState<PlatformSummary[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [modalSize, setModalSize] = useState<ModalSize>("large");
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const [customModalHeight, setCustomModalHeight] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const resizeStartRef = useRef<{ startY: number; startHeight: number } | null>(null);

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

  const loadAgencyReviews = useCallback(async (agencyId: string) => {
    setReviewsLoading(true);
    setReviewsError("");
    try {
      const res = await fetch(`/api/admin/agencies/${agencyId}/reviews`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        setReviewsError(data.error || "Impossible de charger les avis externes.");
        setAgencyReviews([]);
        setReviewStats(null);
        setReviewPlatforms([]);
        return;
      }
      setAgencyReviews(data.reviews || []);
      setReviewStats(data.stats || null);
      setReviewPlatforms(data.platforms || []);
    } catch {
      setReviewsError("Erreur réseau.");
      setAgencyReviews([]);
      setReviewStats(null);
      setReviewPlatforms([]);
    } finally {
      setReviewsLoading(false);
    }
  }, []);

  const openReviewsModal = (agency: AgencyRow) => {
    setReviewsModalAgency(agency);
    loadAgencyReviews(agency.id);
  };

  const closeReviewsModal = () => {
    setReviewsModalAgency(null);
    setAgencyReviews([]);
    setReviewStats(null);
    setReviewPlatforms([]);
    setReviewsError("");
    setModalSize("large");
    setStatsCollapsed(false);
    setCustomModalHeight(null);
  };

  const startModalResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const modal = modalRef.current;
    if (!modal) return;

    resizeStartRef.current = {
      startY: e.clientY,
      startHeight: modal.offsetHeight,
    };

    const onMove = (ev: MouseEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;
      const nextHeight = Math.min(
        window.innerHeight * 0.96,
        Math.max(480, start.startHeight + (ev.clientY - start.startY))
      );
      setCustomModalHeight(nextHeight);
    };

    const onUp = () => {
      resizeStartRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

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
      if (reviewsModalAgency?.id === id) {
        setReviewsModalAgency((prev) =>
          prev ? { ...prev, status: newStatus } : null
        );
      }
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
            Réputation externe — avis Google, TripAdvisor et autres plateformes
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
                  Réputation externe
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
                    <button
                      type="button"
                      onClick={() => openReviewsModal(agency)}
                      className="text-left group"
                    >
                      {agency.reviewCount > 0 ? (
                        <>
                          <div className="flex items-center gap-1.5 text-sm font-black text-[#0F172A]">
                            <Star
                              size={14}
                              className="text-orange-400 fill-orange-400"
                            />
                            {agency.reviewAverage?.toFixed(1)}
                          </div>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1 group-hover:text-orange-600 transition-colors">
                            {agency.reviewCount} avis externes — Consulter
                          </p>
                        </>
                      ) : (
                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest group-hover:text-orange-600 transition-colors flex items-center gap-1.5">
                          <Globe size={12} />
                          Rechercher avis — Consulter
                        </p>
                      )}
                    </button>
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

      {reviewsModalAgency && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#0F172A]/60 backdrop-blur-sm">
          <div
            ref={modalRef}
            style={customModalHeight ? { height: customModalHeight } : undefined}
            className={`bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl flex flex-col overflow-hidden min-h-0 ${
              customModalHeight ? "max-w-6xl w-full" : MODAL_SIZE_CLASSES[modalSize]
            }`}
          >
            <div className="shrink-0 p-6 sm:p-8 border-b border-gray-100 flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                  <Globe size={12} />
                  Avis sur autres plateformes
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-[#0F172A] truncate">
                  {reviewsModalAgency.name}
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-1">
                  Avis laissés par des voyageurs sur Google, TripAdvisor, Facebook
                  et autres — pour évaluer la réputation avant validation.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="hidden sm:flex items-center gap-1 bg-[#F8FAFC] border border-gray-100 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCustomModalHeight(null);
                      setModalSize("normal");
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      modalSize === "normal" && !customModalHeight
                        ? "bg-white text-[#0F172A] shadow-sm"
                        : "text-gray-400 hover:text-[#0F172A]"
                    }`}
                    title="Taille normale"
                  >
                    M
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomModalHeight(null);
                      setModalSize("large");
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                      modalSize === "large" && !customModalHeight
                        ? "bg-white text-[#0F172A] shadow-sm"
                        : "text-gray-400 hover:text-[#0F172A]"
                    }`}
                    title="Grande taille"
                  >
                    L
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomModalHeight(null);
                      setModalSize("fullscreen");
                    }}
                    className={`p-1.5 rounded-lg transition-all ${
                      modalSize === "fullscreen" && !customModalHeight
                        ? "bg-white text-[#0F172A] shadow-sm"
                        : "text-gray-400 hover:text-[#0F172A]"
                    }`}
                    title="Plein écran"
                  >
                    <Maximize2 size={14} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={closeReviewsModal}
                  className="w-10 h-10 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:text-[#0F172A] hover:bg-gray-50 transition-all"
                  title="Fermer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {reviewStats && reviewStats.recommendation !== "UNKNOWN" && (
              <div
                className={`shrink-0 mx-6 sm:mx-8 mt-4 px-5 py-4 rounded-2xl border flex items-start gap-3 ${
                  RECOMMENDATION_CONFIG[reviewStats.recommendation].className
                }`}
              >
                {(() => {
                  const cfg = RECOMMENDATION_CONFIG[reviewStats.recommendation];
                  const Icon = cfg.icon;
                  return (
                    <>
                      <Icon size={18} className="shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-black">{cfg.label}</p>
                        <p className="text-xs font-medium mt-0.5 opacity-90">
                          {cfg.detail}
                        </p>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {reviewStats && (
              <div className="shrink-0 border-b border-gray-50 bg-[#F8FAFC]">
                <button
                  type="button"
                  onClick={() => setStatsCollapsed((v) => !v)}
                  className="w-full px-6 sm:px-8 py-3 flex items-center justify-between text-left hover:bg-gray-50/80 transition-colors"
                >
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
                    Résumé · {reviewStats.total} avis · {reviewStats.average ?? "—"}★
                  </span>
                  {statsCollapsed ? (
                    <ChevronDown size={16} className="text-gray-400" />
                  ) : (
                    <ChevronUp size={16} className="text-gray-400" />
                  )}
                </button>
                {!statsCollapsed && (
                  <>
                    <div className="px-6 sm:px-8 pb-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          Note moyenne
                        </p>
                        <p className="text-xl font-black text-[#0F172A] mt-1 flex items-center gap-1">
                          <Star size={16} className="text-orange-400 fill-orange-400" />
                          {reviewStats.average ?? "—"}
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          Total avis
                        </p>
                        <p className="text-xl font-black text-[#0F172A] mt-1">
                          {reviewStats.total}
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          Positifs (4-5★)
                        </p>
                        <p className="text-xl font-black text-green-600 mt-1">
                          {reviewStats.positive}
                        </p>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-100">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                          Négatifs (1-2★)
                        </p>
                        <p className="text-xl font-black text-red-500 mt-1">
                          {reviewStats.negative}
                        </p>
                      </div>
                    </div>
                    {reviewPlatforms.length > 0 && (
                      <div className="px-6 sm:px-8 pb-4 flex flex-wrap gap-2">
                        {reviewPlatforms.map((p) => (
                          <span
                            key={p.platform}
                            className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              PLATFORM_COLORS[p.platform] ||
                              "bg-gray-50 text-gray-600 border-gray-100"
                            }`}
                          >
                            {p.label} · {p.count}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="flex flex-col flex-1 min-h-0">
              <div className="shrink-0 px-6 sm:px-8 py-3 border-b border-gray-50 flex items-center justify-between bg-white">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Liste des avis ({agencyReviews.length})
                </p>
                <p className="text-[9px] text-gray-400 font-bold hidden sm:block">
                  Glissez la poignée ci-dessous pour agrandir
                </p>
              </div>

              <div className="flex-1 min-h-[320px] overflow-y-auto p-6 sm:p-8 space-y-4 bg-white">
              {reviewsLoading ? (
                <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
                  <Loader2 className="animate-spin" size={24} />
                  <span className="text-xs font-black uppercase tracking-widest">
                    Recherche sur les plateformes...
                  </span>
                </div>
              ) : reviewsError ? (
                <p className="text-red-600 text-sm font-bold text-center py-8">
                  {reviewsError}
                </p>
              ) : agencyReviews.length === 0 ? (
                <div className="text-center py-16">
                  <MessageSquare
                    size={40}
                    className="mx-auto text-gray-200 mb-4"
                  />
                  <p className="text-gray-500 font-bold">
                    Aucun avis trouvé sur les plateformes externes.
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Aucune réputation publique détectée sur Google, TripAdvisor ou
                    autres sites. Vérifiez manuellement avant de valider.
                  </p>
                </div>
              ) : (
                agencyReviews.map((review) => (
                  <div
                    key={review.id}
                    className="bg-[#F8FAFC] rounded-[2rem] border border-gray-100 p-6 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                              PLATFORM_COLORS[review.platform] ||
                              "bg-gray-50 text-gray-600 border-gray-100"
                            }`}
                          >
                            {review.platformLabel}
                          </span>
                        </div>
                        <p className="font-black text-[#0F172A]">{review.author}</p>
                        <p className="text-[10px] text-gray-400 font-bold">
                          {review.date}
                          {review.location ? ` · ${review.location}` : ""}
                        </p>
                      </div>
                      <span className="flex items-center gap-1 text-sm font-black text-[#0F172A]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i < review.rating
                                ? "text-orange-400 fill-orange-400"
                                : "text-gray-200"
                            }
                          />
                        ))}
                      </span>
                    </div>

                    <div>
                      {review.title && (
                        <p className="font-black text-[#0F172A] text-sm">
                          {review.title}
                        </p>
                      )}
                      <p className="text-sm text-gray-500 font-medium leading-relaxed mt-2">
                        {review.content}
                      </p>
                    </div>

                    {review.sourceUrl && (
                      <a
                        href={review.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[10px] font-black text-orange-600 uppercase tracking-widest hover:underline"
                      >
                        Voir sur {review.platformLabel}
                        <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))
              )}
              </div>

              <button
                type="button"
                onMouseDown={startModalResize}
                className="shrink-0 w-full py-2 border-t border-gray-100 bg-[#F8FAFC] hover:bg-gray-100 transition-colors cursor-ns-resize flex items-center justify-center gap-2 group"
                title="Glisser pour redimensionner la fenêtre"
              >
                <GripHorizontal
                  size={18}
                  className="text-gray-300 group-hover:text-gray-500 transition-colors"
                />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-gray-600">
                  Ajuster la taille
                </span>
              </button>
            </div>

            <div className="shrink-0 p-6 sm:p-8 border-t border-gray-100 bg-white flex flex-wrap gap-3 justify-end">
              {(reviewsModalAgency.status === "PENDING" ||
                reviewsModalAgency.status === "UNDER_REVIEW") && (
                <>
                  <button
                    type="button"
                    disabled={updatingId === reviewsModalAgency.id}
                    onClick={() =>
                      updateStatus(reviewsModalAgency.id, "REJECTED")
                    }
                    className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest border border-red-100 text-red-600 hover:bg-red-50 transition-all disabled:opacity-50"
                  >
                    Refuser l&apos;agence
                  </button>
                  <button
                    type="button"
                    disabled={updatingId === reviewsModalAgency.id}
                    onClick={() =>
                      updateStatus(reviewsModalAgency.id, "VERIFIED")
                    }
                    className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-50"
                  >
                    Valider l&apos;agence
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={closeReviewsModal}
                className="px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest border border-gray-100 text-gray-500 hover:bg-gray-50 transition-all"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
