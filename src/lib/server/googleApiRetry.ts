import { ApiError } from "@google/genai";
import { GoogleGenerativeAIFetchError } from "@google/generative-ai";

/** True when backing off and retrying may help (rate limit / quota burst). */
export function isTransientGoogleQuotaError(err: unknown): boolean {
  if (err instanceof ApiError && (err.status === 429 || err.status === 503)) return true;
  if (err instanceof GoogleGenerativeAIFetchError && (err.status === 429 || err.status === 503)) {
    return true;
  }
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("too many requests") ||
    (msg.includes("quota") && (msg.includes("exceeded") || msg.includes("exhaust")))
  );
}

export function googleErrorSuggestedStatus(err: unknown): number {
  return isTransientGoogleQuotaError(err) ? 429 : 502;
}

function sleep(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

/**
 * Retries on 429/503 and similar — fixes many "quota" errors that clear after a few seconds.
 */
export async function withGoogleApiRetries<T>(
  fn: () => Promise<T>,
  opts?: { maxAttempts?: number; baseDelayMs?: number; maxDelayMs?: number },
): Promise<T> {
  const maxAttempts = opts?.maxAttempts ?? 5;
  const base = opts?.baseDelayMs ?? 1200;
  const cap = opts?.maxDelayMs ?? 30_000;
  let last: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      if (!isTransientGoogleQuotaError(e) || attempt === maxAttempts) {
        throw e;
      }
      const jitter = Math.floor(Math.random() * 500);
      const delay = Math.min(base * Math.pow(2, attempt - 1) + jitter, cap);
      await sleep(delay);
    }
  }
  throw last;
}

/**
 * Fetch a Google-hosted asset URL (e.g. generated video) with `x-goog-api-key`.
 * Retries when the CDN returns 429/503.
 */
export async function fetchGoogleKeyedResource(url: string, apiKey: string): Promise<Response> {
  return withGoogleApiRetries(async () => {
    const res = await fetch(url, {
      headers: { "x-goog-api-key": apiKey },
      redirect: "follow",
    });
    if (res.status === 429 || res.status === 503) {
      const snippet = await res.text().then((t) => t.slice(0, 200)).catch(() => "");
      throw new Error(`Google download ${res.status}: ${snippet || res.statusText}`);
    }
    return res;
  });
}
