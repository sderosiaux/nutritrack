// @vitest-environment node
/**
 * CHK-029: Vision providers (Ollama/OpenAI/Gemini)
 * Tests: analyzeImage() with all three providers + graceful fallbacks
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock fetch globally for provider HTTP calls
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

vi.mock("@/server/db", () => ({ db: {} }));

import { analyzeImage } from "@/server/services/vision-service";

describe("CHK-029 — Vision service: Ollama provider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      VISION_PROVIDER: "ollama",
      OLLAMA_URL: "http://ollama:11434",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns parsed food items from Ollama response", async () => {
    const mockResponse = {
      response: JSON.stringify([
        { name: "Grilled Chicken", weightG: 200, confidence: 0.92 },
        { name: "Brown Rice", weightG: 150, confidence: 0.88 },
      ]),
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await analyzeImage(Buffer.from("fake").toString("base64"), "image/jpeg");
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Grilled Chicken");
    expect(result[0].weightG).toBe(200);
    expect(result[0].confidence).toBe(0.92);
  });

  it("returns empty array when Ollama JSON parse fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ response: "I see some food on the plate." }),
    });

    const result = await analyzeImage(Buffer.from("fake").toString("base64"), "image/jpeg");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("returns empty array when Ollama request fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Connection refused"));

    const result = await analyzeImage(Buffer.from("fake").toString("base64"), "image/jpeg");
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("handles partial JSON in Ollama response (wrapped in markdown)", async () => {
    const mockResponse = {
      response: '```json\n[{"name":"Apple","weightG":150,"confidence":0.9}]\n```',
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await analyzeImage(Buffer.from("fake").toString("base64"), "image/jpeg");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Apple");
  });
});

describe("CHK-029 — Vision service: OpenAI provider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      VISION_PROVIDER: "openai",
      OPENAI_API_KEY: "sk-test-key-123",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns parsed food items from OpenAI response", async () => {
    const mockResponse = {
      choices: [{
        message: {
          content: JSON.stringify([
            { name: "Salad", weightG: 180, confidence: 0.85 },
          ]),
        },
      }],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await analyzeImage(Buffer.from("fake").toString("base64"), "image/jpeg");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Salad");
  });

  it("returns empty array when OPENAI_API_KEY missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const result = await analyzeImage(Buffer.from("fake").toString("base64"), "image/jpeg");
    expect(result).toHaveLength(0);
  });

  it("returns empty array when OpenAI returns error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: "rate_limit_exceeded" }),
    });

    const result = await analyzeImage(Buffer.from("fake").toString("base64"), "image/jpeg");
    expect(result).toHaveLength(0);
  });
});

describe("CHK-029 — Vision service: Gemini provider", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = {
      ...originalEnv,
      VISION_PROVIDER: "gemini",
      GEMINI_API_KEY: "gemini-test-key",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns parsed food items from Gemini response", async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{
            text: JSON.stringify([
              { name: "Pasta", weightG: 300, confidence: 0.9 },
            ]),
          }],
        },
      }],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    });

    const result = await analyzeImage(Buffer.from("fake").toString("base64"), "image/jpeg");
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Pasta");
  });

  it("returns empty array when GEMINI_API_KEY missing", async () => {
    delete process.env.GEMINI_API_KEY;
    const result = await analyzeImage(Buffer.from("fake").toString("base64"), "image/jpeg");
    expect(result).toHaveLength(0);
  });
});

describe("CHK-029 — Vision service: fallback behavior", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("defaults to ollama when VISION_PROVIDER not set", async () => {
    delete process.env.VISION_PROVIDER;
    process.env.OLLAMA_URL = "http://ollama:11434";

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        response: JSON.stringify([{ name: "Toast", weightG: 50, confidence: 0.8 }]),
      }),
    });

    const result = await analyzeImage(Buffer.from("fake").toString("base64"), "image/jpeg");
    expect(result).toHaveLength(1);
    // Confirm Ollama endpoint was called
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("ollama"),
      expect.any(Object)
    );
  });

  it("always returns ParsedFood[] shape", async () => {
    process.env.VISION_PROVIDER = "ollama";
    mockFetch.mockRejectedValueOnce(new Error("unreachable"));

    const result = await analyzeImage(Buffer.from("fake").toString("base64"), "image/png");
    expect(Array.isArray(result)).toBe(true);
  });
});
