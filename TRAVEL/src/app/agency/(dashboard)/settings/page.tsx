"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Settings,
  Lock,
  Bell,
  CreditCard,
  Shield,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";

const VERIFICATION_LABELS: Record<string, { label: string; className: string }> = {
  VERIFIED: { label: "Compte vérifié", className: "bg-green-50 text-green-700 border-green-100" },
  PENDING: { label: "En attente de validation", className: "bg-orange-50 text-orange-700 border-orange-100" },
  UNDER_REVIEW: { label: "Dossier en revue", className: "bg-blue-50 text-blue-700 border-blue-100" },
  REJECTED: { label: "Dossier refusé", className: "bg-red-50 text-red-700 border-red-100" },
  SUSPENDED: { label: "Compte suspendu", className: "bg-gray-800 text-white border-gray-800" },
};

type StripeConnectStatus = {
  configured: boolean;
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  onboardingComplete: boolean;
  requiresAction: boolean;
};

function AgencySettingsContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("general");
  const [isSaved, setIsSaved] = useState(false);
  const [agency, setAgency] = useState<{
    name: string;
    siret: string;
    email: string;
    managerName: string;
    city: string;
    country: string;
    verificationStatus: string;
    verificationNote: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<StripeConnectStatus | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [stripeMessage, setStripeMessage] = useState("");
  const [notifyBookingsEmail, setNotifyBookingsEmail] = useState(true);
  const [notifyPaymentsEmail, setNotifyPaymentsEmail] = useState(true);
  const [notifyPartnerNewsletter, setNotifyPartnerNewsletter] = useState(false);

  const loadStripeStatus = () => {
    return fetch("/api/agency/stripe-connect", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.status) setStripeStatus(data.status);
      })
      .catch(() => {
        /* ignore */
      });
  };

  useEffect(() => {
    if (searchParams.get("stripe") === "return") {
      setStripeMessage("Retour Stripe — mise à jour du statut de votre compte…");
      setActiveTab("payments");
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "payments") {
      setStripeLoading(true);
      loadStripeStatus().finally(() => setStripeLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    fetch("/api/agency/me", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data.agency) {
          setAgency({
            name: data.agency.name,
            siret: data.agency.siret ?? "",
            email: data.agency.email,
            managerName: data.agency.managerName,
            city: data.agency.city,
            country: data.agency.country,
            verificationStatus: data.agency.verificationStatus,
            verificationNote: data.agency.verificationNote,
          });
          setNotifyBookingsEmail(data.agency.notifyBookingsEmail ?? true);
          setNotifyPaymentsEmail(data.agency.notifyPaymentsEmail ?? true);
          setNotifyPartnerNewsletter(data.agency.notifyPartnerNewsletter ?? false);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaveError("");

    if (activeTab === "security") {
      if (!currentPassword || !newPassword) {
        setSaveError("Renseignez les deux mots de passe.");
        return;
      }
      setSaving(true);
      try {
        const res = await fetch("/api/agency/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSaveError(data.error || "Échec de la mise à jour.");
          return;
        }
        setCurrentPassword("");
        setNewPassword("");
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } catch {
        setSaveError("Erreur réseau.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (activeTab === "notifications") {
      setSaving(true);
      try {
        const res = await fetch("/api/agency/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "notifications",
            notifyBookingsEmail,
            notifyPaymentsEmail,
            notifyPartnerNewsletter,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSaveError(data.error || "Échec de la mise à jour.");
          return;
        }
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
      } catch {
        setSaveError("Erreur réseau.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (activeTab === "payments") {
      return;
    }

    if (activeTab === "general") {
      return;
    }

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const tabs = [
    { id: "general", label: "Général", icon: <Settings size={20} /> },
    { id: "security", label: "Sécurité", icon: <Lock size={20} /> },
    { id: "notifications", label: "Notifications", icon: <Bell size={20} /> },
    { id: "payments", label: "Paiements", icon: <CreditCard size={20} /> },
  ];

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Paramètres</h1>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Configurez vos préférences et la sécurité</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="md:col-span-1 space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full p-6 rounded-[2.5rem] border transition-all flex items-center gap-4 ${
                  activeTab === tab.id 
                    ? "bg-white border-orange-500/10 shadow-sm text-orange-600" 
                    : "bg-transparent border-transparent text-gray-400 hover:bg-white hover:border-gray-100 hover:text-[#0F172A]"
                }`}
              >
                {tab.icon}
                <span className="text-xs font-black uppercase tracking-widest">{tab.label}</span>
              </button>
            ))}
         </div>

         <div className="md:col-span-2 bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10">
            {activeTab === "general" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                {loading ? (
                  <div className="flex items-center gap-3 text-gray-400 py-8">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Chargement...
                    </span>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {agency && (
                      <div
                        className={`p-6 rounded-3xl border flex items-start gap-4 ${
                          VERIFICATION_LABELS[agency.verificationStatus]?.className ??
                          "bg-gray-50 border-gray-100"
                        }`}
                      >
                        <Shield className="shrink-0" size={24} />
                        <div>
                          <p className="text-sm font-black">
                            {VERIFICATION_LABELS[agency.verificationStatus]?.label ??
                              agency.verificationStatus}
                          </p>
                          {agency.verificationNote && (
                            <p className="text-xs font-medium mt-1 opacity-80">
                              {agency.verificationNote}
                            </p>
                          )}
                          {agency.verificationStatus === "PENDING" && (
                            <p className="text-xs font-medium mt-2 opacity-80">
                              Envoyez vos justificatifs à contact@maghrebvoyage.com.
                              Un administrateur validera votre dossier sous 48h.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    <h3 className="text-lg font-black text-[#0F172A]">
                      Informations de l&apos;agence
                    </h3>
                    <p className="text-xs text-gray-500 font-medium -mt-4">
                      Pour modifier le nom ou le SIRET, contactez{" "}
                      <a href="mailto:contact@maghrebvoyage.com" className="text-orange-600 underline">
                        contact@maghrebvoyage.com
                      </a>
                      .
                    </p>
                    <div className="grid grid-cols-1 gap-6">
                      <div className="space-y-2">
                        <label
                          htmlFor="legalName"
                          className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                        >
                          Nom de l&apos;agence
                        </label>
                        <input
                          id="legalName"
                          type="text"
                          readOnly
                          value={agency?.name ?? ""}
                          className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 outline-none font-bold text-[#0F172A]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="manager"
                          className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                        >
                          Gérant
                        </label>
                        <input
                          id="manager"
                          type="text"
                          readOnly
                          value={agency?.managerName ?? ""}
                          className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 outline-none font-bold text-[#0F172A]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="email"
                          className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                        >
                          Email professionnel
                        </label>
                        <input
                          id="email"
                          type="email"
                          readOnly
                          value={agency?.email ?? ""}
                          className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 outline-none font-bold text-[#0F172A]"
                        />
                      </div>
                      <div className="space-y-2">
                        <label
                          htmlFor="license"
                          className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1"
                        >
                          Numéro SIRET / Licence
                        </label>
                        <input
                          id="license"
                          type="text"
                          readOnly
                          value={agency?.siret ?? ""}
                          className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 outline-none font-bold text-[#0F172A]"
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold">
                        {agency?.city}, {agency?.country}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-[#0F172A]">Sécurité du compte</h3>
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="currentPass" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mot de passe actuel</label>
                      <input id="currentPass" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A]" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="newPass" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                      <input id="newPass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min. 8 caractères" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A]" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-[#0F172A]">Préférences de notification</h3>
                  <div className="space-y-4">
                    {[
                      {
                        id: "bookings",
                        label: "Nouvelles réservations & prospects IA",
                        desc: "Email à chaque vente ou lead qualifié.",
                        value: notifyBookingsEmail,
                        set: setNotifyBookingsEmail,
                      },
                      {
                        id: "payments",
                        label: "Paiements reçus",
                        desc: "Récapitulatif net Stripe Connect après chaque acompte.",
                        value: notifyPaymentsEmail,
                        set: setNotifyPaymentsEmail,
                      },
                      {
                        id: "news",
                        label: "Newsletter partenaires",
                        desc: "Actualités MaghrebVoyage pour agences (opt-in).",
                        value: notifyPartnerNewsletter,
                        set: setNotifyPartnerNewsletter,
                      },
                    ].map((pref) => (
                      <div
                        key={pref.id}
                        className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border border-gray-50"
                      >
                        <div>
                          <p className="text-sm font-black text-[#0F172A]">{pref.label}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {pref.desc}
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={pref.value}
                          onClick={() => pref.set(!pref.value)}
                          className={`w-12 h-6 rounded-full relative transition-colors ${
                            pref.value ? "bg-orange-500" : "bg-gray-200"
                          }`}
                        >
                          <span
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
                              pref.value ? "right-1" : "left-1"
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-[#0F172A]">Versements Stripe Connect</h3>

                  {stripeMessage && (
                    <p className="text-sm font-medium text-orange-700 bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
                      {stripeMessage}
                    </p>
                  )}

                  <div className="p-6 bg-[#F8FAFC] border border-gray-100 rounded-3xl space-y-4">
                    {stripeLoading ? (
                      <div className="flex items-center gap-3 text-gray-400">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-xs font-bold uppercase tracking-widest">
                          Chargement Stripe…
                        </span>
                      </div>
                    ) : stripeStatus ? (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <StatusPill
                            ok={stripeStatus.onboardingComplete}
                            label={
                              stripeStatus.onboardingComplete
                                ? "Compte actif"
                                : "Configuration requise"
                            }
                          />
                          <StatusPill
                            ok={stripeStatus.chargesEnabled}
                            label="Encaissements"
                          />
                          <StatusPill
                            ok={stripeStatus.payoutsEnabled}
                            label="Virements"
                          />
                        </div>
                        {!stripeStatus.configured && (
                          <p className="text-xs text-amber-700 font-medium">
                            Stripe n&apos;est pas configuré sur le serveur (STRIPE_SECRET_KEY).
                          </p>
                        )}
                        {stripeStatus.configured && (
                          <p className="text-xs text-gray-500 font-medium leading-relaxed">
                            Les acomptes clients passent par MaghrebVoyage. Une fois Connect actif,
                            chaque paiement est réparti automatiquement : commission plateforme (~12 %
                            par défaut) + versement sur votre compte Stripe.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-xs text-gray-500">Statut indisponible.</p>
                    )}

                    <button
                      type="button"
                      disabled={stripeLoading || !stripeStatus?.configured}
                      onClick={async () => {
                        setSaveError("");
                        setStripeLoading(true);
                        try {
                          const res = await fetch("/api/agency/stripe-connect", {
                            method: "POST",
                          });
                          const data = await res.json();
                          if (!res.ok || !data.url) {
                            setSaveError(data.error || "Lien Stripe indisponible.");
                            return;
                          }
                          window.location.href = data.url;
                        } catch {
                          setSaveError("Erreur réseau Stripe.");
                        } finally {
                          setStripeLoading(false);
                        }
                      }}
                      className="inline-flex items-center gap-2 bg-[#0F172A] text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all disabled:opacity-50"
                    >
                      {stripeStatus?.onboardingComplete
                        ? "Mettre à jour mon compte Stripe"
                        : "Connecter mon compte Stripe"}
                      <ExternalLink size={14} />
                    </button>
                  </div>

                  <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl flex items-start gap-4">
                    <Shield className="text-orange-600 shrink-0" size={24} />
                    <div>
                      <p className="text-sm font-black text-orange-900">Emails automatiques</p>
                      <p className="text-xs font-medium text-orange-700 mt-1 leading-relaxed">
                        Chaque réservation confirmée et chaque prospect IA qualifié déclenche une
                        notification à l&apos;email professionnel de votre agence.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {saveError && (
              <p className="text-sm font-bold text-red-600 pt-4">{saveError}</p>
            )}

            <div className="pt-10 border-t border-gray-50 flex justify-end">
               {activeTab !== "payments" && activeTab !== "general" && (
               <button 
                 type="button"
                 onClick={handleSave}
                 disabled={saving}
                 className={`flex items-center gap-3 px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all disabled:opacity-60 ${
                   isSaved ? "bg-emerald-500 text-white" : "bg-[#0F172A] text-white hover:bg-black"
                 }`}
               >
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Enregistrement...
                    </>
                  ) : isSaved ? (
                    <>Modifications enregistrées <Check size={16} /></>
                  ) : (
                    "Sauvegarder les modifications"
                  )}
               </button>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
        ok
          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
          : "bg-gray-50 text-gray-500 border-gray-100"
      }`}
    >
      {label}
    </span>
  );
}

export default function AgencySettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs font-bold text-gray-400 uppercase tracking-widest">
          Chargement des paramètres…
        </div>
      }
    >
      <AgencySettingsContent />
    </Suspense>
  );
}
