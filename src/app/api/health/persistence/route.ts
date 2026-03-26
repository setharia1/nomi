import { NextResponse } from "next/server";
import { getNomiPersistenceStatus } from "@/lib/server/nomiDb";

export async function GET() {
  const status = getNomiPersistenceStatus();
  return NextResponse.json(
    {
      ok: status.productionReady,
      persistence: status,
    },
    { status: status.productionReady ? 200 : 503 },
  );
}
