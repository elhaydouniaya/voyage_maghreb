/**
 * Full automated verification pipeline.
 * Static checks → build → start server (if needed) → HTTP + booking smoke tests.
 *
 * Usage:
 *   node scripts/auto-run.mjs [baseUrl] [--quick] [--no-server]
 *
 * Flags:
 *   --quick     Skip production build (faster)
 *   --no-server Do not auto-start server; HTTP steps skipped if down
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const travelRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const flags = new Set(process.argv.slice(2).filter((a) => a.startsWith("--")));
const baseUrl = (args[0] || process.env.SMOKE_BASE_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);
const quick = flags.has("--quick");
const noServer = flags.has("--no-server");

const startedAt = Date.now();

function log(title) {
  console.log(`\n${"=".repeat(60)}\n  ${title}\n${"=".repeat(60)}\n`);
}

function runNpm(script, npmArgs = []) {
  const suffix = npmArgs.length ? ` -- ${npmArgs.join(" ")}` : "";
  console.log(`>>> npm run ${script}${suffix}\n`);
  const cmd = npmArgs.length ? `npm run ${script} -- ${npmArgs.join(" ")}` : `npm run ${script}`;
  const result = spawnSync(cmd, {
    cwd: travelRoot,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, SMOKE_BASE_URL: baseUrl },
  });
  if (result.status !== 0) {
    console.error(`\nAuto-run failed at: npm run ${script}`);
    process.exit(result.status ?? 1);
  }
}

function runTsx(relativeScript, tsxArgs = []) {
  const scriptPath = path.join(travelRoot, relativeScript);
  const cmd = `npx tsx "${scriptPath}" ${[baseUrl, ...tsxArgs].join(" ")}`.trim();
  console.log(`>>> ${cmd}\n`);
  const result = spawnSync(cmd, {
    cwd: travelRoot,
    stdio: "inherit",
    shell: true,
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`\nAuto-run failed at: ${relativeScript}`);
    process.exit(result.status ?? 1);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function portOpen(port, host = "127.0.0.1") {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host });
    socket.setTimeout(1500);
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function serverResponds() {
  try {
    const res = await fetch(baseUrl, { redirect: "manual" });
    return res.ok || [301, 302, 307, 308].includes(res.status);
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await serverResponds()) {
    console.log(`Server already running at ${baseUrl}`);
    return { startedByUs: false };
  }

  if (noServer) {
    console.warn(`Server not running at ${baseUrl} (--no-server)`);
    return { startedByUs: false, up: false };
  }

  if (!quick && !fs.existsSync(path.join(travelRoot, ".next", "BUILD_ID"))) {
    log("Build required (.next missing)");
    runNpm("build");
  }

  log(`Starting server at ${baseUrl}`);
  const child = spawn("npm run start", {
    cwd: travelRoot,
    detached: true,
    stdio: "ignore",
    shell: true,
  });
  child.unref();

  for (let i = 0; i < 45; i++) {
    await sleep(1000);
    if (await serverResponds()) {
      console.log(`Server ready (${i + 1}s)`);
      return { startedByUs: true, pid: child.pid };
    }
  }

  console.error(`Server did not become ready at ${baseUrl} within 45s`);
  process.exit(1);
}

async function main() {
  console.log("\nMaghrebVoyage — auto-run verification");
  console.log(`Target: ${baseUrl}`);
  console.log(`Mode: ${quick ? "quick (no build)" : "full"}\n`);

  log("1/4 — Static checks");
  runNpm("lint");
  runNpm("typecheck");
  runNpm("test");
  runNpm("health");
  runNpm("db:cdc");

  if (!quick) {
    log("2/4 — Production build");
    runNpm("build");
  } else {
    log("2/4 — Build skipped (--quick)");
  }

  log("3/4 — Server");
  const server = await ensureServer();

  if ((await serverResponds()) || server.up !== false) {
    log("4/4 — HTTP & booking smoke tests");
    runNpm("audit", [baseUrl]);
    runNpm("audit:auth", [baseUrl]);
    runTsx("scripts/verify-booking-changes.ts");
    runTsx("scripts/verify-demo-booking.ts");
  } else {
    console.warn("\nSkipping HTTP tests — no server.\n");
  }

  const elapsed = Math.round((Date.now() - startedAt) / 1000);
  console.log("\n" + "=".repeat(60));
  console.log(`  AUTO-RUN PASSED (${elapsed}s)`);
  console.log("=".repeat(60));
  if (server.startedByUs) {
    console.log(`\nServer left running at ${baseUrl} (PID ${server.pid})`);
    console.log("Stop with Ctrl+C in that terminal or kill the node process on port 3000.\n");
  } else {
    console.log(`\nApp: ${baseUrl}\n`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
