import { NextResponse } from "next/server";
import { createGoogleGenAI, formatGenAiError, videoOperationFromName } from "@/lib/server/google-genai";
import { googleErrorSuggestedStatus, withGoogleApiRetries } from "@/lib/server/googleApiRetry";
import { parseOperationNameParam } from "@/lib/server/requestParams";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(request: Request) {
  const name = parseOperationNameParam(new URL(request.url).searchParams.get("name"));
  if (!name) {
    return NextResponse.json({ error: "Invalid or missing name" }, { status: 400 });
  }

  try {
    const ai = createGoogleGenAI();
    const operation = await withGoogleApiRetries(() =>
      ai.operations.getVideosOperation({
        operation: videoOperationFromName(name),
      }),
    );

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
    return NextResponse.json(
      { error: formatGenAiError(err) },
      { status: googleErrorSuggestedStatus(err) },
    );
  }
}
