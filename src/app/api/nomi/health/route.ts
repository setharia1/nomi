import { NextResponse } from "next/server";
import { isNomiRedisConfigured, mustBlockVercelAuthWithoutRedis } from "@/lib/server/nomiDb";

/**
 * Quick persistence check for Vercel env (no secrets returned).
 * GET /api/nomi/health → { redis, blob, authOk, ok }
 */
export async function GET() {
  const redis = isNomiRedisConfigured();
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  const authBroken = mustBlockVercelAuthWithoutRedis();
  return NextResponse.json({
    redis,
    blob,
    /** False when Vercel has no Redis — sign-up/login will return 503 until fixed. */
    authOk: !authBroken,
    /** Redis + Blob both set — full persistence for accounts and public media. */
    ok: redis && blob,
  });
}
