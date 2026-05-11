"use client";

import { User, Mail, Phone, MapPin, ShieldCheck, Globe } from "lucide-react";

export default function AgencyProfilePage() {
  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-black text-[#0F172A] tracking-tight">Profil Agence</h1>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Gérez vos informations publiques et privées</p>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-[#0F172A] h-32 relative">
           <div className="absolute -bottom-12 left-10 w-24 h-24 bg-orange-600 rounded-[2rem] border-4 border-white flex items-center justify-center text-white font-black text-2xl shadow-xl">
              S
           </div>
        </div>
        <div className="pt-20 px-10 pb-10 space-y-8">
           <div className="flex justify-between items-start">
              <div>
                 <h2 className="text-2xl font-black text-[#0F172A]">Sahara Explorer</h2>
                 <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2">
                    <ShieldCheck size={14} className="text-green-500" /> Agence Vérifiée
                 </p>
              </div>
              <button className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all">
                 Modifier le profil
              </button>
           </div>

           <div className="grid grid-cols-2 gap-8 pt-8 border-t border-gray-50">
              <div className="space-y-6">
                 <div className="flex items-center gap-4 text-gray-500 font-bold">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                       <Mail size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Email Contact</p>
                       <p className="text-sm text-[#0F172A]">contact@sahara-explorer.com</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 text-gray-500 font-bold">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                       <Phone size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Téléphone</p>
                       <p className="text-sm text-[#0F172A]">+213 6 12 34 56 78</p>
                    </div>
                 </div>
              </div>
              <div className="space-y-6">
                 <div className="flex items-center gap-4 text-gray-500 font-bold">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                       <MapPin size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Siège Social</p>
                       <p className="text-sm text-[#0F172A]">Djanet, Algérie</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4 text-gray-500 font-bold">
                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                       <Globe size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Site Web</p>
                       <p className="text-sm text-[#0F172A]">www.sahara-explorer.com</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
