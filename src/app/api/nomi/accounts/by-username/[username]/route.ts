import { NextResponse } from "next/server";
import { loadNomiDb } from "@/lib/server/nomiDb";
import { accountToCreator, stripAccount } from "@/lib/server/nomiTypes";

type Ctx = { params: Promise<{ username: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { username: raw } = await ctx.params;
  const username = decodeURIComponent(raw || "")
    .trim()
    .replace(/^@+/, "")
    .toLowerCase();
  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }

  const db = await loadNomiDb();
  const id = db.usernameToId[username];
  if (!id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const account = db.accountsById[id];
  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const posts = db.postsByAccountId[id] ?? [];
  return NextResponse.json({
    creator: accountToCreator(stripAccount(account)),
    posts,
  });
}
