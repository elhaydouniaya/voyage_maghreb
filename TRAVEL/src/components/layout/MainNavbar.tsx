"use client";

import Link from "next/link";
import { useState } from "react";
import { Globe, Menu, X } from "lucide-react";
import { NavbarAuth } from "@/components/auth/NavbarAuth";
import { usePathname } from "next/navigation";

export default function MainNavbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "Voyages", href: "/voyages" },
    { label: "Destinations", href: "/destinations" },
    { label: "À propos", href: "/about" },
  ];

  return (
    <>
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md px-6 md:px-12 py-5 flex justify-between items-center z-50 border-b border-gray-50/50">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
            <Globe size={18} />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#0F172A]">MaghrebVoyage</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-10 text-[13px] font-bold text-gray-500">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link 
                key={link.href} 
                href={link.href} 
                className={`hover:text-orange-500 transition-colors ${isActive ? "text-orange-600 font-black" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-4">
           <div className="hidden md:block">
              <NavbarAuth />
           </div>
           
           {/* Mobile Toggle */}
           <button 
             onClick={() => setIsMenuOpen(!isMenuOpen)}
             className="md:hidden p-2 text-[#0F172A] hover:bg-gray-100 rounded-xl transition-all"
             title="Menu"
           >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[40] bg-white pt-24 px-8 md:hidden animate-in slide-in-from-top duration-500">
           <div className="flex flex-col gap-8">
              {navLinks.map((link) => (
                <Link 
                  key={link.href} 
                  href={link.href} 
                  onClick={() => setIsMenuOpen(false)}
                  className="text-3xl font-black text-[#0F172A] tracking-tighter"
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-8 border-t border-gray-50">
                 <NavbarAuth />
              </div>
           </div>
        </div>
      )}
    </>
  );
}
