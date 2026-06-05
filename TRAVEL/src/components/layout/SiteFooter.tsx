import Link from "next/link";
import { Globe } from "lucide-react";

const LEGAL_LINKS = [
  { href: "/legal/mentions", label: "Mentions légales" },
  { href: "/legal/cgu", label: "CGV" },
  { href: "/legal/confidentialite", label: "Confidentialité" },
  { href: "/legal/remboursements", label: "Remboursements" },
];

export default function SiteFooter({ variant = "light" }: { variant?: "light" | "dark" }) {
  const isDark = variant === "dark";

  return (
    <footer
      className={
        isDark
          ? "bg-[#0F172A] py-16 px-6 border-t border-white/5"
          : "bg-white py-16 px-6 border-t border-gray-100"
      }
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center text-white">
            <Globe size={22} />
          </div>
          <span
            className={`text-xl font-black tracking-tight ${isDark ? "text-white" : "text-[#0F172A]"}`}
          >
            MaghrebVoyage
          </span>
        </div>

        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={false}
              className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${
                isDark
                  ? "text-gray-400 hover:text-orange-400"
                  : "text-gray-400 hover:text-orange-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/about"
            prefetch={false}
            className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${
              isDark ? "text-gray-400 hover:text-orange-400" : "text-gray-400 hover:text-orange-600"
            }`}
          >
            À propos
          </Link>
          <Link
            href="/agency/login"
            prefetch={false}
            className={`text-[11px] font-bold uppercase tracking-widest transition-colors ${
              isDark ? "text-gray-400 hover:text-orange-400" : "text-gray-400 hover:text-orange-600"
            }`}
          >
            Espace agence
          </Link>
        </div>

        <p
          className={`text-[10px] font-bold uppercase tracking-widest text-center ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          © {new Date().getFullYear()} MaghrebVoyage — Voyages au Maghreb
        </p>
      </div>
    </footer>
  );
}
