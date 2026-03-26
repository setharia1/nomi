#!/usr/bin/env node
/**
 * Production build + next start + e2e-smoke.mjs (one shot).
 */
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

const PORT = process.env.SMOKE_PORT ?? "3999";
const cwd = path.join(fileURLToPath(new URL(".", import.meta.url)), "..");
const base = `http://127.0.0.1:${PORT}`;

const nextBin = path.join(cwd, "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, [nextBin, "start"], {
  cwd,
  env: { ...process.env, PORT },
  stdio: ["ignore", "pipe", "pipe"],
});

let childErr = "";
let outBuf = "";
child.stderr?.on("data", (c) => {
  childErr += c;
});

const ready = new Promise((resolve, reject) => {
  let settled = false;
  const t = setTimeout(() => {
    if (!settled) reject(new Error("Timeout waiting for Next Ready (30s)"));
  }, 30000);

  const tryReady = () => {
    if (settled) return;
    if (outBuf.includes("Ready") || outBuf.includes("started server")) {
      settled = true;
      clearTimeout(t);
      resolve();
    }
  };

  child.stdout?.on("data", (c) => {
    outBuf += c;
    tryReady();
  });

  child.on("error", (e) => {
    settled = true;
    clearTimeout(t);
    reject(e);
  });
  child.on("exit", (code, sig) => {
    if (settled) return;
    if (code !== 0 && code !== null) {
      settled = true;
      clearTimeout(t);
      reject(new Error(`next start exited ${code} ${sig ?? ""}\n${childErr}${outBuf}`));
    }
  });
});

let exitCode = 1;

try {
  await ready;
  const smoke = spawn(process.execPath, [path.join(cwd, "scripts", "e2e-smoke.mjs")], {
    cwd,
    env: { ...process.env, SMOKE_BASE_URL: base },
    stdio: "inherit",
  });
  exitCode = await new Promise((resolve) => {
    smoke.on("exit", (c) => resolve(c ?? 1));
  });
} catch (e) {
  process.stderr.write(String(e?.message || e) + "\n");
  exitCode = 1;
} finally {
  child.kill("SIGTERM");
  setTimeout(() => child.kill("SIGKILL"), 5000).unref();
}

process.exit(exitCode);
