/**
 * Verify all image URLs used by the app (DB trips, public assets, hardcoded Unsplash).
 * Usage: node scripts/check-images.mjs [baseUrl]
 */
import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const travelRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = (process.argv[2] || "http://localhost:3000").replace(/\/$/, "");
const prisma = new PrismaClient();
const results = [];

async function checkUrl(url, label) {
  if (!url?.trim()) {
    results.push({ label, url, ok: false, error: "empty" });
    return;
  }

  if (url.startsWith("/")) {
    const localPath = join(travelRoot, "public", url.replace(/^\//, ""));
    const fileOk = existsSync(localPath);
    let httpOk = false;
    let status = 0;
    try {
      const res = await fetch(`${base}${url}`, { redirect: "manual" });
      status = res.status;
      httpOk = status >= 200 && status < 400;
    } catch (e) {
      results.push({ label, url, ok: fileOk, error: fileOk ? undefined : e.message, status });
      return;
    }
    results.push({
      label,
      url,
      ok: fileOk && httpOk,
      status,
      detail: fileOk ? "file+http" : "missing file",
    });
    return;
  }

  if (!url.startsWith("http")) {
    results.push({ label, url, ok: false, error: "invalid url" });
    return;
  }

  try {
    let res = await fetch(url, { method: "HEAD", redirect: "follow" });
    if (res.status === 405 || res.status === 403 || res.status === 404) {
      res = await fetch(url, { method: "GET", headers: { Range: "bytes=0-1023" } });
    }
    results.push({
      label,
      url: url.length > 72 ? `${url.slice(0, 72)}…` : url,
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
    });
  } catch (e) {
    results.push({ label, url, ok: false, error: e.message });
  }
}

const hardcoded = [
  ["trust:stripe", "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg"],
  ["trust:mastercard", "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"],
];

const carouselSrc = readFileSync(join(travelRoot, "src/components/public/MaghrebCarousel.tsx"), "utf8");
const carouselImages = [...carouselSrc.matchAll(/image:\s*"([^"]+)"/g)].map((m) => m[1]);

try {
  const trips = await prisma.groupTrip.findMany({
    select: { title: true, slug: true, coverImage: true, images: true },
  });

  for (const t of trips) {
    await checkUrl(t.coverImage, `db:${t.slug}:cover`);
    if (Array.isArray(t.images)) {
      for (let i = 0; i < t.images.length; i++) {
        await checkUrl(t.images[i], `db:${t.slug}:gallery${i}`);
      }
    }
  }
} finally {
  await prisma.$disconnect();
}

for (const [label, url] of hardcoded) await checkUrl(url, label);
for (let i = 0; i < carouselImages.length; i++) {
  await checkUrl(carouselImages[i], `carousel:${carouselImages[i]}`);
}

// Shared country fallbacks from lib/images.ts
const imagesLib = readFileSync(join(travelRoot, "src/lib/images.ts"), "utf8");
const countryUrls = [...imagesLib.matchAll(/https:\/\/images\.unsplash\.com\/[^"]+/g)].map((m) => m[0]);
for (let i = 0; i < countryUrls.length; i++) {
  await checkUrl(countryUrls[i], `country_images:${i}`);
}

const failed = results.filter((r) => !r.ok);
const passed = results.filter((r) => r.ok);

console.log("=== Image URL check ===\n");
console.log(`Passed: ${passed.length}/${results.length}\n`);
for (const r of passed) {
  console.log(`  ✓ ${r.label}${r.status ? ` HTTP ${r.status}` : ""}${r.detail ? ` (${r.detail})` : ""}`);
}
if (failed.length) {
  console.log(`\nFailed: ${failed.length}\n`);
  for (const r of failed) {
    console.log(`  ✗ ${r.label}: ${r.error || `HTTP ${r.status}`} — ${r.url}`);
  }
}

let vapiOk = false;
try {
  const res = await fetch(`${base}/api/vapi/webhook`);
  const data = await res.json();
  vapiOk = res.ok && data.ok;
  console.log(`\nVAPI webhook GET: ${res.ok ? "OK" : "FAIL"} HTTP ${res.status}`);
  if (!vapiOk) console.log("  ", JSON.stringify(data));
} catch (e) {
  console.log(`\nVAPI webhook: unreachable — ${e.message}`);
}

const exitCode = failed.length || !vapiOk ? 1 : 0;
setTimeout(() => process.exit(exitCode), 50);
