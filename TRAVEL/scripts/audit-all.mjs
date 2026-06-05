/**
 * Run audit + auth-smoke + health in sequence (Windows-safe).
 * Usage: node scripts/audit-all.mjs [baseUrl]
 *   baseUrl optional — forwarded to audit scripts (default http://localhost:3000)
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const travelRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const baseUrl = (
  process.argv[2] ||
  process.env.SMOKE_BASE_URL ||
  "http://localhost:3000"
).replace(/\/$/, "");

const steps = [
  ["audit", baseUrl],
  ["audit:auth", baseUrl],
  ["health", ""],
];

for (const [step, arg] of steps) {
  const label = arg ? `${step} — ${arg}` : step;
  console.log(`\n>>> npm run ${label}\n`);
  const cmd = arg ? `npm run ${step} -- ${arg}` : `npm run ${step}`;
  const result = spawnSync(cmd, {
    stdio: "inherit",
    cwd: travelRoot,
    shell: true,
    env: { ...process.env, SMOKE_BASE_URL: baseUrl },
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("\n=== All audit steps passed ===\n");
