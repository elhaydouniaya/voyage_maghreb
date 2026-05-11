"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { 
  LayoutDashboard, 
  Map, 
  CalendarCheck, 
  MessageSquare, 
  User, 
  Settings, 
  LogOut,
  Globe,
  Bell,
  Shield
} from "lucide-react";

export default function AgencyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isVerified = false; // Mock for demo

  const menuItems = [
    { icon: LayoutDashboard, label: "Tableau de bord", href: "/agency/dashboard", badge: null },
    { icon: Map, label: "Mes voyages", href: "/agency/trips", badge: null },
    { icon: CalendarCheck, label: "Réservations", href: "/agency/bookings", badge: "3" },
    { icon: User, label: "Mon profil", href: "/agency/profile", badge: null },
    { icon: Settings, label: "Paramètres", href: "/agency/settings", badge: null },
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0F172A] text-white flex flex-col fixed h-full z-20">
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
               <Globe size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight">MaghrebVoyage</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between px-6 py-4 rounded-2xl transition-all group ${
                  isActive 
                    ? "bg-white/10 text-white" 
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-4">
                  <item.icon size={20} className={isActive ? "text-orange-500" : "group-hover:text-orange-400"} />
                  <span className="text-sm font-bold">{item.label}</span>
                </div>
                {item.badge && (
                  <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 mt-auto">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-4 px-6 py-4 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all"
          >
            <LogOut size={20} />
            <span className="text-sm font-bold">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-72 p-12">
        {/* Verification Alert (CDC Module D.1) */}
        {!isVerified && (
          <div className="mb-10 bg-orange-50 border border-orange-100 p-6 rounded-[2.5rem] flex items-center justify-between animate-in slide-in-from-top-4">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center text-white">
                   <Shield size={24} />
                </div>
                <div>
                   <h4 className="text-sm font-black text-[#0F172A]">Compte en attente de vérification</h4>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Vos voyages ne sont pas encore visibles publiquement.</p>
                </div>
             </div>
             <Link href="/agency/settings" className="bg-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest text-[#0F172A] shadow-sm hover:shadow-md transition-all">
                Vérifier mon statut
             </Link>
          </div>
        )}

        <header className="flex justify-between items-center mb-12">
           <div>
              <h2 className="text-3xl font-black text-[#0F172A] tracking-tight">
                 Bienvenue, Sahara Explorer 👋
              </h2>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                 Voici un aperçu de votre activité
              </p>
           </div>
           <div className="flex items-center gap-6">
              <div className="relative cursor-pointer">
                 <Bell size={24} className="text-gray-400 hover:text-[#0F172A] transition-colors" />
                 <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 border-2 border-white rounded-full" />
              </div>
              <Link 
                href="/agency/trips/new"
                className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl shadow-orange-100"
              >
                + Publier un voyage
              </Link>
           </div>
        </header>
        {children}
      </main>
    </div>
  );
}
