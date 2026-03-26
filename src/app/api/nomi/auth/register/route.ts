import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { loadNomiDb, saveNomiDb } from "@/lib/server/nomiDb";
import { hashPassword, makeSalt } from "@/lib/server/authPassword";
import type { AccountRecord } from "@/lib/server/nomiTypes";
import { stripAccount } from "@/lib/server/nomiTypes";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const SESSION_MS = 1000 * 60 * 60 * 24 * 30;

function defaultAvatar(seed: string): string {
  const enc = encodeURIComponent(seed.slice(0, 12));
  return `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=240&h=240&q=80&sig=${enc}`;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email =
    typeof body === "object" && body !== null && "email" in body
      ? String((body as { email: unknown }).email).trim().toLowerCase()
      : "";
  const password =
    typeof body === "object" && body !== null && "password" in body
      ? String((body as { password: unknown }).password)
      : "";
  const usernameRaw =
    typeof body === "object" && body !== null && "username" in body
      ? String((body as { username: unknown }).username).trim()
      : "";
  const displayName =
    typeof body === "object" && body !== null && "displayName" in body
      ? String((body as { displayName: unknown }).displayName).trim()
      : "";

  const username = usernameRaw.replace(/^@+/, "").toLowerCase();

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { error: "Username must be 3–32 characters: letters, numbers, underscores only" },
      { status: 400 },
    );
  }
  if (!displayName || displayName.length < 1) {
    return NextResponse.json({ error: "Display name required" }, { status: 400 });
  }

  const db = await loadNomiDb();
  if (db.emailToId[email]) {
    return NextResponse.json({ error: "An account with this email already exists — sign in instead." }, { status: 409 });
  }
  if (db.usernameToId[username]) {
    return NextResponse.json({ error: "This username is already taken" }, { status: 409 });
  }

  const id = `acc_${randomBytes(12).toString("hex")}`;
  const salt = makeSalt();
  const passwordHash = hashPassword(password, salt);

  const account: AccountRecord = {
    id,
    email,
    username,
    displayName,
    passwordHash,
    salt,
    avatarUrl: defaultAvatar(id),
    bio: "",
    creatorCategory: "Creator",
    tags: ["creator"],
    isVerified: false,
    createdAt: Date.now(),
  };

  db.accountsById[id] = account;
  db.emailToId[email] = id;
  db.usernameToId[username] = id;
  db.postsByAccountId[id] = db.postsByAccountId[id] ?? [];
  db.followingByAccountId[id] = db.followingByAccountId[id] ?? [];

  const token = randomBytes(32).toString("hex");
  db.sessions[token] = { accountId: id, expiresAt: Date.now() + SESSION_MS };

  await saveNomiDb(db);

  return NextResponse.json({
    token,
    expiresAt: db.sessions[token]!.expiresAt,
    account: stripAccount(account),
  });
}
