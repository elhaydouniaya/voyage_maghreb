/**
 * Local completion check — static quality + DB health + optional HTTP audit.
 * Usage: node scripts/verify-local.mjs [baseUrl]
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

function run(script, args = []) {
  const argSuffix = args.length ? ` -- ${args.join(" ")}` : "";
  console.log(`\n>>> npm run ${script}${argSuffix}\n`);
  const cmd = args.length ? `npm run ${script} -- ${args.join(" ")}` : `npm run ${script}`;
  const result = spawnSync(cmd, {
    cwd: travelRoot,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, SMOKE_BASE_URL: baseUrl },
  });
  return result.status === 0;
}

const staticSteps = ["lint", "typecheck", "test", "health"];
for (const step of staticSteps) {
  if (!run(step)) {
    console.error(`\nLocal verify failed at: ${step}`);
    process.exit(1);
  }
}

let serverUp = false;
try {
  const res = await fetch(baseUrl, { redirect: "manual" });
  serverUp = res.ok || [301, 302, 307, 308].includes(res.status);
} catch {
  serverUp = false;
}

if (serverUp) {
  console.log(`\nDev server detected at ${baseUrl} — running HTTP audits…\n`);
  if (!run("audit", [baseUrl])) process.exit(1);
  if (!run("audit:auth", [baseUrl])) process.exit(1);
  if (!run("verify:booking", [baseUrl])) process.exit(1);
  if (!run("verify:booking-e2e", [baseUrl])) process.exit(1);
} else {
  console.log(
    `\nDev server not running at ${baseUrl}.` +
      "\nStart it with: npm run dev" +
      `\nOr run full auto: npm run auto:run` +
      `\nThen re-run: npm run local:verify -- ${baseUrl}\n`
  );
}

console.log("\n=== Local setup complete ===");
console.log("App:     npm run dev  →  http://localhost:3000");
console.log("Accounts: client@test.com / agency@test.com / admin@maghrebvoyage.com");
console.log("Uploads:  local disk in dev (public/uploads/) if Cloudinary is unset");
console.log("Payments: Stripe test keys, or demo mode without Stripe\n");
