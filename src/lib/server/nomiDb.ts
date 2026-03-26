import { Redis } from "@upstash/redis";
import { promises as fs } from "fs";
import path from "path";
import type { NomiDb } from "./nomiTypes";

const REDIS_KEY = "nomi:db:v1";
const FILE_REL = ["data", "nomi-cloud.json"];

function emptyDb(): NomiDb {
  return {
    accountsById: {},
    usernameToId: {},
    emailToId: {},
    sessions: {},
    postsByAccountId: {},
    followingByAccountId: {},
  };
}

/**
 * Upstash REST API expects `https://<host>` + token. Many dashboards only show one `redis://` line —
 * we accept that in UPSTASH_REDIS_URL or REDIS_URL so you can paste a single value in Vercel.
 */
function resolveUpstashRestConfig(): { url: string; token: string } | null {
  let url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  let token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (url && token) return { url, token };

  const conn =
    process.env.UPSTASH_REDIS_URL?.trim() ||
    process.env.REDIS_URL?.trim() ||
    "";
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
  const decoded = (() => {
    try {
      return decodeURIComponent(tokenPart);
    } catch {
      return tokenPart;
    }
  })();

  return { url: `https://${host}`, token: decoded };
}

function getRedis(): Redis | null {
  const resolved = resolveUpstashRestConfig();
  if (!resolved) return null;
  return new Redis({ url: resolved.url, token: resolved.token });
}

const redis = getRedis();

declare global {
  // eslint-disable-next-line no-var
  var __nomiDbMem: NomiDb | undefined;
}

function getMemoryDb(): NomiDb {
  if (!globalThis.__nomiDbMem) globalThis.__nomiDbMem = emptyDb();
  return globalThis.__nomiDbMem;
}

async function readFileDb(): Promise<NomiDb> {
  const fp = path.join(process.cwd(), ...FILE_REL);
  try {
    const raw = await fs.readFile(fp, "utf8");
    const parsed = JSON.parse(raw) as NomiDb;
    if (!parsed || typeof parsed !== "object") return emptyDb();
    return {
      ...emptyDb(),
      ...parsed,
      accountsById: parsed.accountsById ?? {},
      usernameToId: parsed.usernameToId ?? {},
      emailToId: parsed.emailToId ?? {},
      sessions: parsed.sessions ?? {},
      postsByAccountId: parsed.postsByAccountId ?? {},
      followingByAccountId: parsed.followingByAccountId ?? {},
    };
  } catch {
    return emptyDb();
  }
}

async function writeFileDb(db: NomiDb) {
  const fp = path.join(process.cwd(), ...FILE_REL);
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, JSON.stringify(db), "utf8");
}

export async function loadNomiDb(): Promise<NomiDb> {
  if (redis) {
    const raw = await redis.get<string>(REDIS_KEY);
    if (!raw) return emptyDb();
    try {
      return JSON.parse(raw) as NomiDb;
    } catch {
      return emptyDb();
    }
  }
  if (process.env.NODE_ENV === "development") {
    return readFileDb();
  }
  return getMemoryDb();
}

export async function saveNomiDb(db: NomiDb) {
  if (redis) {
    await redis.set(REDIS_KEY, JSON.stringify(db));
    return;
  }
  if (process.env.NODE_ENV === "development") {
    await writeFileDb(db);
    return;
  }
  globalThis.__nomiDbMem = db;
}

export { emptyDb };
