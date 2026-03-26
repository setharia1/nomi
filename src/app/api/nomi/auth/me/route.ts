import { NextResponse } from "next/server";
import { loadDbWithSession } from "@/lib/server/nomiSession";
import { stripAccount } from "@/lib/server/nomiTypes";

export async function GET(req: Request) {
  const { db, accountId } = await loadDbWithSession(req);
  if (!accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const account = db.accountsById[accountId];
  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  return NextResponse.json({ account: stripAccount(account) });
}
