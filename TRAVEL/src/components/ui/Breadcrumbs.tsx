"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  if (paths.length === 0) return null;

  return (
    <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8 overflow-x-auto pb-2 scrollbar-hide">
      <Link href="/" className="hover:text-orange-600 flex items-center gap-2 transition-colors">
        <Home size={12} />
        <span>Accueil</span>
      </Link>
      
      {paths.map((path, index) => {
        const href = `/${paths.slice(0, index + 1).join("/")}`;
        const isLast = index === paths.length - 1;
        const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, " ");

        return (
          <div key={path} className="flex items-center gap-3 shrink-0">
            <ChevronRight size={10} className="text-gray-200" />
            {isLast ? (
              <span className="text-orange-600">{label}</span>
            ) : (
              <Link href={href} className="hover:text-orange-600 transition-colors">
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
