"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";

type AuditLogRow = {
  id: string;
  action: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  details: Record<string, unknown>;
  date: string;
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/audit-logs", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Impossible de charger les journaux.");
        setLogs([]);
        return;
      }
      setLogs(data.logs || []);
    } catch {
      setError("Erreur réseau.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            href="/admin/dashboard"
            className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition-all"
          >
            <ArrowLeft size={20} className="text-[#0F172A]" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-[#0F172A] tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-orange-500" size={28} />
              Journal d&apos;audit
            </h1>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">
              Traçabilité des actions critiques (CDC §7)
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-[2rem] text-sm font-bold">
          {error}
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-20 text-gray-400 font-bold">
            <Loader2 className="animate-spin" size={20} />
            Chargement...
          </div>
        ) : logs.length === 0 ? (
          <p className="text-center py-20 text-gray-400 font-bold">Aucune entrée d&apos;audit.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Action</th>
                  <th className="px-8 py-5">Utilisateur</th>
                  <th className="px-8 py-5">Détails</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-[#F8FAFC]/50">
                    <td className="px-8 py-5 text-xs font-bold text-gray-500 whitespace-nowrap">
                      {log.date}
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-xs font-black text-[#0F172A] uppercase tracking-wide">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-xs font-medium text-gray-500">
                      {log.userName || log.userEmail || log.userId || "—"}
                    </td>
                    <td className="px-8 py-5">
                      <pre className="text-[10px] font-mono text-gray-500 max-w-md whitespace-pre-wrap break-all">
                        {JSON.stringify(log.details, null, 0)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
