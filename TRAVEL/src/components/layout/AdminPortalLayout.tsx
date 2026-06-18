"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOutToHome } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  CreditCard,
  Globe,
  Sparkles,
  Star,
  Wallet,
  LogOut,
  User,
  UserCircle,
  Settings,
  ShieldCheck,
} from "lucide-react";
import AnimatedLogo from "@/components/brand/AnimatedLogo";

type AdminMe = {
  name: string;
  email: string;
};

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [admin, setAdmin] = useState<AdminMe | null>(null);
  const [pendingAgencies, setPendingAgencies] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [meRes, agRes] = await Promise.all([
          fetch("/api/user/me", { cache: "no-store" }),
          fetch("/api/admin/agencies", { cache: "no-store" }),
        ]);
        if (!cancelled && meRes.ok) {
          const me = await meRes.json();
          if (me.user) {
            setAdmin({ name: me.user.name || "Administrateur", email: me.user.email || "" });
          }
        }
        if (!cancelled && agRes.ok) {
          const ag = await agRes.json();
          const count = (ag.agencies || []).filter(
            (a: { status: string }) =>
              a.status === "PENDING" || a.status === "UNDER_REVIEW"
          ).length;
          setPendingAgencies(count);
        }
      } catch {
        /* ignore */
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayName = admin?.name || "Administrateur";

  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/admin/dashboard", badge: null },
    {
      icon: Briefcase,
      label: "Agences",
      href: "/admin/agencies",
      badge: pendingAgencies > 0 ? String(pendingAgencies) : null,
    },
    { icon: UserCircle, label: "Voyageurs", href: "/admin/clients", badge: null },
    { icon: Globe, label: "Voyages", href: "/admin/trips", badge: null },
    { icon: CreditCard, label: "Réservations", href: "/admin/bookings", badge: null },
    { icon: Wallet, label: "Paiements", href: "/admin/payments", badge: null },
    { icon: Star, label: "Avis clients", href: "/admin/reviews", badge: null },
    { icon: Sparkles, label: "Demandes IA", href: "/admin/ai-requests", badge: null },
    { icon: User, label: "Mon profil", href: "/admin/profile", badge: null },
    { icon: Settings, label: "Paramètres", href: "/admin/settings", badge: null },
  ];

  const pageTitle =
    pathname === "/admin/dashboard"
      ? "Tableau de bord"
      : pathname.includes("/agencies")
        ? "Agences partenaires"
        : pathname.includes("/clients")
          ? "Voyageurs"
          : pathname.includes("/trips")
          ? "Voyages"
          : pathname.includes("/bookings")
            ? "Réservations"
            : pathname.includes("/payments")
              ? "Paiements"
              : pathname.includes("/ai-requests")
              ? "Demandes IA"
              : pathname.includes("/profile")
                ? "Mon profil"
                : pathname.includes("/settings")
                  ? "Paramètres"
                  : "Administration";

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-outfit">
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col fixed h-full z-20">
        <div className="p-8">
          <AnimatedLogo variant="full" theme="dark" size="md" href="/admin/dashboard" />
          <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] mt-4 ml-1">
            Espace administrateur
          </p>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all group ${
                  isActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon
                    size={20}
                    className={
                      isActive ? "text-orange-500" : "group-hover:text-orange-400"
                    }
                  />
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto space-y-3 border-t border-white/10">
          <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <ShieldCheck size={16} className="text-green-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Supervision active
              </span>
            </div>
            <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest truncate">
              {admin?.email || "admin@maghrebvoyage.com"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => signOutToHome()}
            className="w-full flex items-center gap-3 px-6 py-3 bg-orange-600 text-white hover:bg-orange-700 font-bold rounded-2xl transition-all shadow-lg shadow-orange-600/20 hover:shadow-orange-600/40"
          >
            <LogOut size={18} />
            <span className="text-sm">Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-72 p-12">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">
              Bienvenue, {displayName}
            </h2>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
              {pageTitle} · Supervision MaghrebVoyage
            </p>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
}
