import { NextResponse } from "next/server";
import { isNomiRedisConfigured } from "@/lib/server/nomiDb";

/**
 * Quick persistence check for Vercel env (no secrets returned).
 * GET /api/nomi/health → { redis, blob, postsPersist: redis && blob }
 */
export async function GET() {
  const redis = isNomiRedisConfigured();
  const blob = Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
  return NextResponse.json({
    redis,
    blob,
    /** Both recommended so passwords/posts + video URLs survive across devices. */
    ok: redis && blob,
  });
}
