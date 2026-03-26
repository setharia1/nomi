import { ApiError, GenerateVideosOperation, GoogleGenAI } from "@google/genai";

/**
 * Google AI for Nomi runs only in Route Handlers (`/api/*`). One
 * `GOOGLE_GENERATIVE_AI_API_KEY` on the server backs every visitor’s generation — never
 * `NEXT_PUBLIC_*`. Set the same variable on your host (Vercel, etc.) for production, not only in
 * `.env.local`.
 */
export function formatGenAiError(err: unknown): string {
  if (err instanceof ApiError) {
    const s = err.status;
    const base = err.message || "Google API error";
    return s != null ? `${base} (HTTP ${s})` : base;
  }
  if (err instanceof Error) return err.message;
  return "Request failed";
}

/** Wrong model id / deprecated Imagen name — try next candidate. */
export function isGenAiModelNotFoundError(err: unknown): boolean {
  if (err instanceof ApiError && err.status === 404) return true;
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return msg.includes("not found") && msg.includes("models/");
}

export function requireGeminiApiKey(): string {
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!key?.trim()) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY is not set");
  }
  return key.trim();
}

export function createGoogleGenAI(): GoogleGenAI {
  return new GoogleGenAI({ apiKey: requireGeminiApiKey() });
}

export function videoOperationFromName(name: string): GenerateVideosOperation {
  const op = new GenerateVideosOperation();
  op.name = name;
  return op;
}
