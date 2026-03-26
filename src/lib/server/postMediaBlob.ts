import { put } from "@vercel/blob";
import type { Post } from "@/lib/types";

function extForMime(mime: string): string {
  const m = mime.toLowerCase().split(";")[0] ?? "";
  if (m.includes("webm")) return "webm";
  if (m.includes("quicktime") || m.endsWith("/mov")) return "mov";
  if (m.includes("png")) return "png";
  if (m.includes("webp")) return "webp";
  if (m.includes("gif")) return "gif";
  if (m.includes("jpeg") || m.includes("jpg")) return "jpg";
  if (m.startsWith("video/")) return "mp4";
  if (m.startsWith("image/")) return "jpg";
  return "bin";
}

function parseDataUrl(dataUrl: string): { buffer: Buffer; mime: string; ext: string } | null {
  const m = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!m) return null;
  const mime = m[1].trim();
  try {
    const buffer = Buffer.from(m[2], "base64");
    return { buffer, mime, ext: extForMime(mime) };
  } catch {
    return null;
  }
}

/** Small poster / thumbnail only — avoid huge video bodies on the serverless request. */
const MAX_SERVER_INLINE_BYTES = 3 * 1024 * 1024;

/**
 * Upload any remaining data: URLs to Blob using the server token (fallback if client did not upload).
 * Skips very large payloads (videos) to avoid memory/time limits.
 */
export async function rewritePostDataUrlsForStorage(post: Post, accountId: string): Promise<Post> {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) return post;

  let next = { ...post };

  async function maybePut(dataUrl: string | undefined, label: string): Promise<string | undefined> {
    if (!dataUrl?.startsWith("data:")) return undefined;
    const parsed = parseDataUrl(dataUrl);
    if (!parsed || parsed.buffer.byteLength > MAX_SERVER_INLINE_BYTES) return undefined;
    const path = `nomi/${accountId}/${post.id}-${label}-${Date.now()}.${parsed.ext}`;
    const blob = await put(path, parsed.buffer, {
      access: "public",
      token,
      contentType: parsed.mime,
    });
    return blob.url;
  }

  const vid = await maybePut(next.videoUrl, "video");
  if (vid) next = { ...next, videoUrl: vid };

  const img = await maybePut(next.imageUrl, "poster");
  if (img) next = { ...next, imageUrl: img };

  return next;
}
