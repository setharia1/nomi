import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const DEFAULT_MODEL = "gemini-2.0-flash";

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_GENERATIVE_AI_API_KEY is not set" },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const prompt =
    typeof body === "object" && body !== null && "prompt" in body
      ? (body as { prompt: unknown }).prompt
      : undefined;

  if (typeof prompt !== "string" || !prompt.trim()) {
    return NextResponse.json({ error: "prompt (non-empty string) is required" }, { status: 400 });
  }

  const modelId = process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelId });
    const result = await model.generateContent(prompt.trim());
    const text = result.response.text();

    return NextResponse.json({ text, model: modelId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Gemini request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
