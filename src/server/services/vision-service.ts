/**
 * Vision provider abstraction.
 * Supports: Ollama (default), OpenAI GPT-4o, Gemini Flash.
 * Controlled by VISION_PROVIDER env var.
 * Gracefully returns [] when provider is unavailable/misconfigured.
 */

export interface ParsedFood {
  name: string;
  weightG: number;
  confidence: number;
}

const FOOD_RECOGNITION_PROMPT =
  "List all food items visible in this image. For each item provide: name, estimated weight in grams, confidence (0-1). " +
  "Return ONLY a JSON array in this exact format: " +
  '[{"name": "Food Name", "weightG": 100, "confidence": 0.9}]. ' +
  "No markdown, no explanation, just the JSON array.";

/**
 * Analyze a base64-encoded image and return detected food items.
 * Never throws — returns [] on any error for graceful degradation.
 */
export async function analyzeImage(
  imageBase64: string,
  mimeType: string = "image/jpeg"
): Promise<ParsedFood[]> {
  const provider = process.env.VISION_PROVIDER ?? "ollama";

  try {
    switch (provider) {
      case "openai":
        return await analyzeWithOpenAI(imageBase64, mimeType);
      case "gemini":
        return await analyzeWithGemini(imageBase64, mimeType);
      case "ollama":
      default:
        return await analyzeWithOllama(imageBase64, mimeType);
    }
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.warn("[vision-service] analyzeImage failed:", e?.message);
    return [];
  }
}

// ── Ollama provider ──────────────────────────────────────────────────────────

async function analyzeWithOllama(
  imageBase64: string,
  _mimeType: string
): Promise<ParsedFood[]> {
  const ollamaUrl = process.env.OLLAMA_URL ?? "http://localhost:11434";
  const model = process.env.OLLAMA_VISION_MODEL ?? "llava";

  const res = await fetch(`${ollamaUrl}/api/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      prompt: FOOD_RECOGNITION_PROMPT,
      images: [imageBase64],
      stream: false,
    }),
  });

  if (!res.ok) return [];

  const data = await res.json() as { response?: string };
  return parseProviderResponse(data.response ?? "");
}

// ── OpenAI provider ──────────────────────────────────────────────────────────

async function analyzeWithOpenAI(
  imageBase64: string,
  mimeType: string
): Promise<ParsedFood[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[vision-service] OPENAI_API_KEY not set");
    return [];
  }

  const model = process.env.OPENAI_VISION_MODEL ?? "gpt-4o-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: FOOD_RECOGNITION_PROMPT },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${imageBase64}` },
            },
          ],
        },
      ],
      max_tokens: 1000,
    }),
  });

  if (!res.ok) return [];

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content ?? "";
  return parseProviderResponse(text);
}

// ── Gemini provider ──────────────────────────────────────────────────────────

async function analyzeWithGemini(
  imageBase64: string,
  mimeType: string
): Promise<ParsedFood[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[vision-service] GEMINI_API_KEY not set");
    return [];
  }

  const model = process.env.GEMINI_VISION_MODEL ?? "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: FOOD_RECOGNITION_PROMPT },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageBase64,
              },
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) return [];

  const data = await res.json() as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
    }>;
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return parseProviderResponse(text);
}

// ── Response parsing ─────────────────────────────────────────────────────────

/**
 * Extract JSON array from provider response text.
 * Handles markdown code blocks, trailing text, etc.
 */
function parseProviderResponse(text: string): ParsedFood[] {
  if (!text) return [];

  // Strip markdown code blocks
  const cleaned = text
    .replace(/```json\n?/gi, "")
    .replace(/```\n?/g, "")
    .trim();

  // Find JSON array in the response
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return [];

  try {
    const parsed = JSON.parse(arrayMatch[0]) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is { name: unknown; weightG: unknown; confidence: unknown } =>
          typeof item === "object" && item !== null
      )
      .map((item) => ({
        name: String(item.name ?? "Unknown"),
        weightG: Number(item.weightG ?? 0),
        confidence: Number(item.confidence ?? 0.5),
      }))
      .filter((item) => item.name !== "Unknown" && item.weightG > 0);
  } catch {
    return [];
  }
}
