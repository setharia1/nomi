import { NextResponse } from "next/server";
import { loadDbWithSession } from "@/lib/server/nomiSession";
import { loadNomiDb, saveNomiDb } from "@/lib/server/nomiDb";

export async function GET(req: Request) {
  const { db, accountId } = await loadDbWithSession(req);
  if (!accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ followingIds: db.followingByAccountId[accountId] ?? [] });
}

export async function POST(req: Request) {
  const { db, accountId } = await loadDbWithSession(req);
  if (!accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const targetId =
    typeof body === "object" && body !== null && "targetId" in body
      ? String((body as { targetId: unknown }).targetId).trim()
      : "";

  if (!targetId || targetId === accountId) {
    return NextResponse.json({ error: "Invalid target" }, { status: 400 });
  }
  if (!db.accountsById[targetId]) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const cur = db.followingByAccountId[accountId] ?? [];
  const isFollowing = cur.includes(targetId);
  const next = isFollowing ? cur.filter((id) => id !== targetId) : [targetId, ...cur.filter((id) => id !== targetId)];
  db.followingByAccountId[accountId] = [...new Set(next)];
  await saveNomiDb(db);
  return NextResponse.json({ followingIds: db.followingByAccountId[accountId] });
}

/**
 * Replace full following list (e.g. migration / sync).
 */
export async function PUT(req: Request) {
  const { db, accountId } = await loadDbWithSession(req);
  if (!accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const ids =
    typeof body === "object" && body !== null && "followingIds" in body
      ? (Array.isArray((body as { followingIds: unknown }).followingIds)
          ? ((body as { followingIds: string[] }).followingIds as string[])
          : [])
      : [];

  const valid = new Set(Object.keys(db.accountsById));
  const next = [...new Set(ids.filter((id) => valid.has(id) && id !== accountId))];
  db.followingByAccountId[accountId] = next;
  await saveNomiDb(db);
  return NextResponse.json({ followingIds: next });
}
