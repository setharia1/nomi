import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import {
  googleErrorSuggestedStatus,
  isTransientGoogleQuotaError,
  withGoogleApiRetries,
} from "@/lib/server/googleApiRetry";

const DEFAULT_MODEL = "gemini-2.0-flash";
const LAST_RESORT_TEXT_MODEL = "gemini-1.5-flash";

function geminiModelCandidates(): string[] {
  const primary = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
  const fromEnv = process.env.GEMINI_MODEL_FALLBACK?.trim();
  const ordered = [primary, fromEnv, LAST_RESORT_TEXT_MODEL].filter(
    (m): m is string => Boolean(m?.length),
  );
  return [...new Set(ordered)];
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY is not set" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt =
    typeof body === "object" && body !== null && "prompt" in body
      ? (body as { prompt: unknown }).prompt
      : undefined;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt (non-empty string) is required" }, { status: 400 });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastErr: unknown;

  for (const modelId of geminiModelCandidates()) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await withGoogleApiRetries(() => model.generateContent(prompt.trim()));
      const text = result.response.text();
      return NextResponse.json({ text, model: modelId });
    } catch (err) {
      lastErr = err;
      if (!isTransientGoogleQuotaError(err)) {
        break;
      }
    }
  }

  const message = lastErr instanceof Error ? lastErr.message : "Gemini request failed";
  return NextResponse.json({ error: message }, { status: googleErrorSuggestedStatus(lastErr) });
}
