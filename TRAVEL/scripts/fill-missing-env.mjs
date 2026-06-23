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
  GEMINI_API_KEY: "",
  GEMINI_MODEL: "gemini-1.5-flash",
  GEMINI_DISABLE: "false",
  STRIPE_CONNECT_DEFAULT_COUNTRY: "FR",
  PLATFORM_FEE_PERCENT: "12",
  NEXT_PUBLIC_VAPI_PUBLIC_KEY: "",
  NEXT_PUBLIC_VAPI_ASSISTANT_ID: "",
  VAPI_WEBHOOK_SECRET: randomBytes(24).toString("hex"),
  CLOUDINARY_CLOUD_NAME: "",
  CLOUDINARY_API_KEY: "",
  CLOUDINARY_API_SECRET: "",
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

if (added.some((k) => k.startsWith("GEMINI"))) {
  blocks.push(
    "",
    "# Gemini — guide client + intent : https://aistudio.google.com/apikey",
    `GEMINI_API_KEY=${current.get("GEMINI_API_KEY")}`,
    `GEMINI_MODEL=${current.get("GEMINI_MODEL")}`,
    `GEMINI_DISABLE=${current.get("GEMINI_DISABLE")}`
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
    "# VAPI guide vocal — https://dashboard.vapi.ai",
    "# 1. Créez un assistant → copiez Public Key + Assistant ID",
    "# 2. Server URL : http://localhost:3000/api/vapi/webhook (ou votre domaine prod)",
    "# 3. Tools : search_trips, save_travel_request",
    `NEXT_PUBLIC_VAPI_PUBLIC_KEY=${current.get("NEXT_PUBLIC_VAPI_PUBLIC_KEY")}`,
    `NEXT_PUBLIC_VAPI_ASSISTANT_ID=${current.get("NEXT_PUBLIC_VAPI_ASSISTANT_ID")}`,
    `VAPI_WEBHOOK_SECRET=${current.get("VAPI_WEBHOOK_SECRET")}`
  );
}

if (added.some((k) => k.startsWith("CLOUDINARY"))) {
  blocks.push(
    "",
    "# Cloudinary — https://cloudinary.com/console",
    "# Dashboard → API Keys → copiez cloud name, key, secret",
    `CLOUDINARY_CLOUD_NAME=${current.get("CLOUDINARY_CLOUD_NAME")}`,
    `CLOUDINARY_API_KEY=${current.get("CLOUDINARY_API_KEY")}`,
    `CLOUDINARY_API_SECRET=${current.get("CLOUDINARY_API_SECRET")}`
  );
}

const next = raw.trimEnd() + blocks.join("\n") + "\n";
writeFileSync(envPath, next, "utf8");

console.log("Added to .env:", added.join(", "));
if (added.includes("GROQ_API_KEY")) {
  console.log("→ Paste your Groq key: https://console.groq.com (free tier)");
}
if (added.includes("GEMINI_API_KEY")) {
  console.log("→ Gemini (gratuit): https://aistudio.google.com/apikey → GEMINI_API_KEY");
}
if (added.some((k) => k.includes("VAPI"))) {
  console.log("→ VAPI: dashboard.vapi.ai → Public Key + Assistant ID + Server URL webhook");
}
if (added.some((k) => k.startsWith("CLOUDINARY"))) {
  console.log("→ Cloudinary: cloudinary.com/console → API Keys");
}
