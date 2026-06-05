/**
 * Merge missing .env keys from .env.example (never overwrites existing values).
 * Generates VAPI_WEBHOOK_SECRET when absent.
 * Usage: node scripts/fill-missing-env.mjs
 */
import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");

if (!existsSync(envPath)) {
  console.error("Missing .env — copy .env.example first: copy .env.example .env");
  process.exit(1);
}

const DEFAULTS = {
  GROQ_API_KEY: "",
  GROQ_MODEL: "llama-3.3-70b-versatile",
  STRIPE_CONNECT_DEFAULT_COUNTRY: "FR",
  PLATFORM_FEE_PERCENT: "12",
  NEXT_PUBLIC_VAPI_PUBLIC_KEY: "",
  NEXT_PUBLIC_VAPI_ASSISTANT_ID: "",
  VAPI_WEBHOOK_SECRET: randomBytes(24).toString("hex"),
};

function parseEnv(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) map.set(m[1], m[2]);
  }
  return map;
}

const raw = readFileSync(envPath, "utf8");
const current = parseEnv(raw);
const added = [];

for (const [key, value] of Object.entries(DEFAULTS)) {
  if (!current.has(key)) {
    added.push(key);
    current.set(key, JSON.stringify(value));
  }
}

if (!added.length) {
  console.log("All optional env keys already present in .env");
  process.exit(0);
}

const blocks = [];

if (added.some((k) => k.startsWith("GROQ"))) {
  blocks.push(
    "",
    "# Groq — recommandé (gratuit) : https://console.groq.com → API Keys",
    `GROQ_API_KEY=${current.get("GROQ_API_KEY")}`,
    `GROQ_MODEL=${current.get("GROQ_MODEL")}`
  );
}

if (added.some((k) => k.startsWith("STRIPE_CONNECT") || k === "PLATFORM_FEE_PERCENT")) {
  blocks.push(
    "",
    "# Stripe Connect + commission plateforme",
    `STRIPE_CONNECT_DEFAULT_COUNTRY=${current.get("STRIPE_CONNECT_DEFAULT_COUNTRY")}`,
    `PLATFORM_FEE_PERCENT=${current.get("PLATFORM_FEE_PERCENT")}`
  );
}

if (added.some((k) => k.includes("VAPI"))) {
  blocks.push(
    "",
    "# VAPI guide vocal (optionnel) — https://dashboard.vapi.ai",
    `NEXT_PUBLIC_VAPI_PUBLIC_KEY=${current.get("NEXT_PUBLIC_VAPI_PUBLIC_KEY")}`,
    `NEXT_PUBLIC_VAPI_ASSISTANT_ID=${current.get("NEXT_PUBLIC_VAPI_ASSISTANT_ID")}`,
    `VAPI_WEBHOOK_SECRET=${current.get("VAPI_WEBHOOK_SECRET")}`
  );
}

const next = raw.trimEnd() + blocks.join("\n") + "\n";
writeFileSync(envPath, next, "utf8");

console.log("Added to .env:", added.join(", "));
if (added.includes("GROQ_API_KEY")) {
  console.log("→ Paste your Groq key: https://console.groq.com (free tier)");
}
if (added.some((k) => k.includes("VAPI"))) {
  console.log("→ VAPI public key + assistant ID still need dashboard.vapi.ai");
}
