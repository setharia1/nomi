import { NextResponse } from "next/server";
import {
  requireGeminiApiKey,
  createGoogleGenAI,
  formatGenAiError,
  videoOperationFromName,
} from "@/lib/server/google-genai";
import {
  fetchGoogleKeyedResource,
  googleErrorSuggestedStatus,
  withGoogleApiRetries,
} from "@/lib/server/googleApiRetry";
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

    if (!operation.done) {
      return NextResponse.json({ error: "Video is not ready yet" }, { status: 409 });
    }

    if (operation.error) {
      const msg =
        typeof operation.error === "object" && operation.error !== null && "message" in operation.error
          ? String((operation.error as { message: unknown }).message)
          : "Generation failed";
      return NextResponse.json({ error: msg }, { status: 502 });
    }

    const genResponse = operation.response;
    const video = genResponse?.generatedVideos?.[0]?.video;
    if (!video) {
      const reasons = genResponse?.raiMediaFilteredReasons;
      if (reasons?.length) {
        return NextResponse.json(
          { error: `Output was filtered: ${reasons.join("; ")}` },
          { status: 502 },
        );
      }
      return NextResponse.json({ error: "No video in response" }, { status: 502 });
    }

    const mime = video.mimeType?.trim() || "video/mp4";

    if (video.videoBytes) {
      const buf = Buffer.from(video.videoBytes, "base64");
      return new NextResponse(buf, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    if (video.uri) {
      const key = requireGeminiApiKey();
      const res = await fetchGoogleKeyedResource(video.uri, key);
      if (!res.ok) {
        return NextResponse.json(
          { error: `Download failed (${res.status})` },
          { status: 502 },
        );
      }
      const buf = Buffer.from(await res.arrayBuffer());
      return new NextResponse(buf, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "private, max-age=3600",
        },
      });
    }

    return NextResponse.json({ error: "Video has no uri or bytes" }, { status: 502 });
  } catch (err) {
    return NextResponse.json(
      { error: formatGenAiError(err) },
      { status: googleErrorSuggestedStatus(err) },
    );
  }
}
