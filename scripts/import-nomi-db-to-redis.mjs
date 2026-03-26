#!/usr/bin/env node
/**
 * Merges a local Nomi DB JSON (default: data/nomi-cloud.json) into Upstash Redis
 * under key nomi:db:v1. Safe to re-run: keeps existing Redis accounts/passwords,
 * adds missing accounts, merges posts by id (newer publishedAt wins), merges following + sessions.
 *
 * Usage:
 *   npm run db:import-redis
 *   npm run db:import-redis -- /path/to/export.json
 *   npm run db:import-redis -- --replace-remote   # ignore remote DB; file becomes source of truth
 *
 * Requires UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN or UPSTASH_REDIS_URL / REDIS_URL (redis://…).
 * Load from .env.local: `set -a && source .env.local && set +a` (bash) or use dotenv-cli.
 */

import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { Redis } from "@upstash/redis";

const REDIS_KEY = "nomi:db:v1";

/** Populate process.env from .env.local when vars are not already set (no extra dependency). */
function loadEnvLocal() {
  const p = resolve(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq < 1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvLocal();

function emptyDb() {
  return {
    accountsById: {},
    usernameToId: {},
    emailToId: {},
    sessions: {},
    postsByAccountId: {},
    followingByAccountId: {},
  };
}

function resolveUpstashFromEnv() {
  let url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  let token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) return { url, token };

  const conn =
    process.env.UPSTASH_REDIS_URL?.trim() || process.env.REDIS_URL?.trim() || "";
  if (!conn.startsWith("redis://") && !conn.startsWith("rediss://")) return null;

  const withoutScheme = conn.replace(/^rediss?:\/\//, "");
  const at = withoutScheme.indexOf("@");
  if (at < 0) return null;
  const auth = withoutScheme.slice(0, at);
  const hostPort = withoutScheme.slice(at + 1);
  const host = hostPort.split(/[/:?#]/)[0]?.trim();
  if (!host) return null;

  const tokenPart = auth.includes(":") ? auth.split(":").slice(1).join(":") : auth;
  if (!tokenPart) return null;
  let decoded = tokenPart;
  try {
    decoded = decodeURIComponent(tokenPart);
  } catch {
    /* keep */
  }

  return { url: `https://${host}`, token: decoded };
}

function mergeNomiDb(remote, local) {
  const out = {
    accountsById: { ...remote.accountsById },
    usernameToId: { ...remote.usernameToId },
    emailToId: { ...remote.emailToId },
    sessions: { ...remote.sessions },
    postsByAccountId: { ...remote.postsByAccountId },
    followingByAccountId: { ...remote.followingByAccountId },
  };

  for (const [id, acc] of Object.entries(local.accountsById || {})) {
    if (!acc || typeof acc !== "object") continue;
    if (!out.accountsById[id]) {
      out.accountsById[id] = acc;
      const u = String(acc.username || "").toLowerCase().replace(/^@+/, "");
      const e = String(acc.email || "").toLowerCase();
      if (u) out.usernameToId[u] = id;
      if (e) out.emailToId[e] = id;
    }
  }

  for (const [accountId, posts] of Object.entries(local.postsByAccountId || {})) {
    if (!Array.isArray(posts)) continue;
    const rPosts = Array.isArray(out.postsByAccountId[accountId]) ? out.postsByAccountId[accountId] : [];
    const byId = new Map(rPosts.map((p) => [p.id, p]));
    for (const p of posts) {
      if (!p || typeof p.id !== "string") continue;
      const old = byId.get(p.id);
      if (!old || (p.publishedAt ?? 0) >= (old.publishedAt ?? 0)) byId.set(p.id, p);
    }
    out.postsByAccountId[accountId] = Array.from(byId.values()).sort(
      (a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0),
    );
  }

  for (const [id, following] of Object.entries(local.followingByAccountId || {})) {
    if (!Array.isArray(following)) continue;
    const cur = new Set(out.followingByAccountId[id] || []);
    for (const x of following) cur.add(x);
    out.followingByAccountId[id] = Array.from(cur);
  }

  Object.assign(out.sessions, local.sessions || {});

  return out;
}

const cfg = resolveUpstashFromEnv();
if (!cfg) {
  console.error(
    "Missing Redis config. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN or UPSTASH_REDIS_URL / REDIS_URL.",
  );
  process.exit(1);
}

const fileArg = process.argv.slice(2).find((a) => !a.startsWith("--"));
const file = resolve(process.cwd(), fileArg || "data/nomi-cloud.json");

if (!existsSync(file)) {
  console.error(`File not found: ${file}`);
  process.exit(1);
}

let local;
try {
  local = JSON.parse(readFileSync(file, "utf8"));
} catch (e) {
  console.error("Invalid JSON:", e.message);
  process.exit(1);
}

const redis = new Redis({ url: cfg.url, token: cfg.token });

(async () => {
  const replaceRemote = process.argv.includes("--replace-remote");
  let remote = emptyDb();

  if (!replaceRemote) {
    const raw = await redis.get(REDIS_KEY);
    if (raw != null && raw !== "") {
      try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
        if (!parsed || typeof parsed !== "object") throw new Error("not an object");
        remote = { ...emptyDb(), ...parsed };
        remote.accountsById = remote.accountsById || {};
        remote.postsByAccountId = remote.postsByAccountId || {};
      } catch {
        console.error(
          "Existing Redis value is not valid JSON. Pass --replace-remote to overwrite with the file, or fix the key manually.",
        );
        process.exit(1);
      }
    }
  }

  const merged = replaceRemote ? mergeNomiDb(emptyDb(), local) : mergeNomiDb(remote, local);
  await redis.set(REDIS_KEY, JSON.stringify(merged));

  const postsN = Object.values(merged.postsByAccountId).reduce((n, a) => n + a.length, 0);
  console.log(
    `OK — merged into ${REDIS_KEY}: ${Object.keys(merged.accountsById).length} accounts, ${postsN} posts total.`,
  );
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
