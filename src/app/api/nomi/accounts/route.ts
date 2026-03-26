import { NextResponse } from "next/server";
import { loadNomiDb } from "@/lib/server/nomiDb";
import { accountToCreator, stripAccount } from "@/lib/server/nomiTypes";

/** Public directory — all accounts (for search / registry). */
export async function GET() {
  const db = await loadNomiDb();
  const accounts = Object.values(db.accountsById).map((a) => stripAccount(a));
  const creators = accounts.map(accountToCreator);
  return NextResponse.json({ creators, accounts });
}
