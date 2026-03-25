/** Client-only: normalize any common photo upload into a JPEG data URL for storage + universal display. */

const MAX_AVATAR_EDGE = 1024;
const JPEG_QUALITY = 0.9;
const MAX_INPUT_BYTES = 45 * 1024 * 1024;

const IMAGE_EXT = /\.(jpe?g|png|gif|webp|bmp|avif|hei[cf]|tif|tiff|ico)$/i;

function isProbablyImage(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (IMAGE_EXT.test(file.name)) return true;
  return false;
}

function isHeicFamily(file: File): boolean {
  const t = file.type.toLowerCase();
  if (t === "image/heic" || t === "image/heif") return true;
  return /\.hei[cf]$/i.test(file.name);
}

async function fileToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file."));
    r.readAsDataURL(blob);
  });
}

async function tryHeicToJpegBlob(file: File): Promise<Blob | null> {
  if (!isHeicFamily(file)) return null;
  try {
    const { default: heic2any } = await import("heic2any");
    const out = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.92 });
    const blob = Array.isArray(out) ? out[0] : out;
    return blob ?? null;
  } catch {
    return null;
  }
}

function rasterToJpegDataUrl(source: CanvasImageSource, sw: number, sh: number): string {
  let w = sw;
  let h = sh;
  if (w > MAX_AVATAR_EDGE || h > MAX_AVATAR_EDGE) {
    const s = MAX_AVATAR_EDGE / Math.max(w, h);
    w = Math.max(1, Math.round(w * s));
    h = Math.max(1, Math.round(h * s));
  }

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process image in this browser.");

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  try {
    ctx.drawImage(source, 0, 0, sw, sh, 0, 0, w, h);
  } catch {
    throw new Error("Could not decode this image.");
  }

  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  if (!dataUrl.startsWith("data:image/jpeg")) {
    throw new Error("Could not convert photo to a shareable format.");
  }
  return dataUrl;
}

async function loadImageElementFromBlob(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("decode"));
      img.src = url;
    });
    if (!img.naturalWidth || !img.naturalHeight) throw new Error("Invalid image.");
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Turns user-selected photos (JPEG, PNG, GIF, WebP, BMP, AVIF, TIFF where supported,
 * HEIC/HEIF via conversion, odd MIME types from Android/iOS pickers, etc.) into a JPEG data URL.
 */
export async function normalizeProfilePhotoFile(file: File): Promise<string> {
  if (!file.size) throw new Error("That file is empty.");
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Photo is too large. Please use an image under 45MB.");
  }
  if (!isProbablyImage(file)) {
    throw new Error("Please choose a photo (camera or gallery image).");
  }

  let blob: Blob = file;
  const jpegFromHeic = await tryHeicToJpegBlob(file);
  if (jpegFromHeic) blob = jpegFromHeic;

  try {
    const bitmap = await createImageBitmap(blob);
    try {
      return rasterToJpegDataUrl(bitmap, bitmap.width, bitmap.height);
    } finally {
      bitmap.close();
    }
  } catch {
    /* try img path */
  }

  try {
    const img = await loadImageElementFromBlob(blob);
    return rasterToJpegDataUrl(img, img.naturalWidth, img.naturalHeight);
  } catch {
    /* fall through */
  }

  const dataUrl = await fileToDataUrl(blob);
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("This file could not be opened as a photo. Try another image.");
  }
  return dataUrl;
}

export function isDataUrlAvatar(src: string): boolean {
  return src.startsWith("data:image/");
}
