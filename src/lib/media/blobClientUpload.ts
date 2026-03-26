"use client";

import { upload } from "@vercel/blob/client";
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

function dataUrlToBlob(dataUrl: string): { blob: Blob; mime: string } {
  const m = dataUrl.match(/^data:([^;,]+)(;base64)?,(.+)$/);
  if (!m) throw new Error("Invalid data URL");
  const mime = m[1].trim();
  const isBase64 = !!m[2];
  const data = m[3];
  if (isBase64) {
    const bin = atob(data);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return { blob: new Blob([bytes], { type: mime }), mime };
  }
  return { blob: new Blob([decodeURIComponent(data)], { type: mime }), mime };
}

async function urlToBlob(url: string): Promise<{ blob: Blob; mime: string }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Could not read media for upload");
  const blob = await r.blob();
  const mime = blob.type || "application/octet-stream";
  return { blob, mime };
}

export function postNeedsPublicMediaUpload(post: Post): boolean {
  const v = post.videoUrl ?? "";
  const i = post.imageUrl ?? "";
  return v.startsWith("data:") || v.startsWith("blob:") || i.startsWith("data:") || i.startsWith("blob:");
}

/**
 * Upload data:/blob: media to Vercel Blob so posts are visible on all devices and in the global feed.
 */
export async function ensurePostMediaPublicUrls(
  post: Post,
  accountId: string,
  bearerToken: string,
): Promise<Post> {
  let next = { ...post };
  const prefix = `nomi/${accountId}`;
  const headers = { Authorization: `Bearer ${bearerToken}` };

  const uploadBlob = async (blob: Blob, mime: string, kind: string) => {
    const ext = extForMime(mime);
    const pathname = `${prefix}/${post.id}-${kind}-${Date.now()}.${ext}`;
    const res = await upload(pathname, blob, {
      access: "public",
      handleUploadUrl: "/api/nomi/media",
      headers,
      contentType: mime || undefined,
      multipart: blob.size > 8 * 1024 * 1024,
    });
    return res.url;
  };

  const maybeReplace = async (
    url: string | undefined,
    kind: string,
    setter: (u: string) => void,
  ) => {
    if (!url || url.startsWith("http")) return;
    if (url.startsWith("data:")) {
      const { blob, mime } = dataUrlToBlob(url);
      setter(await uploadBlob(blob, mime, kind));
      return;
    }
    if (url.startsWith("blob:")) {
      const { blob, mime } = await urlToBlob(url);
      setter(await uploadBlob(blob, mime, kind));
    }
  };

  await maybeReplace(next.videoUrl, "video", (u) => {
    next = { ...next, videoUrl: u };
  });
  await maybeReplace(next.imageUrl, "poster", (u) => {
    next = { ...next, imageUrl: u };
  });

  return next;
}
