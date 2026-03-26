"use client";

import type { Post } from "@/lib/types";

/** Rough base64 payload size (bytes) — avoids canvas work when already small enough. */
function approxDataUrlBytes(dataUrl: string): number {
  const m = dataUrl.match(/^data:[^;,]+;base64,(.+)$/i);
  if (m) return Math.floor((m[1].length * 3) / 4);
  return dataUrl.length;
}

const DEFAULT_MAX_BYTES = 1.2 * 1024 * 1024;
const DEFAULT_MAX_EDGE = 1920;
const IMAGE_DECODE_MS = 22_000;

type DecodeResult =
  | { ok: true; img: HTMLImageElement }
  | { ok: false; reason: "timeout" | "error" };

function decodeImageElement(dataUrl: string, timeoutMs: number): Promise<DecodeResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => {
      img.onload = null;
      img.onerror = null;
      img.removeAttribute("src");
      resolve({ ok: false, reason: "timeout" });
    }, timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve({ ok: true, img });
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve({ ok: false, reason: "error" });
    };
    img.src = dataUrl;
  });
}

/**
 * Target max serialized JSON length so `POST /api/nomi/posts` stays under typical serverless body limits.
 */
const SAFE_JSON_BODY_CHARS = 2_650_000;

/**
 * Shrinks large camera / Imagen data URLs so publish + Vercel Blob + JSON body stay reliable.
 */
export async function compressImageDataUrlIfLarge(
  dataUrl: string,
  opts?: { maxBytes?: number; maxEdge?: number; quality?: number; decodeTimeoutMs?: number },
): Promise<string> {
  if (typeof window === "undefined" || !dataUrl.startsWith("data:image/")) {
    return dataUrl;
  }

  const maxBytes = opts?.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxEdge = opts?.maxEdge ?? DEFAULT_MAX_EDGE;
  const quality = opts?.quality ?? 0.85;
  const decodeTimeoutMs = opts?.decodeTimeoutMs ?? IMAGE_DECODE_MS;

  if (approxDataUrlBytes(dataUrl) <= maxBytes) {
    return dataUrl;
  }

  const decoded = await decodeImageElement(dataUrl, decodeTimeoutMs);
  if (!decoded.ok) {
    return dataUrl;
  }
  const img = decoded.img;
  let { naturalWidth: w, naturalHeight: h } = img;
  if (!w || !h) {
    return dataUrl;
  }
  const scale = Math.min(1, maxEdge / Math.max(w, h));
  const tw = Math.max(1, Math.round(w * scale));
  const th = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = tw;
  canvas.height = th;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return dataUrl;
  }
  ctx.drawImage(img, 0, 0, tw, th);
  try {
    const jpeg = canvas.toDataURL("image/jpeg", quality);
    return approxDataUrlBytes(jpeg) < approxDataUrlBytes(dataUrl) ? jpeg : dataUrl;
  } catch {
    return dataUrl;
  }
}

/**
 * Re-compresses `imageUrl` data URLs until the post JSON is small enough for the posts API.
 */
export async function shrinkPostDataUrlsForSafeJsonBody(post: Post): Promise<Post> {
  if (typeof window === "undefined") {
    return post;
  }

  let p: Post = { ...post };
  const tiers = [
    { maxBytes: 900_000, maxEdge: 1920, quality: 0.84 },
    { maxBytes: 550_000, maxEdge: 1600, quality: 0.8 },
    { maxBytes: 380_000, maxEdge: 1280, quality: 0.76 },
    { maxBytes: 260_000, maxEdge: 1024, quality: 0.72 },
  ] as const;

  let tier = 0;
  while (JSON.stringify(p).length > SAFE_JSON_BODY_CHARS && tier < tiers.length) {
    if (!p.imageUrl?.startsWith("data:image/")) break;
    const t = tiers[tier];
    p = {
      ...p,
      imageUrl: await compressImageDataUrlIfLarge(p.imageUrl, {
        maxBytes: t.maxBytes,
        maxEdge: t.maxEdge,
        quality: t.quality,
      }),
    };
    tier += 1;
  }

  if (JSON.stringify(p).length > SAFE_JSON_BODY_CHARS) {
    throw new Error(
      "This post is still too large to upload. Try a smaller image or ensure image compression isn’t blocked in your browser.",
    );
  }

  return p;
}
