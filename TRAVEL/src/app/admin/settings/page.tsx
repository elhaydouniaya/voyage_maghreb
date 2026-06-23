"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, Lock, Bell, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type Integrations = {
  email: { configured: boolean; from: string; mode: string };
  stripe: { configured: boolean; mode: string };
  cron: { secretSet: boolean; secureInProduction: boolean };
  llm: {
    configured: boolean;
    disabled: boolean;
    provider: string;
    model: string;
  };
  gemini?: { configured: boolean; disabled: boolean; model: string };
  vapi: { configured: boolean; webhookSecretSet: boolean; webhookUrl?: string };
  cloudinary?: { configured: boolean; cloudName: string | null };
  stripeConnect?: {
    platformKeysSet: boolean;
    agenciesActive: number;
    agenciesPending: number;
    agenciesVerified: number;
    setupUrl: string;
  };
  openai?: { configured: boolean; disabled: boolean };
};

type SetupSteps = {
  gemini: string[];
  vapi: string[];
  stripeConnect: string[];
};

function SetupGuide({
  title,
  ok,
  steps,
  link,
}: {
  title: string;
  ok: boolean;
  steps: string[];
  link?: { href: string; label: string };
}) {
  if (ok) return null;
  return (
    <div className="p-5 rounded-2xl border border-amber-100 bg-amber-50/80 space-y-3">
      <p className="text-xs font-black uppercase tracking-widest text-amber-900">
        Configuration — {title}
      </p>
      <ol className="list-decimal list-inside space-y-1.5 text-[11px] font-medium text-amber-900/90">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {link && (
        <a
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-[10px] font-black uppercase tracking-widest text-orange-700 hover:underline"
        >
          {link.label} →
        </a>
      )}
    </div>
  );
}

function PartnerNewsletterPanel() {
  const [digest, setDigest] = useState<{
    periodDays: number;
    newTrips: number;
    confirmedBookings: number;
    aiLeads: number;
    publishedTrips: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState("");

  useEffect(() => {
    fetch("/api/admin/newsletter/partners", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (d.digest) setDigest(d.digest);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSend() {
    if (!confirm("Envoyer la newsletter aux agences partenaires opt-in ?")) return;
    setSending(true);
    setResult("");
    try {
      const res = await fetch("/api/admin/newsletter/partners", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResult(data.error || "Échec de l'envoi.");
        return;
      }
      setResult(
        `Envoyé à ${data.sent} agence(s) (${data.total} opt-in, ${data.skipped} ignorée(s)).`
      );
    } catch {
      setResult("Erreur réseau.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8 pt-8 border-t border-gray-100 space-y-4">
      <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-widest">
        Newsletter partenaires
      </h3>
      <p className="text-sm text-gray-600 font-medium">
        Agences vérifiées avec l&apos;option activée dans Paramètres → Notifications.
      </p>
      {loading ? (
        <p className="text-xs text-gray-400 font-bold">Chargement du digest…</p>
      ) : digest ? (
        <ul className="text-xs font-bold text-gray-500 space-y-1">
          <li>{digest.newTrips} nouveaux voyages (30 j)</li>
          <li>{digest.confirmedBookings} réservations confirmées</li>
          <li>{digest.aiLeads} prospects IA</li>
          <li>{digest.publishedTrips} départs en ligne</li>
        </ul>
      ) : null}
      <button
        type="button"
        onClick={handleSend}
        disabled={sending}
        className="bg-[#0F172A] text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest disabled:opacity-50 hover:bg-orange-600 transition-colors"
      >
        {sending ? "Envoi…" : "Envoyer aux agences opt-in"}
      </button>
      {result && <p className="text-sm font-bold text-green-600">{result}</p>}
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        Cron mensuel : GET /api/cron/partner-newsletter (Bearer CRON_SECRET)
      </p>
    </div>
  );
}

function IntegrationsStatusPanel() {
  const [data, setData] = useState<{
    integrations: Integrations;
    setupSteps?: SetupSteps;
    adminNotifyEmail: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/system-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-gray-400">
        <Loader2 className="animate-spin" size={20} />
        <span className="text-xs font-bold uppercase tracking-widest">Chargement...</span>
      </div>
    );
  }

  const i = data?.integrations;
  const steps = data?.setupSteps;
  if (!i) {
    return <p className="text-sm text-red-600 font-bold">Impossible de charger le statut.</p>;
  }

  const geminiOk = Boolean(i.gemini?.configured && !i.gemini?.disabled);
  const vapiOk = Boolean(i.vapi?.configured && i.vapi?.webhookSecretSet);
  const connectOk = (i.stripeConnect?.agenciesActive ?? 0) > 0;

  const rows = [
    {
      label: "Emails (Resend)",
      ok: i.email.configured,
      detail: i.email.configured
        ? `Actif · ${i.email.from}`
        : "Mode console — ajoutez RESEND_API_KEY dans .env",
    },
    {
      label: "Paiements (Stripe)",
      ok: i.stripe.configured,
      detail: i.stripe.configured ? "Clés configurées (checkout client)" : "Mode démo (sans Stripe)",
    },
    {
      label: "Stripe Connect (agences)",
      ok: connectOk,
      detail: connectOk
        ? `${i.stripeConnect?.agenciesActive} agence(s) avec encaissements actifs`
        : i.stripeConnect?.agenciesPending
          ? `${i.stripeConnect.agenciesPending} onboarding en cours — terminez sur Stripe`
          : i.stripe.configured
            ? "Connect non finalisé — activez Connect sur Stripe puis onboarding agence"
            : "Clés Stripe manquantes",
    },
    {
      label: "Cron J-7",
      ok: i.cron.secureInProduction,
      detail: i.cron.secretSet
        ? "CRON_SECRET défini"
        : "CRON_SECRET manquant (obligatoire en production)",
    },
    {
      label: `IA matching (${i.llm?.provider || "LLM"})`,
      ok: i.llm?.configured && !i.llm?.disabled,
      detail: i.llm?.disabled
        ? "Désactivé (OPENAI_DISABLE=true)"
        : i.llm?.configured
          ? `${i.llm.provider} · ${i.llm.model}`
          : "Mode local (heuristique)",
    },
    {
      label: "Gemini (guide client)",
      ok: geminiOk,
      detail: geminiOk
        ? `Actif · ${i.gemini?.model}`
        : i.gemini?.disabled
          ? "GEMINI_DISABLE=true"
          : "GEMINI_API_KEY manquant — fallback OpenAI/offline",
    },
    {
      label: "VAPI (guide vocal)",
      ok: vapiOk,
      detail: vapiOk
        ? `Widget + webhook · ${i.vapi.webhookUrl || "/api/vapi/webhook"}`
        : !i.vapi?.configured
          ? "NEXT_PUBLIC_VAPI_PUBLIC_KEY + ASSISTANT_ID manquants"
          : "Webhook secret OK — ajoutez clés VAPI côté client",
    },
    {
      label: "Cloudinary (images agence)",
      ok: Boolean(i.cloudinary?.configured),
      detail: i.cloudinary?.configured
        ? `Actif · ${i.cloudinary.cloudName}`
        : "CLOUDINARY_* manquants — uploads locaux en dev uniquement",
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 font-medium">
        Emails automatiques : inscription, réservation, annulation, remboursement, rappel J-7,
        validation agence.
      </p>
      {data?.adminNotifyEmail && (
        <p className="text-xs font-bold text-gray-500">
          Alertes admin agences → {data.adminNotifyEmail}
        </p>
      )}
      <ul className="space-y-3">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-start gap-3 p-4 rounded-2xl bg-[#F8FAFC] border border-gray-100"
          >
            {row.ok ? (
              <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
            ) : (
              <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
            )}
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-[#0F172A]">
                {row.label}
              </p>
              <p className="text-[11px] text-gray-500 font-bold mt-1">{row.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      {steps && (
        <div className="space-y-4 pt-2">
          <SetupGuide
            title="Gemini"
            ok={geminiOk}
            steps={steps.gemini}
            link={{ href: "https://aistudio.google.com/apikey", label: "Google AI Studio" }}
          />
          <SetupGuide
            title="VAPI vocal"
            ok={vapiOk}
            steps={steps.vapi}
            link={{ href: "https://dashboard.vapi.ai", label: "Dashboard VAPI" }}
          />
          <SetupGuide
            title="Stripe Connect"
            ok={connectOk}
            steps={steps.stripeConnect}
            link={{
              href: i.stripeConnect?.setupUrl || "https://dashboard.stripe.com/test/connect/overview",
              label: "Activer Connect (test)",
            }}
          />
        </div>
      )}
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
        Obtenez une clé sur{" "}
        <a href="https://resend.com" className="text-orange-600 hover:underline" target="_blank" rel="noreferrer">
          resend.com
        </a>
        {" "}puis ajoutez RESEND_API_KEY et RESEND_FROM dans .env
      </p>
      <PartnerNewsletterPanel />
    </div>
  );
}

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", email: "" });

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setForm({ name: data.user.name || "", email: data.user.email || "" });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const tabs = [
    { id: "general", label: "Général", icon: <Settings size={20} /> },
    { id: "security", label: "Sécurité", icon: <Lock size={20} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={20} /> },
  ];

  async function handleSave() {
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name }),
      });
      const data = await res.json();
      setMessage(res.ok ? "Profil administrateur mis à jour." : data.error || "Erreur.");
    } catch {
      setMessage("Erreur réseau.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`w-full p-6 rounded-[2.5rem] border transition-all flex items-center gap-4 ${
                activeTab === tab.id
                  ? "bg-white border-orange-500/10 shadow-sm text-orange-600"
                  : "bg-transparent border-transparent text-gray-400 hover:bg-white hover:border-gray-100"
              }`}
            >
              {tab.icon}
              <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="md:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10">
          {activeTab === "general" && (
            <div className="space-y-6">
              {loading ? (
                <div className="flex items-center gap-3 text-gray-400">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    Chargement...
                  </span>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Nom affiché
                    </label>
                    <input
                      id="admin-display-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-6 py-4 font-bold text-[#0F172A]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                      Email (lecture seule)
                    </label>
                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      value={form.email}
                      disabled
                      className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-gray-400"
                    />
                  </div>
                  {message && (
                    <p className="text-sm font-bold text-green-600">{message}</p>
                  )}
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-orange-600 text-white px-10 py-4 rounded-full text-[10px] font-black uppercase tracking-widest disabled:opacity-50"
                  >
                    {saving ? "Enregistrement..." : "Enregistrer"}
                  </button>
                </>
              )}
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <p className="text-sm text-gray-600 font-medium">
                Pour changer votre mot de passe administrateur, utilisez la réinitialisation
                par email.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block bg-[#0F172A] text-white px-8 py-4 rounded-full text-[10px] font-black uppercase tracking-widest"
              >
                Réinitialiser le mot de passe
              </Link>
            </div>
          )}

          {activeTab === "notifications" && <IntegrationsStatusPanel />}
        </div>
      </div>
    </div>
  );
}
