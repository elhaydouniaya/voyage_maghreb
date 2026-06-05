/**
 * Workspace wrapper — runs TRAVEL/scripts/audit-all.mjs from repo root.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const travelRoot = path.join(root, "TRAVEL");
const script = path.join(travelRoot, "scripts", "audit-all.mjs");

const result = spawnSync(process.execPath, [script, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: travelRoot,
});

process.exit(result.status ?? 1);
