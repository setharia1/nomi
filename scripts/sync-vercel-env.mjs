#!/usr/bin/env node
/**
 * Push selected keys from .env.local to Vercel (production + preview) via REST API.
 *
 * Prerequisite: `npx vercel link` in the repo root (creates .vercel/project.json).
 * Reads auth token from VERCEL_TOKEN or from the Vercel CLI auth file.
 *
 * Usage: npm run vercel:env
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const KEYS = [
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "BLOB_READ_WRITE_TOKEN",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "GEMINI_MODEL",
  "VEO_MODEL",
  "VEO_GENERATE_AUDIO",
  "VEO_VIDEO_DURATION_SECONDS",
  "VEO_VIDEO_RESOLUTION",
  "VEO_VIDEO_COMPRESSION",
];

const TARGETS = /** @type {const} */ (["production", "preview"]);

function parseEnvFile(raw) {
  /** @type {Record<string, string>} */
  const out = {};
  for (const line of raw.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function readVercelToken() {
  const fromEnv = process.env.VERCEL_TOKEN?.trim();
  if (fromEnv) return fromEnv;

  const candidates = [
    path.join(os.homedir(), "Library/Application Support/com.vercel.cli/auth.json"),
    path.join(os.homedir(), ".config/vercel/auth.json"),
  ];
  for (const p of candidates) {
    try {
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      if (typeof j.token === "string" && j.token.length > 0) return j.token;
    } catch {
      /* */
    }
  }
  return null;
}

async function upsertEnv(apiToken, projectId, teamId, key, value, target) {
  const url = new URL(`https://api.vercel.com/v10/projects/${projectId}/env`);
  url.searchParams.set("teamId", teamId);
  url.searchParams.set("upsert", "true");

  const sensitive =
    key.includes("KEY") || key.includes("TOKEN") || key.includes("SECRET");
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      key,
      value,
      type: sensitive ? "sensitive" : "encrypted",
      target: [target],
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${key} [${target}] HTTP ${res.status}: ${text}`);
  }
  return text;
}

function ensureLinked() {
  const p = path.join(ROOT, ".vercel/project.json");
  if (!fs.existsSync(p)) {
    console.error("Run: npx vercel link");
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const token = readVercelToken();
if (!token) {
  console.error("No Vercel token: run `npx vercel login` or set VERCEL_TOKEN.");
  process.exit(1);
}

const projectMeta = ensureLinked();
const projectId = projectMeta.projectId;
const teamId = projectMeta.orgId;

const envPath = path.join(ROOT, ".env.local");
if (!fs.existsSync(envPath)) {
  console.error("Missing .env.local");
  process.exit(1);
}

const vars = parseEnvFile(fs.readFileSync(envPath, "utf8"));

for (const key of KEYS) {
  const val = (vars[key] ?? "").trim();
  if (!val) {
    console.log(`skip ${key} (empty in .env.local)`);
    continue;
  }
  for (const target of TARGETS) {
    process.stdout.write(`→ ${key} → ${target}… `);
    try {
      await upsertEnv(token, projectId, teamId, key, val, target);
      console.log("ok");
    } catch (e) {
      console.log("fail");
      console.error(e);
      process.exit(1);
    }
  }
}

console.log(
  "\nDone. Trigger a redeploy (git push or Vercel dashboard) so deployments pick up changes.",
);
