import { NextResponse } from "next/server";
import { loadNomiDb } from "@/lib/server/nomiDb";
import { accountToCreator, stripAccount } from "@/lib/server/nomiTypes";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim().toLowerCase() ?? "";
  const db = await loadNomiDb();
  const accounts = Object.values(db.accountsById).map(stripAccount);

  if (!q) {
    return NextResponse.json({ creators: accounts.map(accountToCreator) });
  }

  const matches = accounts.filter((a) => {
    const u = a.username.toLowerCase();
    const d = a.displayName.toLowerCase();
    return u === q || u.includes(q) || d.includes(q) || q.replace(/^@/, "") === u;
  });

  return NextResponse.json({
    creators: matches.map(accountToCreator),
  });
}
