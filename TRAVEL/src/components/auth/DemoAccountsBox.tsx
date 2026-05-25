"use client";

import { DEMO_ACCOUNTS } from "@/lib/demo-accounts";

type Portal = "client" | "agency" | "admin" | "all";
type DemoAccount = (typeof DEMO_ACCOUNTS)[number];

function showDemoAccounts() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.NEXT_PUBLIC_SHOW_DEMO_ACCOUNTS === "true"
  );
}

export function DemoAccountsBox({
  portal,
  onSelectAccount,
}: {
  portal: Portal;
  onSelectAccount?: (account: DemoAccount) => void;
}) {
  if (!showDemoAccounts()) return null;
  const items =
    portal === "all"
      ? DEMO_ACCOUNTS
      : DEMO_ACCOUNTS.filter((a) => {
          if (portal === "client") return a.loginPath === "/login";
          if (portal === "agency") return a.loginPath === "/agency/login";
          return a.loginPath === "/admin/login";
        });

  return (
    <div className="bg-gray-50 border border-dashed border-gray-200 p-5 rounded-xl">
      <p className="text-xs font-black text-gray-500 uppercase tracking-widest mb-3 text-center">
        Comptes de démonstration
      </p>
      <ul className="space-y-2 text-left">
        {items.map((a) => (
          <li key={a.email}>
            <button
              type="button"
              onClick={() => onSelectAccount?.(a)}
              className={`w-full text-left text-[11px] font-bold text-gray-600 bg-white rounded-lg px-3 py-2 border border-gray-100 ${
                onSelectAccount
                  ? "hover:border-orange-300 hover:bg-orange-50/50 cursor-pointer transition-colors"
                  : ""
              }`}
            >
              <span className="text-orange-600 uppercase tracking-widest text-[9px] block mb-0.5">
                {a.label}
              </span>
              <span className="font-mono">{a.email}</span>
              <span className="text-gray-400"> / </span>
              <span className="font-mono">{a.password}</span>
              {onSelectAccount && (
                <span className="block text-[9px] text-orange-500 font-black uppercase tracking-widest mt-1">
                  Cliquer pour remplir
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {portal !== "all" && (
        <p className="text-[10px] text-gray-400 mt-3 text-center font-medium">
          Utilisez uniquement le compte correspondant à cette page de connexion.
        </p>
      )}
    </div>
  );
}
