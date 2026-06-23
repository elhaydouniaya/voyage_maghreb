/**
 * Smoke-test VAPI webhook tool call (search_trips) with HMAC signature.
 * Usage: node scripts/test-vapi-tool.mjs [baseUrl]
 */
import "dotenv/config";
import crypto from "node:crypto";

const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const secret = process.env.VAPI_WEBHOOK_SECRET?.trim();

if (!secret) {
  console.error("VAPI_WEBHOOK_SECRET missing in .env");
  process.exit(1);
}

const body = JSON.stringify({
  message: {
    type: "tool-calls",
    toolCallList: [
      {
        id: "smoke-search-trips",
        function: {
          name: "search_trips",
          arguments: JSON.stringify({
            destination: "Maroc",
            numberOfTravelers: 2,
            budgetMax: 2000,
          }),
        },
      },
    ],
  },
});

const signature = crypto.createHmac("sha256", secret).update(body).digest("hex");

const res = await fetch(`${base}/api/vapi/webhook`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-vapi-signature": signature,
  },
  body,
});

const data = await res.json().catch(() => ({}));
console.log(`HTTP ${res.status}`);
console.log(JSON.stringify(data, null, 2));

const result = data.results?.[0]?.result;
if (result) {
  const parsed = JSON.parse(result);
  console.log(`\nTrips found: ${parsed.trips?.length ?? 0}`);
  for (const t of parsed.trips || []) {
    console.log(`  - ${t.title} (${t.destination}) ${t.compatibility}%`);
  }
}

const code = !res.ok ? 1 : data.results?.length ? 0 : 1;
setTimeout(() => process.exit(code), 50);
