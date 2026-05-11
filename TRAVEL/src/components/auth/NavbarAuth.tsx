"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { User, LogOut, ChevronDown, LayoutDashboard, Bell } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function NavbarAuth() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (status === "loading") {
    return <div className="w-24 h-8 animate-pulse bg-gray-100 rounded-full" />;
  }

  if (session) {
    const name = session.user?.name || "Mon compte";
    const role = (session.user as any).role || "CLIENT";
    const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

    return (
      <div className="flex items-center gap-4 relative" ref={ref}>
        {/* Notification Bell */}
        <button 
          title="Notifications"
          className="relative w-10 h-10 flex items-center justify-center text-gray-400 hover:text-[#0F172A] hover:bg-gray-50 rounded-full transition-all group"
        >
           <Bell size={20} className="group-hover:scale-110 transition-transform" />
           <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 border-2 border-white rounded-full" />
        </button>

        <button
          onClick={() => setOpen(!open)}
          title="Menu utilisateur"
          className="flex items-center gap-2.5 bg-white border border-gray-100 px-4 py-2 rounded-full hover:border-orange-500/30 hover:bg-orange-50/50 transition-all shadow-sm"
        >
          <div className="w-7 h-7 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black text-xs">
            {initials}
          </div>
          <span className="text-sm font-bold text-[#0F172A] hidden md:block max-w-[120px] truncate">
            {name}
          </span>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-100 rounded-3xl shadow-2xl shadow-black/5 overflow-hidden z-50">
            <div className="px-6 py-5 border-b border-gray-50 bg-[#F8FAFC]">
              <p className="text-sm font-black text-[#0F172A] truncate">{name}</p>
              <p className="text-[10px] text-gray-400 font-bold truncate">{session.user?.email}</p>
            </div>
            <div className="py-2">
              <Link
                href={role === "AGENCY" ? "/agency/dashboard" : role === "ADMIN" ? "/admin/dashboard" : "/profile"}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
              >
                <LayoutDashboard size={14} className="text-orange-600" />
                {role === "AGENCY" ? "Tableau de bord" : role === "ADMIN" ? "Panel Admin" : "Mon profil"}
              </Link>
              {role === "AGENCY" && (
                <Link
                  href="/agency/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-[#0F172A] hover:bg-[#F8FAFC] transition-colors"
                >
                  <User size={14} className="text-orange-600" />
                  Profil Agence
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="w-full flex items-center gap-3 px-6 py-3.5 text-xs font-black uppercase tracking-widest text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <Link href="/agency/login" className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-orange-600 transition-colors hidden md:block">
        Espace Agence
      </Link>
      <Link href="/login" className="bg-[#0F172A] text-white text-xs font-black uppercase tracking-widest px-8 py-3 rounded-full hover:bg-black transition-all shadow-lg shadow-black/10">
        Se connecter
      </Link>
    </div>
  );
}
