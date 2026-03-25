import { NextResponse } from "next/server";
import type { GenerateVideosConfig } from "@google/genai";
import { VideoCompressionQuality } from "@google/genai";
import { createGoogleGenAI, formatGenAiError } from "@/lib/server/google-genai";

export const runtime = "nodejs";
/** Room for large MP4 passthrough on hosts like Vercel (requires Pro for >60s). */
export const maxDuration = 300;

/** Cheaper / faster tier — keep aligned with https://ai.google.dev/gemini-api/docs/pricing#veo-3.1 */
const DEFAULT_VEO_MODEL = "veo-3.1-fast-generate-preview";

function veoConfigFromEnv(aspectRatio: "16:9" | "9:16"): {
  config: GenerateVideosConfig;
  /** Set when user asks for an unsupported resolution (e.g. 480p). */
  resolutionNote?: string;
  requestedResolution?: string;
} {
  const config: GenerateVideosConfig = { aspectRatio };

  const audio = process.env.VEO_GENERATE_AUDIO?.trim().toLowerCase();
  if (audio === "false" || audio === "0" || audio === "no" || audio === "off") {
    config.generateAudio = false;
  }

  const durRaw = process.env.VEO_VIDEO_DURATION_SECONDS?.trim();
  if (durRaw) {
    const n = Number(durRaw);
    if (Number.isFinite(n) && n >= 1 && n <= 60) {
      config.durationSeconds = Math.floor(n);
    }
  }

  const compress = process.env.VEO_VIDEO_COMPRESSION?.trim().toLowerCase();
  if (compress === "optimized" || compress === "opt" || compress === "small") {
    config.compressionQuality = VideoCompressionQuality.OPTIMIZED;
  } else if (compress === "lossless" || compress === "high") {
    config.compressionQuality = VideoCompressionQuality.LOSSLESS;
  }

  const resRaw = process.env.VEO_VIDEO_RESOLUTION?.trim().toLowerCase();
  let resolutionNote: string | undefined;
  let requestedResolution: string | undefined;

  if (resRaw === "480p") {
    /** Veo outputs 720p / 1080p / 4k only — see https://ai.google.dev/gemini-api/docs/video */
    requestedResolution = "480p";
    config.resolution = "720p";
    const useLossless = compress === "lossless" || compress === "high";
    if (!useLossless) {
      config.compressionQuality = VideoCompressionQuality.OPTIMIZED;
    }
    resolutionNote = useLossless
      ? "Veo does not offer 480p. Using 720p with LOSSLESS compression."
      : "Veo does not offer 480p. Using 720p with OPTIMIZED compression (closest to a smaller file).";
  } else if (resRaw === "720p" || resRaw === "1080p" || resRaw === "4k") {
    config.resolution = resRaw;
  }

  return { config, resolutionNote, requestedResolution };
}

export async function POST(request: Request) {
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

  const aspectRatioRaw =
    typeof body === "object" && body !== null && "aspectRatio" in body
      ? (body as { aspectRatio: unknown }).aspectRatio
      : undefined;

  const aspectRatio =
    aspectRatioRaw === "16:9" || aspectRatioRaw === "9:16" ? aspectRatioRaw : "9:16";

  const model = process.env.VEO_MODEL?.trim() || DEFAULT_VEO_MODEL;
  const { config, resolutionNote, requestedResolution } = veoConfigFromEnv(aspectRatio);

  try {
    const ai = createGoogleGenAI();
    const operation = await ai.models.generateVideos({
      model,
      prompt: prompt.trim(),
      config,
    });

    if (!operation.name) {
      return NextResponse.json({ error: "Video generation did not return an operation name" }, { status: 502 });
    }

    return NextResponse.json({
      operationName: operation.name,
      model,
      aspectRatio,
      videoConfig: {
        generateAudio: config.generateAudio,
        durationSeconds: config.durationSeconds,
        resolution: config.resolution,
        compressionQuality: config.compressionQuality,
        requestedResolution,
        resolutionNote,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: formatGenAiError(err) }, { status: 502 });
  }
}
