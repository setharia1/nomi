import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { loadDbWithSession } from "@/lib/server/nomiSession";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!blobToken) {
    return NextResponse.json(
      { error: "Blob storage not configured (set BLOB_READ_WRITE_TOKEN on Vercel)" },
      { status: 501 },
    );
  }

  const { accountId } = await loadDbWithSession(request);
  if (!accountId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = (await request.json()) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const isBodyObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null;
  const pathname =
    isBodyObject(body) && "pathname" in body
      ? body.pathname
      : undefined;
  if (typeof pathname !== "string" || !pathname.trim()) {
    return NextResponse.json({ error: "Invalid upload request payload" }, { status: 400 });
  }

  const prefix = `nomi/${accountId}/`;

  try {
    const jsonResponse = await handleUpload({
      token: blobToken,
      request,
      body: body as HandleUploadBody,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(prefix)) {
          throw new Error("Invalid upload path");
        }
        return {
          addRandomSuffix: true,
          allowedContentTypes: [
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
          ],
          maximumSizeInBytes: 120 * 1024 * 1024,
        };
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
