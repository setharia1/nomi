import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import {
  loadNomiDb,
  mustBlockVercelAuthWithoutRedis,
  NOMI_VERCEL_REDIS_REQUIRED_ERROR,
  saveNomiDb,
} from "@/lib/server/nomiDb";
import { verifyPassword } from "@/lib/server/authPassword";
import { stripAccount } from "@/lib/server/nomiTypes";
import { MAX_LOGIN_IDENTIFIER_LENGTH, MAX_PASSWORD_BYTES } from "@/lib/server/authLimits";

const SESSION_MS = 1000 * 60 * 60 * 24 * 30;

export async function POST(req: Request) {
  if (mustBlockVercelAuthWithoutRedis()) {
    return NextResponse.json({ error: NOMI_VERCEL_REDIS_REQUIRED_ERROR }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const emailOrUsername =
    typeof body === "object" && body !== null && "emailOrUsername" in body
      ? String((body as { emailOrUsername: unknown }).emailOrUsername).trim()
      : "";
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? String((body as { password: unknown }).password)
      : "";

  if (!emailOrUsername || !password) {
    return NextResponse.json({ error: "Email/username and password required" }, { status: 400 });
  }
  if (emailOrUsername.length > MAX_LOGIN_IDENTIFIER_LENGTH || password.length > MAX_PASSWORD_BYTES) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });
  }

  const db = await loadNomiDb();
  const key = emailOrUsername.replace(/^@+/, "").toLowerCase();
  let accountId = db.emailToId[key] ?? db.usernameToId[key];

  if (!accountId && key.includes("@")) {
    accountId = db.emailToId[key];
  }

  if (!accountId) {
    return NextResponse.json({ error: "No account found with that email or username" }, { status: 401 });
  }

  const account = db.accountsById[accountId];
  if (!account) {
    return NextResponse.json({ error: "Account missing" }, { status: 500 });
  }

  if (!verifyPassword(password, account.salt, account.passwordHash)) {
    return NextResponse.json({ error: "Wrong password" }, { status: 401 });
  }

  const token = randomBytes(32).toString("hex");
  db.sessions[token] = { accountId, expiresAt: Date.now() + SESSION_MS };
  await saveNomiDb(db);

  return NextResponse.json({
    token,
    expiresAt: db.sessions[token]!.expiresAt,
    account: stripAccount(account),
  });
}
