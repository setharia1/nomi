import { NextResponse } from "next/server";
import { loadNomiDb, saveNomiDb } from "@/lib/server/nomiDb";

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  const token = auth?.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ ok: true });
  }
  const db = await loadNomiDb();
  delete db.sessions[token];
  await saveNomiDb(db);
  return NextResponse.json({ ok: true });
}
