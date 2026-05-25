/**
 * Smoke test for production server (run after npm run build && npm run start).
 * Usage: node scripts/smoke-prod.mjs [baseUrl]
 */
const base = (process.argv[2] || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

const routes = [
  { path: "/", label: "Home" },
  { path: "/login", label: "Login" },
  { path: "/register", label: "Register" },
  { path: "/profile", label: "Profile" },
  { path: "/voyages", label: "Voyages" },
  { path: "/destinations", label: "Destinations" },
  { path: "/about", label: "About" },
  { path: "/reviews", label: "Reviews" },
  { path: "/recherche", label: "Recherche IA" },
  { path: "/agency/login", label: "Agency login" },
  { path: "/admin/login", label: "Admin login" },
  { path: "/legal/mentions", label: "Legal" },
  { path: "/api/trips", label: "API trips" },
  { path: "/api/auth/session", label: "API session" },
];

const results = [];

for (const { path, label } of routes) {
  const url = `${base}${path}`;
  try {
    const res = await fetch(url, { redirect: "manual" });
    const ok = res.status >= 200 && res.status < 400;
    results.push({ label, path, status: res.status, ok });
  } catch (e) {
    results.push({ label, path, status: 0, ok: false, error: e.message });
  }
}

const failed = results.filter((r) => !r.ok);
console.log(JSON.stringify({ base, passed: results.length - failed.length, total: results.length, routes: results }, null, 2));
process.exit(failed.length ? 1 : 0);
