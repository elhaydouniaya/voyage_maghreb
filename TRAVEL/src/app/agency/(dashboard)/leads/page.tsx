"use client";

import { Suspense, useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Sparkles, Mail, Phone, Users, Loader2, Check, MapPin } from "lucide-react";

type Lead = {
  id: string;
  read: boolean;
  createdAt: string;
  bestCompatibility: number | null;
  request: {
    id: string;
    destination: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    travelers: number;
    budgetMax: number;
    summary: string | null;
  };
  matchedTrips: { id: string; title: string; slug: string }[];
};

function AgencyLeadsContent() {
  const searchParams = useSearchParams();
  const highlightRequestId = searchParams.get("request")?.trim() || "";
  const [leads, setLeads] = useState<Lead[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const highlightedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agency/leads", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Chargement impossible.");
        return;
      }
      setLeads(data.leads || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (leadId: string) => {
    await fetch("/api/agency/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_read", leadId }),
    });
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, read: true } : l))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch("/api/agency/leads", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark_all_read" }),
    });
    setLeads((prev) => prev.map((l) => ({ ...l, read: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    if (!highlightRequestId || loading || highlightedRef.current) return;
    const el = document.getElementById(`lead-request-${highlightRequestId}`);
    if (!el) return;
    highlightedRef.current = true;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const lead = leads.find((l) => l.request.id === highlightRequestId);
    if (lead && !lead.read) void markRead(lead.id);
  }, [highlightRequestId, loading, leads]);

  return (
    <div className="max-w-5xl">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight flex items-center gap-3">
            <Sparkles className="text-orange-500" size={28} />
            Prospects IA
          </h1>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
            Voyageurs ayant matché vos circuits via le configurateur
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-[10px] font-black uppercase tracking-widest text-orange-600 hover:underline"
          >
            Tout marquer comme lu ({unreadCount})
          </button>
        )}
      </header>

      {error && (
        <div className="mb-8 bg-red-50 border border-red-100 text-red-700 rounded-2xl p-4 text-sm font-bold">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-gray-400 py-16">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-xs font-black uppercase tracking-widest">
            Chargement...
          </span>
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-white rounded-[3rem] border border-dashed border-gray-200 p-16 text-center">
          <Sparkles className="text-gray-200 mx-auto mb-4" size={48} />
          <p className="text-gray-500 font-bold">Aucun prospect IA pour le moment</p>
          <p className="text-sm text-gray-400 mt-2 max-w-md mx-auto">
            Lorsqu&apos;un voyageur utilisera la recherche IA et matchera vos voyages,
            le prospect apparaîtra ici et vous recevrez un email.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {leads.map((lead) => (
            <article
              key={lead.id}
              id={`lead-request-${lead.request.id}`}
              className={`bg-white rounded-[2.5rem] border p-8 transition-all ${
                highlightRequestId === lead.request.id
                  ? "border-orange-500 ring-2 ring-orange-200"
                  : lead.read
                    ? "border-gray-100"
                    : "border-orange-200 shadow-lg shadow-orange-500/5"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div>
                  {!lead.read && (
                    <span className="inline-block mb-2 bg-orange-100 text-orange-700 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                      Nouveau
                    </span>
                  )}
                  <h2 className="text-lg font-black text-[#0F172A] flex items-center gap-2">
                    <MapPin size={18} className="text-orange-500" />
                    {lead.request.destination}
                  </h2>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                    {new Date(lead.createdAt).toLocaleString("fr-FR")}
                    {lead.bestCompatibility != null &&
                      ` · ${lead.bestCompatibility}% compatibilité`}
                  </p>
                </div>
                {!lead.read && (
                  <button
                    type="button"
                    onClick={() => markRead(lead.id)}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-orange-600"
                  >
                    <Check size={14} />
                    Marquer lu
                  </button>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2 text-sm">
                  <p className="font-black text-[#0F172A]">{lead.request.clientName}</p>
                  <p className="flex items-center gap-2 text-gray-500 font-medium">
                    <Mail size={14} />
                    <a
                      href={`mailto:${lead.request.clientEmail}`}
                      className="text-orange-600 hover:underline"
                    >
                      {lead.request.clientEmail}
                    </a>
                  </p>
                  {lead.request.clientPhone && (
                    <p className="flex items-center gap-2 text-gray-500 font-medium">
                      <Phone size={14} />
                      {lead.request.clientPhone}
                    </p>
                  )}
                  <p className="flex items-center gap-2 text-gray-500 font-medium">
                    <Users size={14} />
                    {lead.request.travelers} voyageur(s) · budget {lead.request.budgetMax}€
                  </p>
                </div>
                {lead.request.summary && (
                  <p className="text-sm text-gray-600 font-medium italic bg-[#F8FAFC] rounded-2xl p-4 border border-gray-50">
                    {lead.request.summary}
                  </p>
                )}
              </div>

              {lead.matchedTrips.length > 0 && (
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">
                    Vos voyages correspondants
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {lead.matchedTrips.map((t) => (
                      <li key={t.id}>
                        <Link
                          href={`/trip/${t.slug}`}
                          className="inline-block bg-orange-50 text-orange-800 text-xs font-bold px-4 py-2 rounded-full hover:bg-orange-100"
                        >
                          {t.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgencyLeadsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center gap-3 text-gray-400 py-16">
          <Loader2 className="animate-spin" size={24} />
          <span className="text-xs font-black uppercase tracking-widest">
            Chargement...
          </span>
        </div>
      }
    >
      <AgencyLeadsContent />
    </Suspense>
  );
}
