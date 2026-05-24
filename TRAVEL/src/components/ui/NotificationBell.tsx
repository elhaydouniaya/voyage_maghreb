"use client";

import { useState, useRef, useEffect } from "react";
import { Bell } from "lucide-react";

interface NotificationBellProps {
  count?: number;
  label?: string;
}

export default function NotificationBell({ count = 0, label = "Notifications" }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={label}
        aria-label={count > 0 ? `${label} (${count} non lues)` : label}
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-500 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50/60 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      >
        <Bell size={20} strokeWidth={2.25} />
        {count > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 min-w-[10px] items-center justify-center rounded-full border-2 border-white bg-orange-600 px-0.5 text-[8px] font-black text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl shadow-black/10 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="border-b border-gray-50 bg-[#F8FAFC] px-5 py-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Notifications
            </p>
            <p className="text-sm font-black text-[#0F172A]">Centre d&apos;alertes</p>
          </div>
          <div className="px-5 py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <Bell size={22} />
            </div>
            <p className="text-xs font-bold text-gray-500">
              {count > 0
                ? `${count} notification(s) à consulter`
                : "Aucune nouvelle notification"}
            </p>
            <p className="mt-1 text-[10px] font-medium text-gray-400">
              Réservations et validations apparaîtront ici.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
