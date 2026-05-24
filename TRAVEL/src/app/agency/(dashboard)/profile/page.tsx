"use client";

import { useEffect, useState } from "react";
import { User, Mail, MapPin, ShieldCheck, Globe } from "lucide-react";

type AgencyProfile = {
  name: string;
  managerName: string;
  email: string;
  city: string;
  country: string;
  siret: string;
  verificationStatus: string;
};

export default function AgencyProfilePage() {
  const [agency, setAgency] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/agency/me");
        if (res.ok) {
          const data = await res.json();
          setAgency(data.agency);
        }
      } catch {
        /* ignore */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
        Chargement...
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="max-w-4xl py-20 text-center text-gray-400 font-bold">
        Impossible de charger le profil agence.
      </div>
    );
  }

  const isVerified = agency.verificationStatus === "VERIFIED";
  const initial = agency.name?.[0]?.toUpperCase() || "A";

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Profil Agence</h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
          Informations enregistrées sur la plateforme
        </p>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#0F172A] h-32 relative">
          <div className="absolute -bottom-12 left-10 w-24 h-24 bg-orange-600 rounded-[2rem] border-4 border-white flex items-center justify-center text-white font-black text-2xl shadow-xl">
            {initial}
          </div>
        </div>
        <div className="pt-20 px-10 pb-10 space-y-8">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-black text-[#0F172A]">{agency.name}</h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                <ShieldCheck
                  size={14}
                  className={isVerified ? "text-green-500" : "text-amber-500"}
                />
                {isVerified ? "Agence vérifiée" : `Statut : ${agency.verificationStatus}`}
              </p>
              <p className="text-sm text-gray-500 font-medium mt-2">
                Responsable : {agency.managerName}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-gray-500 font-bold">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <Mail size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Email contact
                  </p>
                  <p className="text-sm text-[#0F172A]">{agency.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-500 font-bold">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <User size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    SIRET / identifiant
                  </p>
                  <p className="text-sm text-[#0F172A]">{agency.siret}</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 text-gray-500 font-bold">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <MapPin size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Siège social
                  </p>
                  <p className="text-sm text-[#0F172A]">
                    {agency.city}, {agency.country}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-gray-500 font-bold">
                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                  <Globe size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    Plateforme
                  </p>
                  <p className="text-sm text-[#0F172A]">MaghrebVoyage</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
