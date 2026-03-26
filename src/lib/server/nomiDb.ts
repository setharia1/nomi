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
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
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

/**
 * Durable JSON at `data/nomi-cloud.json` — any machine with a normal writable filesystem
 * (local `next dev`, `next start`, self‑hosted Node) except Vercel (no shared disk).
 */
function nomiDbUsesLocalJsonFile(): boolean {
  if (redis) return false;
  if (process.env.VERCEL) return false;
  return true;
}

/** True when Upstash / REST env is configured (production persistence). */
export function isNomiRedisConfigured(): boolean {
  return redis !== null;
}

/**
 * Error body for /api/nomi/auth/* when Vercel runs without Redis (each instance has isolated memory).
 */
export const NOMI_VERCEL_REDIS_REQUIRED_ERROR =
  "This deployment cannot save accounts: Upstash Redis is not set. In Vercel → your project → Settings → Environment Variables, add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or paste UPSTASH_REDIS_URL from Upstash), then redeploy. Without Redis, sign-ups and logins are lost on the next request.";

/**
 * On Vercel, in-memory `saveNomiDb` is not shared across instances or cold starts — users appear
 * logged out after refresh and login says “no account”. Require Redis unless explicitly overridden.
 */
export function mustBlockVercelAuthWithoutRedis(): boolean {
  if (process.env.NOMI_ALLOW_EPHEMERAL_AUTH === "1") return false;
  if (isNomiRedisConfigured()) return false;
  return Boolean(process.env.VERCEL);
}

declare global {
  var __nomiDbMem: NomiDb | undefined;
}

function getMemoryDb(): NomiDb {
  if (!globalThis.__nomiDbMem) globalThis.__nomiDbMem = emptyDb();
  return globalThis.__nomiDbMem;
}

function parseNomiDbBlob(raw: unknown): NomiDb {
  try {
    const parsed =
      typeof raw === "string" ? (JSON.parse(raw) as NomiDb) : (raw as NomiDb);
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

async function readFileDb(): Promise<NomiDb> {
  const fp = path.join(/* turbopackIgnore: true */ process.cwd(), ...FILE_REL);
  try {
    const raw = await fs.readFile(fp, "utf8");
    return parseNomiDbBlob(raw);
  } catch {
    return emptyDb();
  }
}

async function writeFileDb(db: NomiDb) {
  const fp = path.join(/* turbopackIgnore: true */ process.cwd(), ...FILE_REL);
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, JSON.stringify(db), "utf8");
}

let warnedEphemeralProd = false;

function warnEphemeralProduction(context: "load" | "save") {
  if (warnedEphemeralProd) return;
  if (process.env.NODE_ENV !== "production") return;
  warnedEphemeralProd = true;
  console.error(
    `[nomi] Database ${context} uses EPHEMERAL memory on this host. Accounts, passwords, and posts will NOT survive ` +
      `deploys or other instances. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN (or UPSTASH_REDIS_URL / REDIS_URL) ` +
      `on Vercel. Run: npm run db:import-redis — to copy local data/nomi-cloud.json into Redis once.`,
  );
}

export async function loadNomiDb(): Promise<NomiDb> {
  if (redis) {
    const raw = await redis.get(REDIS_KEY);
    if (raw == null || raw === "") return emptyDb();
    return parseNomiDbBlob(raw);
  }
  if (nomiDbUsesLocalJsonFile()) {
    return readFileDb();
  }
  warnEphemeralProduction("load");
  return getMemoryDb();
}

export async function saveNomiDb(db: NomiDb) {
  if (redis) {
    await redis.set(REDIS_KEY, JSON.stringify(db));
    return;
  }
  if (nomiDbUsesLocalJsonFile()) {
    await writeFileDb(db);
    return;
  }
  warnEphemeralProduction("save");
  globalThis.__nomiDbMem = db;
}

export { emptyDb };
