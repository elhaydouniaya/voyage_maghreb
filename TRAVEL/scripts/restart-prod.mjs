/**
 * Free port 3000 then start production server (Windows-friendly).
 * Usage: npm run prod:restart
 */
import { execSync, spawn } from "node:child_process";
import { platform } from "node:os";

const PORT = process.env.PORT || "3000";

function freePort(port) {
  if (platform() === "win32") {
    try {
      const out = execSync(
        `powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue).OwningProcess | Select-Object -Unique"`,
        { encoding: "utf8" }
      );
      for (const line of out.split(/\r?\n/)) {
        const pid = Number(line.trim());
        if (pid > 0) {
          try {
            execSync(`taskkill /PID ${pid} /F`, { stdio: "ignore" });
            console.log(`Stopped process ${pid} on port ${port}`);
          } catch {
            /* ignore */
          }
        }
      }
    } catch {
      /* port likely free */
    }
    return;
  }

  try {
    execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: "ignore", shell: true });
  } catch {
    /* port free */
  }
}

console.log("Building production bundle...");
execSync("npm run build", { stdio: "inherit" });

freePort(PORT);

console.log(`Starting production server on http://localhost:${PORT} ...`);
const child = spawn("npm", ["run", "start"], {
  stdio: "inherit",
  shell: true,
  env: { ...process.env, PORT },
});

child.on("exit", (code) => process.exit(code ?? 0));
