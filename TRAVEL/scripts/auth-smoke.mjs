/**
 * Authenticated API smoke — client + agency + admin session cookies.
 * Usage: node scripts/auth-smoke.mjs [baseUrl]
 */
import "dotenv/config";

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");

const ACCOUNTS = [
  {
    role: "CLIENT",
    email: "client@test.com",
    password: "client123",
    tests: [
      { path: "/api/bookings/me", label: "client_bookings" },
      { path: "/api/ai/guide-chat", label: "client_guide_chat" },
      { path: "/api/user/ai-status", label: "client_ai_status" },
      { path: "/api/ai/history", label: "client_ai_history" },
      { path: "/api/favorites", label: "client_favorites" },
    ],
  },
  {
    role: "AGENCY",
    email: "agency@test.com",
    password: "agency123",
    tests: [
      { path: "/api/agency/dashboard", label: "agency_dashboard" },
      { path: "/api/agency/bookings", label: "agency_bookings" },
      { path: "/api/agency/leads", label: "agency_leads" },
      { path: "/api/agency/me", label: "agency_me" },
      { path: "/api/agency/stripe-connect", label: "agency_stripe_connect" },
      { path: "/api/agency/notifications", label: "agency_notifications" },
    ],
  },
  {
    role: "ADMIN",
    email: "admin@maghrebvoyage.com",
    password: "admin123",
    tests: [
      { path: "/api/admin/dashboard", label: "admin_dashboard" },
      { path: "/api/admin/bookings", label: "admin_bookings" },
      { path: "/api/admin/payments", label: "admin_payments" },
      { path: "/api/admin/system-status", label: "admin_system_status" },
      {
        path: "/api/admin/decision-dashboard",
        label: "admin_decision_dashboard",
        retries: 2,
      },
      { path: "/api/admin/notifications", label: "admin_notifications" },
      { path: "/api/admin/analytics", label: "admin_analytics" },
    ],
  },
];

async function getCsrf() {
  const res = await fetch(`${base}/api/auth/csrf`);
  const data = await res.json();
  const cookie = res.headers.get("set-cookie") || "";
  return { csrfToken: data.csrfToken, cookie };
}

async function signIn(email, password) {
  const { csrfToken, cookie: csrfCookie } = await getCsrf();
  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    json: "true",
  });

  const res = await fetch(`${base}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfCookie.split(";")[0] || "",
    },
    body,
    redirect: "manual",
  });

  const setCookie = res.headers.getSetCookie?.() || [];
  const sessionCookie = setCookie
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");

  if (!sessionCookie && res.status !== 200 && res.status !== 302) {
    throw new Error(`Sign-in failed HTTP ${res.status}`);
  }

  return sessionCookie || csrfCookie;
}

async function testAuthed(cookie, path, options = {}) {
  const { method = "GET", body } = options;
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Cookie: cookie,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* ignore */
  }
  return { status: res.status, ok: res.ok, data };
}

const results = [];

for (const account of ACCOUNTS) {
  try {
    const cookie = await signIn(account.email, account.password);
    results.push({ name: `login_${account.role.toLowerCase()}`, ok: true });

    for (const t of account.tests) {
      const expectOk = t.expectOk !== false;
      let passed = false;
      let lastDetail = "";

      const attempts = (t.retries ?? 0) + 1;
      for (let i = 0; i < attempts; i++) {
        const { status, ok, data } = await testAuthed(cookie, t.path, {
          method: t.method,
          body: t.body,
        });
        passed = expectOk ? ok && status === 200 : status === (t.expectStatus ?? 200);
        lastDetail = passed
          ? `HTTP ${status}`
          : `HTTP ${status}: ${data?.error || "fail"}`;
        if (passed) break;
        if (i < attempts - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      results.push({
        name: t.label,
        ok: passed,
        detail: lastDetail,
      });
    }

    await fetch(`${base}/api/auth/signout`, {
      method: "POST",
      headers: { Cookie: cookie },
    });
  } catch (e) {
    results.push({
      name: `login_${account.role.toLowerCase()}`,
      ok: false,
      detail: e.message,
    });
  }
}

const failed = results.filter((r) => !r.ok);
console.log(
  JSON.stringify(
    { base, passed: results.length - failed.length, total: results.length, results },
    null,
    2
  )
);
process.exit(failed.length ? 1 : 0);
