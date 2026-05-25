"use client";

import { useState, useEffect } from "react";
import { Settings, Lock, Bell, CreditCard, Shield, Check, Loader2 } from "lucide-react";

const VERIFICATION_LABELS: Record<string, { label: string; className: string }> = {
  VERIFIED: { label: "Compte vérifié", className: "bg-green-50 text-green-700 border-green-100" },
  PENDING: { label: "En attente de validation", className: "bg-orange-50 text-orange-700 border-orange-100" },
  UNDER_REVIEW: { label: "Dossier en revue", className: "bg-blue-50 text-blue-700 border-blue-100" },
  REJECTED: { label: "Dossier refusé", className: "bg-red-50 text-red-700 border-red-100" },
  SUSPENDED: { label: "Compte suspendu", className: "bg-gray-800 text-white border-gray-800" },
};

export default function AgencySettingsPage() {
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
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = () => {
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
                      <input id="currentPass" type="password" placeholder="••••••••" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A]" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="newPass" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Nouveau mot de passe</label>
                      <input id="newPass" type="password" placeholder="Min. 8 caractères" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A]" />
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
                      { id: "email_res", label: "Nouvelles réservations", desc: "Recevez un email à chaque nouvelle vente." },
                      { id: "email_pay", label: "Paiements reçus", desc: "Soyez informé des virements et acomptes." },
                      { id: "email_news", label: "Newsletter Partenaires", desc: "Actualités et conseils pour les agences." },
                    ].map((pref) => (
                      <div key={pref.id} className="flex items-center justify-between p-4 bg-[#F8FAFC] rounded-2xl border border-gray-50">
                        <div>
                          <p className="text-sm font-black text-[#0F172A]">{pref.label}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{pref.desc}</p>
                        </div>
                        <div className="w-12 h-6 bg-orange-500 rounded-full relative cursor-pointer">
                          <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "payments" && (
              <div className="space-y-8 animate-in fade-in duration-500">
                <div className="space-y-6">
                  <h3 className="text-lg font-black text-[#0F172A]">Informations bancaires</h3>
                  <div className="p-6 bg-orange-50 border border-orange-100 rounded-3xl flex items-start gap-4">
                    <Shield className="text-orange-600 shrink-0" size={24} />
                    <div>
                      <p className="text-sm font-black text-orange-900">Versements via Stripe Connect</p>
                      <p className="text-xs font-medium text-orange-700 mt-1 leading-relaxed">
                        Vos revenus sont transférés automatiquement sur votre compte bancaire une fois les acomptes validés.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="iban" className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">RIB / IBAN principal</label>
                    <input id="iban" type="text" defaultValue="FR76 1234 5678 9012 3456 7890 123" className="w-full bg-[#F8FAFC] border border-gray-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-orange-500/10 outline-none font-bold text-[#0F172A]" />
                  </div>
                </div>
              </div>
            )}

            <div className="pt-10 border-t border-gray-50 flex justify-end">
               <button 
                 onClick={handleSave}
                 className={`flex items-center gap-3 px-10 py-4 rounded-full text-xs font-black uppercase tracking-widest transition-all ${
                   isSaved ? "bg-emerald-500 text-white" : "bg-[#0F172A] text-white hover:bg-black"
                 }`}
               >
                  {isSaved ? (
                    <>Modifications enregistrées <Check size={16} /></>
                  ) : (
                    "Sauvegarder les modifications"
                  )}
               </button>
            </div>
         </div>
      </div>
    </div>
  );
}
