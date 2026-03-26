import { NextResponse } from "next/server";
import { createGoogleGenAI, formatGenAiError } from "@/lib/server/google-genai";
import { googleErrorSuggestedStatus, withGoogleApiRetries } from "@/lib/server/googleApiRetry";

export const runtime = "nodejs";
export const maxDuration = 120;

/** See https://ai.google.dev/gemini-api/docs/imagen — override with IMAGEN_MODEL if needed. */
const DEFAULT_IMAGEN_MODEL = "imagen-3.0-generate-002";

const ASPECT_RATIOS = new Set(["1:1", "3:4", "4:3", "9:16", "16:9"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt =
    typeof body === "object" && body !== null && "prompt" in body
      ? String((body as { prompt: unknown }).prompt).trim()
      : "";
  if (!prompt) {
    return NextResponse.json({ error: "prompt (non-empty string) is required" }, { status: 400 });
  }

  const arRaw =
    typeof body === "object" && body !== null && "aspectRatio" in body
      ? String((body as { aspectRatio: unknown }).aspectRatio).trim()
      : "9:16";
  const aspectRatio = ASPECT_RATIOS.has(arRaw) ? arRaw : "9:16";

  const model = process.env.IMAGEN_MODEL?.trim() || DEFAULT_IMAGEN_MODEL;
  const ai = createGoogleGenAI();

  try {
    const resp = await withGoogleApiRetries(() =>
      ai.models.generateImages({
        model,
        prompt,
        config: {
          numberOfImages: 1,
          aspectRatio,
          includeRaiReason: true,
        },
      }),
    );

    const first = resp.generatedImages?.[0];
    const img = first?.image;
    const b64 = img?.imageBytes;

    if (!b64) {
      return NextResponse.json(
        {
          error:
            first?.raiFilteredReason?.trim() ||
            "No image returned — try another prompt or confirm Imagen is enabled for your API key.",
        },
        { status: 502 },
      );
    }

    const mimeType = img?.mimeType?.trim() || "image/png";
    return NextResponse.json({
      imageBase64: b64,
      mimeType,
      model,
    });
  } catch (err) {
    return NextResponse.json(
      { error: formatGenAiError(err) },
      { status: googleErrorSuggestedStatus(err) },
    );
  }
}
