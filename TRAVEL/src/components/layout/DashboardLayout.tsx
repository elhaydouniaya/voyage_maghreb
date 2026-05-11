import React from "react";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Map, 
  Handshake, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut,
  Bell,
  Search,
  Plus
} from "lucide-react";

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  userType: "ADMIN" | "AGENCY" | "CLIENT";
  userName: string;
  sidebarItems: SidebarItem[];
}

export default function DashboardLayout({
  children,
  userType,
  userName,
  sidebarItems
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-[#0F172A] flex flex-col shrink-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="p-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#2563EB] rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#2563EB]/30">M</div>
            <div className="flex flex-col leading-tight">
               <span className="text-xl font-black tracking-tight text-white italic">Voyage<span className="text-[#2563EB]">AI</span></span>
               <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Agency Portal</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all duration-300 ${
                item.active 
                  ? "bg-[#2563EB] text-white shadow-xl shadow-[#2563EB]/20" 
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className={item.active ? "text-white" : "text-gray-500"}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 space-y-2">
          <Link
            href="/settings"
            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            <Settings size={20} />
            Paramètres
          </Link>
          <div className="flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-all cursor-pointer group">
            <LogOut size={20} />
            Déconnexion
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-24 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-10 shrink-0 z-10">
          <div>
            <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">Bienvenue, {userName} 👋</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Tableau de bord • {userType}</p>
          </div>

          <div className="flex items-center gap-8">
            <div className="relative hidden xl:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="Rechercher une réservation..." 
                className="bg-gray-50 border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-[#2563EB]/10 w-80 transition-all"
              />
            </div>
            <div className="flex items-center gap-4">
               <button className="relative p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#2563EB] hover:border-[#2563EB]/20 transition-all shadow-sm">
                 <Bell size={20} />
                 <span className="absolute top-3 right-3 w-2 h-2 bg-[#F59E0B] rounded-full border-2 border-white"></span>
               </button>
               <div className="h-10 w-px bg-gray-100 mx-2" />
               <div className="flex items-center gap-4">
                 <div className="text-right hidden sm:block">
                   <div className="text-sm font-black text-[#0F172A]">{userName}</div>
                   <div className="text-[10px] text-[#2563EB] font-black uppercase tracking-wider">Compte Agence</div>
                 </div>
                 <div className="w-12 h-12 bg-gradient-to-tr from-[#2563EB] to-[#0EA5E9] rounded-2xl shadow-lg shadow-[#2563EB]/20 flex items-center justify-center font-black text-white text-xl">
                   {userName.charAt(0)}
                 </div>
               </div>
            </div>
          </div>
        </header>

        {/* Page Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
