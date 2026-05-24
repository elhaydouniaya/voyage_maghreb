"use client";

import { useEffect, useState } from "react";
import { Mail, User, ShieldCheck, Globe } from "lucide-react";

export default function AdminProfilePage() {
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    fetch("/api/user/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => undefined);
  }, []);

  if (!user) {
    return (
      <div className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
        Chargement...
      </div>
    );
  }

  const initial = user.name?.[0]?.toUpperCase() || "A";

  return (
    <div className="max-w-4xl space-y-8">
      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#0F172A] h-32 relative">
          <div className="absolute -bottom-12 left-10 w-24 h-24 bg-orange-600 rounded-[2rem] border-4 border-white flex items-center justify-center text-white font-black text-2xl shadow-xl">
            {initial}
          </div>
        </div>
        <div className="pt-20 px-10 pb-10 space-y-8">
          <div>
            <h1 className="text-2xl font-black text-[#0F172A]">{user.name}</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
              <ShieldCheck size={14} className="text-green-500" />
              Administrateur MaghrebVoyage
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Email
                </p>
                <p className="text-sm font-bold text-[#0F172A]">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                <User size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Rôle
                </p>
                <p className="text-sm font-bold text-[#0F172A]">ADMIN</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                <Globe size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                  Accès
                </p>
                <p className="text-sm font-bold text-[#0F172A]">Panneau de supervision</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
