/**
 * Grab a JPEG data URL from the first decodable moment of a video (client-only).
 * Used at publish time so profile grids can use a real frame as `post.imageUrl`.
 */
export function captureVideoPosterDataUrl(videoSrc: string): Promise<string | null> {
  if (typeof document === "undefined") return Promise.resolve(null);

  return new Promise((resolve) => {
    const video = document.createElement("video");
    if (videoSrc.startsWith("http://") || videoSrc.startsWith("https://")) {
      video.crossOrigin = "anonymous";
    }
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "");
    video.preload = "auto";

    const finish = (url: string | null) => {
      try {
        video.removeAttribute("src");
        video.load();
      } catch {
        /* ignore */
      }
      resolve(url);
    };

    const timeout = window.setTimeout(() => finish(null), 12_000);

    video.onerror = () => {
      clearTimeout(timeout);
      finish(null);
    };

    video.onloadedmetadata = () => {
      try {
        const d = video.duration;
        const t =
          Number.isFinite(d) && d > 0 ? Math.min(0.12, Math.max(0.01, d * 0.02)) : 0.05;
        video.currentTime = t;
      } catch {
        clearTimeout(timeout);
        finish(null);
      }
    };

    video.onseeked = () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          clearTimeout(timeout);
          finish(null);
          return;
        }
        const canvas = document.createElement("canvas");
        const maxSide = 1080;
        const scale = Math.min(1, maxSide / Math.max(w, h));
        canvas.width = Math.max(1, Math.round(w * scale));
        canvas.height = Math.max(1, Math.round(h * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          clearTimeout(timeout);
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        clearTimeout(timeout);
        finish(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        clearTimeout(timeout);
        finish(null);
      }
    };

    video.src = videoSrc;
  });
}
