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

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = getRedis();
let warnedEphemeralMode = false;
let checkedProductionPersistence = false;

declare global {
  // eslint-disable-next-line no-var
  var __nomiDbMem: NomiDb | undefined;
}

function getMemoryDb(): NomiDb {
  if (!globalThis.__nomiDbMem) globalThis.__nomiDbMem = emptyDb();
  return globalThis.__nomiDbMem;
}

async function readFileDb(): Promise<NomiDb> {
  const fp = resolveFileDbPath();
  if (!fp) return emptyDb();
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
  const fp = resolveFileDbPath();
  if (!fp) {
    globalThis.__nomiDbMem = db;
    return;
  }
  await fs.mkdir(path.dirname(fp), { recursive: true });
  await fs.writeFile(fp, JSON.stringify(db), "utf8");
}

function resolveFileDbPath(): string | null {
  const explicit = process.env.NOMI_DB_FILE_PATH?.trim();
  if (explicit) {
    return path.isAbsolute(explicit) ? explicit : path.join(process.cwd(), explicit);
  }
  if (process.env.NODE_ENV === "development") {
    return path.join(process.cwd(), ...FILE_REL);
  }
  return null;
}

function warnEphemeralDbMode() {
  if (warnedEphemeralMode || process.env.NODE_ENV === "development") return;
  warnedEphemeralMode = true;
  // Production serverless instances reset memory on cold start/redeploy.
  console.warn(
    "Nomi DB is using in-memory fallback. Configure UPSTASH_REDIS_REST_URL/TOKEN (recommended) or NOMI_DB_FILE_PATH for persistent storage.",
  );
}

function isTruthyEnv(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}

function assertProductionPersistenceConfigured() {
  if (checkedProductionPersistence || process.env.NODE_ENV === "development") return;
  checkedProductionPersistence = true;
  const hasRedis = !!redis;
  const hasFilePath = !!resolveFileDbPath();
  const allowEphemeral = isTruthyEnv(process.env.NOMI_ALLOW_EPHEMERAL_DB);
  if (hasRedis || hasFilePath || allowEphemeral) {
    if (allowEphemeral && !hasRedis && !hasFilePath) {
      warnEphemeralDbMode();
    }
    return;
  }
  throw new Error(
    "Persistent Nomi DB is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (recommended), or set NOMI_DB_FILE_PATH to mounted persistent storage. For temporary non-persistent mode only, set NOMI_ALLOW_EPHEMERAL_DB=true.",
  );
}

export async function loadNomiDb(): Promise<NomiDb> {
  assertProductionPersistenceConfigured();
  if (redis) {
    const raw = await redis.get<string>(REDIS_KEY);
    if (!raw) return emptyDb();
    try {
      return JSON.parse(raw) as NomiDb;
    } catch {
      return emptyDb();
    }
  }
  if (resolveFileDbPath()) {
    return readFileDb();
  }
  warnEphemeralDbMode();
  return getMemoryDb();
}

export async function saveNomiDb(db: NomiDb) {
  assertProductionPersistenceConfigured();
  if (redis) {
    await redis.set(REDIS_KEY, JSON.stringify(db));
    return;
  }
  if (resolveFileDbPath()) {
    await writeFileDb(db);
    return;
  }
  warnEphemeralDbMode();
  globalThis.__nomiDbMem = db;
}

export { emptyDb };
