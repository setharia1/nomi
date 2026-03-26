import type { NomiDb } from "./nomiTypes";
import { loadNomiDb } from "./nomiDb";

export async function getSessionAccountId(req: Request, db: NomiDb): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  if (!token) return null;
  const s = db.sessions[token];
  if (!s || s.expiresAt < Date.now()) return null;
  return s.accountId;
}

export async function loadDbWithSession(req: Request): Promise<{
  db: NomiDb;
  accountId: string | null;
}> {
  const db = await loadNomiDb();
  const accountId = await getSessionAccountId(req, db);
  return { db, accountId };
}
