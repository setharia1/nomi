import { NextResponse } from "next/server";
import type { Post } from "@/lib/types";
import { loadDbWithSession } from "@/lib/server/nomiSession";
import { saveNomiDb } from "@/lib/server/nomiDb";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const authorId = url.searchParams.get("authorId")?.trim();
  if (!authorId) {
    return NextResponse.json({ error: "authorId required" }, { status: 400 });
  }
  const { db } = await loadDbWithSession(req);
  const list = db.postsByAccountId[authorId] ?? [];
  return NextResponse.json({ posts: list });
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

  const post = body as Post;
  if (!post?.id || typeof post.creatorId !== "string") {
    return NextResponse.json({ error: "Invalid post" }, { status: 400 });
  }
  if (post.creatorId !== accountId) {
    return NextResponse.json({ error: "Post must belong to your account" }, { status: 403 });
  }

  const list = db.postsByAccountId[accountId] ?? [];
  const rest = list.filter((p) => p.id !== post.id);
  const next = [post, ...rest];
  db.postsByAccountId[accountId] = next;
  await saveNomiDb(db);
  return NextResponse.json({ ok: true, posts: next });
}

/** Replace all posts for account (bulk sync from device) */
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

  const posts =
    typeof body === "object" && body !== null && "posts" in body
      ? (Array.isArray((body as { posts: unknown }).posts) ? (body as { posts: Post[] }).posts : [])
      : [];

  const safe = posts.filter((p) => p && p.creatorId === accountId);
  db.postsByAccountId[accountId] = safe;
  await saveNomiDb(db);
  return NextResponse.json({ ok: true, posts: safe });
}
