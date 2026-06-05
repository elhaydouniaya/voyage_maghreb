"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, Loader2 } from "lucide-react";

export type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  href: string;
  unread?: boolean;
};

interface NotificationBellProps {
  count?: number;
  label?: string;
  /** Fetch URL — e.g. /api/agency/notifications */
  fetchUrl?: string;
  items?: NotificationItem[];
}

export default function NotificationBell({
  count: countProp,
  label = "Notifications",
  fetchUrl,
  items: itemsProp,
}: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>(itemsProp || []);
  const [count, setCount] = useState(countProp ?? 0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (countProp != null) setCount(countProp);
  }, [countProp]);

  useEffect(() => {
    if (itemsProp) setItems(itemsProp);
  }, [itemsProp]);

  useEffect(() => {
    if (!fetchUrl || !open) return;

    let cancelled = false;
    setLoading(true);

    fetch(fetchUrl, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setItems(data.items || []);
        setCount(data.count ?? 0);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchUrl, open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const displayCount = fetchUrl ? count : (countProp ?? items.filter((i) => i.unread).length);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title={label}
        aria-label={
          displayCount > 0 ? `${label} (${displayCount})` : label
        }
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-gray-100 bg-white text-gray-500 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50/60 hover:text-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
      >
        <Bell size={20} strokeWidth={2.25} />
        {displayCount > 0 && (
          <span className="absolute right-2 top-2 flex h-2.5 min-w-[10px] items-center justify-center rounded-full border-2 border-white bg-orange-600 px-0.5 text-[8px] font-black text-white">
            {displayCount > 9 ? "9+" : displayCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 max-h-[420px] overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl shadow-black/10 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col">
          <div className="border-b border-gray-50 bg-[#F8FAFC] px-5 py-4 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Notifications
            </p>
            <p className="text-sm font-black text-[#0F172A]">Centre d&apos;alertes</p>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
                <Loader2 className="animate-spin" size={18} />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Chargement...
                </span>
              </div>
            ) : items.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                  <Bell size={22} />
                </div>
                <p className="text-xs font-bold text-gray-500">
                  Aucune nouvelle alerte
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={`block px-5 py-4 hover:bg-orange-50/40 transition-colors ${
                        item.unread ? "bg-orange-50/20" : ""
                      }`}
                    >
                      <p className="text-xs font-black text-[#0F172A] leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium mt-1">
                        {item.detail}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
