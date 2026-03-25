import { ApiError, GenerateVideosOperation, GoogleGenAI } from "@google/genai";

export function formatGenAiError(err: unknown): string {
  if (err instanceof ApiError) {
    const s = err.status;
    const base = err.message || "Google API error";
    return s != null ? `${base} (HTTP ${s})` : base;
  }
  if (err instanceof Error) return err.message;
  return "Request failed";
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
