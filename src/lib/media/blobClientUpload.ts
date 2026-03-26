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

const FALLBACK_POSTER =
  "https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=800&q=80";

/** Keep under typical serverless JSON body limits when inlining without Blob. */
const MAX_BLOB_INLINE_BYTES = 2 * 1024 * 1024;
const MAX_DATA_URL_BYTES = 2 * 1024 * 1024;

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error ?? new Error("read failed"));
    fr.readAsDataURL(blob);
  });
}

function approxDataUrlByteLength(dataUrl: string): number {
  const m = dataUrl.match(/^data:[^;,]+;base64,(.+)$/i);
  if (m) return Math.floor((m[1].length * 3) / 4);
  const i = dataUrl.indexOf(",");
  if (i < 0 || !dataUrl.startsWith("data:")) return 0;
  try {
    return new TextEncoder().encode(decodeURIComponent(dataUrl.slice(i + 1))).length;
  } catch {
    return dataUrl.length;
  }
}

async function inlineBlobUrlsInPost(post: Post): Promise<Post> {
  let next = { ...post };

  const one = async (url: string | undefined): Promise<string | undefined> => {
    if (!url?.startsWith("blob:")) return url;
    try {
      const r = await fetch(url);
      const blob = await r.blob();
      if (blob.size > MAX_BLOB_INLINE_BYTES) return url;
      return await readBlobAsDataUrl(blob);
    } catch {
      return url;
    }
  };

  const v = await one(next.videoUrl);
  if (v !== next.videoUrl) next = { ...next, videoUrl: v };
  const img = await one(next.imageUrl);
  if (img !== undefined && img !== next.imageUrl) next = { ...next, imageUrl: img };

  return next;
}

function stripMediaUnusableForSharedFeed(post: Post): Post {
  let next = { ...post };
  if (next.videoUrl?.startsWith("blob:")) next = { ...next, videoUrl: undefined };
  if (next.imageUrl?.startsWith("blob:")) next = { ...next, imageUrl: FALLBACK_POSTER };
  if (next.videoUrl?.startsWith("data:") && approxDataUrlByteLength(next.videoUrl) > MAX_DATA_URL_BYTES) {
    next = { ...next, videoUrl: undefined };
  }
  if (next.imageUrl?.startsWith("data:") && approxDataUrlByteLength(next.imageUrl) > MAX_DATA_URL_BYTES) {
    next = { ...next, imageUrl: FALLBACK_POSTER };
  }
  return next;
}

/**
 * Prepare a post for `POST /api/nomi/posts`: public Blob URLs when configured, otherwise inline small
 * `blob:` media as `data:` so the shared DB does not store origin-local URLs other clients cannot load.
 */
export async function ensurePostReachableMedia(
  post: Post,
  accountId: string,
  bearerToken: string,
): Promise<Post> {
  let next = { ...post };
  if (postNeedsPublicMediaUpload(next)) {
    try {
      next = await ensurePostMediaPublicUrls(next, accountId, bearerToken);
    } catch (e) {
      if (typeof console !== "undefined" && console.warn) {
        console.warn("[nomi] Client Blob upload failed; falling back to inline data if small enough.", e);
      }
    }
  }
  if (postNeedsPublicMediaUpload(next)) {
    next = await inlineBlobUrlsInPost(next);
  }
  next = stripMediaUnusableForSharedFeed(next);
  return next;
}
