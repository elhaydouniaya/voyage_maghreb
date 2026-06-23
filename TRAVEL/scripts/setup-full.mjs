/**
 * Full local setup: migrations → seed → analytics demo → catalog export → prod-ready.
 * Usage: node scripts/setup-full.mjs
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const travelRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const steps = [
  ["db:migrate", "Applying migrations"],
  ["db:cdc", "CDC schema conformance check"],
  ["seed", "Seeding users, trips, reviews, audit logs"],
  ["analytics:seed", "Seeding behavior analytics (30 days)"],
  ["data:export", "Exporting maghreb-catalog.json"],
  ["prod:ready", "Production readiness report"],
];

for (const [script, label] of steps) {
  console.log(`\n>>> ${label} (npm run ${script})\n`);
  const result = spawnSync(`npm run ${script}`, {
    cwd: travelRoot,
    stdio: "inherit",
    shell: true,
  });
  if (result.status !== 0) {
    console.error(`\nSetup failed at: ${script}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\n=== Setup complete ===");
console.log("Start the app: npm run dev");
console.log("With dev server running: npm run audit:all\n");
