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
