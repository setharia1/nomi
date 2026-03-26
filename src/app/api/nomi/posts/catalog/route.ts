import { NextResponse } from "next/server";
import type { Post } from "@/lib/types";
import { loadNomiDb } from "@/lib/server/nomiDb";

/** All published posts across accounts (for feeds / explore). */
export async function GET() {
  const db = await loadNomiDb();
  const all: Post[] = [];
  for (const list of Object.values(db.postsByAccountId)) {
    all.push(...list);
  }
  return NextResponse.json({ posts: all });
}
