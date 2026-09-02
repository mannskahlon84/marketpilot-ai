/**
 * MarketPilot AI — AI Provider Router
 * Routes text generation to Google Gemini when a key is configured, and falls back
 * to a deterministic mock so the render pipeline never fails because of the AI layer.
 *
 * Auth note: Google now issues "AQ." prefixed keys from AI Studio, which do NOT work
 * reliably with the legacy `?key=` query parameter (they return "Multiple
 * authentication credentials received"). We always send the key as an
 * `x-goog-api-key` header, which works for both the old AIza and new AQ formats.
 */

const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const REQUEST_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS || 20000);

export interface AITextRequest {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  provider?: "gemini" | "openai" | "mock";
  /** When set, asks the model for JSON matching this shape and parses the result. */
  jsonSchema?: Record<string, unknown>;
}

export interface AITextResponse {
  text: string;
  providerUsed: string;
  timestamp: string;
}

export class AIProviderRouter {
  /** True when a Gemini key is present in the environment. */
  public static isConfigured(): boolean {
    return Boolean(process.env.GEMINI_API_KEY);
  }

  public static async generateText(
    request: AITextRequest
  ): Promise<AITextResponse> {
    const apiKey = process.env.GEMINI_API_KEY;
    const provider = request.provider || (apiKey ? "gemini" : "mock");

    if (provider === "gemini" && apiKey) {
      try {
        const text = await this.callGemini(request, apiKey);
        if (text && text.trim()) {
          return {
            text,
            providerUsed: `gemini:${DEFAULT_MODEL}`,
            timestamp: new Date().toISOString(),
          };
        }
        console.warn("[AIProviderRouter] Gemini returned empty text; using fallback.");
      } catch (error: any) {
        // Never let an AI failure break video generation — degrade to the mock.
        console.warn(
          `[AIProviderRouter] Gemini call failed (${error?.message || error}); using fallback.`
        );
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 50));
    return {
      text: `Synthesized AI output for prompt: ${request.prompt.slice(0, 100)}...`,
      providerUsed: "mock",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Requests JSON from the model and parses it. Returns null on any failure so
   * callers can fall back to deterministic copy.
   */
  public static async generateJSON<T = unknown>(
    request: AITextRequest
  ): Promise<T | null> {
    if (!this.isConfigured()) return null;

    const response = await this.generateText(request);
    if (response.providerUsed === "mock") return null;

    try {
      return JSON.parse(this.stripCodeFence(response.text)) as T;
    } catch {
      console.warn("[AIProviderRouter] Model did not return parsable JSON.");
      return null;
    }
  }

  private static async callGemini(
    request: AITextRequest,
    apiKey: string
  ): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const generationConfig: Record<string, unknown> = {
      temperature: request.temperature ?? 0.7,
    };
    if (request.jsonSchema) {
      generationConfig.responseMimeType = "application/json";
      generationConfig.responseSchema = request.jsonSchema;
    }

    try {
      const res = await fetch(
        `${GEMINI_ENDPOINT}/${DEFAULT_MODEL}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: request.prompt }] }],
            ...(request.systemInstruction
              ? {
                  systemInstruction: {
                    parts: [{ text: request.systemInstruction }],
                  },
                }
              : {}),
            generationConfig,
          }),
          signal: controller.signal,
        }
      );

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${detail.slice(0, 200)}`);
      }

      const data: any = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts;
      if (!Array.isArray(parts)) return "";
      return parts
        .map((p: any) => p?.text || "")
        .join("")
        .trim();
    } finally {
      clearTimeout(timer);
    }
  }

  /** Models sometimes wrap JSON in ```json fences despite responseMimeType. */
  private static stripCodeFence(text: string): string {
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    return (fenced ? fenced[1] : text).trim();
  }
}

export const aiProviderRouter = AIProviderRouter;
