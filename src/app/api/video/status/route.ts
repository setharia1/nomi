import { NextResponse } from "next/server";
import { createGoogleGenAI, formatGenAiError, videoOperationFromName } from "@/lib/server/google-genai";

export const runtime = "nodejs";
export const maxDuration = 300;

function parseOperationName(raw: string | null): string | null {
  if (!raw) return null;
  const name = decodeURIComponent(raw).trim();
  if (!name || name.length > 600) return null;
  if (!/^[\w\-./]+$/.test(name)) return null;
  return name;
}

export async function GET(request: Request) {
  const name = parseOperationName(new URL(request.url).searchParams.get("name"));
  if (!name) {
    return NextResponse.json({ error: "Invalid or missing name" }, { status: 400 });
  }

  try {
    const ai = createGoogleGenAI();
    const operation = await ai.operations.getVideosOperation({
      operation: videoOperationFromName(name),
    });

    const errMsg =
      operation.error && typeof operation.error === "object" && "message" in operation.error
        ? String((operation.error as { message: unknown }).message)
        : operation.error
          ? JSON.stringify(operation.error)
          : null;

    return NextResponse.json({
      done: Boolean(operation.done),
      error: errMsg,
    });
  } catch (err) {
    return NextResponse.json({ error: formatGenAiError(err) }, { status: 502 });
  }
}
