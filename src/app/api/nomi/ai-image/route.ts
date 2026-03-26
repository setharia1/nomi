import { NextResponse } from "next/server";
import {
  createGoogleGenAI,
  formatGenAiError,
  isGenAiModelNotFoundError,
} from "@/lib/server/google-genai";
import { googleErrorSuggestedStatus, withGoogleApiRetries } from "@/lib/server/googleApiRetry";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Imagen 3 IDs are retired for the Gemini API — use Imagen 4.
 * https://ai.google.dev/gemini-api/docs/imagen
 */
function imagenModelCandidates(): string[] {
  const fromEnv = process.env.IMAGEN_MODEL?.trim();
  const defaults = [
    "imagen-4.0-fast-generate-001",
    "imagen-4.0-generate-001",
    "imagen-4.0-ultra-generate-001",
  ];
  const ordered = fromEnv ? [fromEnv, ...defaults.filter((m) => m !== fromEnv)] : defaults;
  return [...new Set(ordered)];
}

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
      ? typeof (body as { prompt: unknown }).prompt === "string"
        ? (body as { prompt: string }).prompt.trim()
        : ""
      : "";
  if (!prompt) {
    return NextResponse.json({ error: "prompt (non-empty string) is required" }, { status: 400 });
  }

  const arRaw =
    typeof body === "object" && body !== null && "aspectRatio" in body
      ? String((body as { aspectRatio: unknown }).aspectRatio).trim()
      : "9:16";
  const aspectRatio = ASPECT_RATIOS.has(arRaw) ? arRaw : "9:16";

  const ai = createGoogleGenAI();
  const config = {
    numberOfImages: 1,
    aspectRatio,
    includeRaiReason: true,
  };

  let lastErr: unknown;

  for (const modelId of imagenModelCandidates()) {
    try {
      const resp = await withGoogleApiRetries(() =>
        ai.models.generateImages({
          model: modelId,
          prompt,
          config,
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
        model: modelId,
      });
    } catch (err) {
      lastErr = err;
      if (isGenAiModelNotFoundError(err)) {
        continue;
      }
      break;
    }
  }

  return NextResponse.json(
    { error: formatGenAiError(lastErr) },
    { status: googleErrorSuggestedStatus(lastErr) },
  );
}
