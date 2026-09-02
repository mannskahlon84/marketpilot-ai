import { AIProviderRouter } from "@/services/aiProviderRouter";

export type AdLanguage = "en" | "ar" | "bilingual";

export interface AdCopyRequest {
  brandName: string;
  industry: string;
  /** Whatever the client typed in the prompt box — rough notes are fine. */
  clientPrompt?: string;
  features?: string[];
  offer?: string;
  price?: string;
  contact?: string;
  language?: AdLanguage;
}

export interface AdCopyStage {
  /** Spoken voiceover line for this scene. */
  voiceText: string;
  /** Short on-screen title, kept tight enough to fit a 1080px frame. */
  textOverlay: string;
}

export interface AdCopy {
  stages: [AdCopyStage, AdCopyStage, AdCopyStage, AdCopyStage];
  caption: string;
  hashtags: string[];
  /** Which layer produced this copy — useful for debugging and for the UI. */
  source: "gemini" | "fallback";
}

const COPY_SCHEMA = {
  type: "object",
  properties: {
    stages: {
      type: "array",
      minItems: 4,
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          voiceText: { type: "string" },
          textOverlay: { type: "string" },
        },
        required: ["voiceText", "textOverlay"],
      },
    },
    caption: { type: "string" },
    hashtags: { type: "array", items: { type: "string" } },
  },
  required: ["stages", "caption", "hashtags"],
};

export class CopyWriter {
  /**
   * Turns the client's rough input into a four-stage ad script
   * (Hook -> Feature -> Benefit -> CTA).
   *
   * Falls back to deterministic copy built from the client's own words whenever
   * Gemini is unconfigured, slow, or returns something unusable — video
   * generation must never fail because the copy layer did.
   */
  public static async writeAdCopy(request: AdCopyRequest): Promise<AdCopy> {
    const ai = await this.tryGemini(request);
    return ai || this.fallbackCopy(request);
  }

  private static async tryGemini(request: AdCopyRequest): Promise<AdCopy | null> {
    if (!AIProviderRouter.isConfigured()) return null;

    const language = request.language || "en";
    const languageRule =
      language === "ar"
        ? "Write ALL copy in Modern Standard Arabic."
        : language === "bilingual"
        ? "Write voiceText in Arabic and textOverlay in English."
        : "Write all copy in English.";

    const prompt = [
      `Write the script for a 15-second vertical social media advert.`,
      ``,
      `Brand or product: ${request.brandName}`,
      `Industry: ${request.industry}`,
      request.clientPrompt ? `What the client wants to say: ${request.clientPrompt}` : "",
      request.features?.length ? `Key features: ${request.features.join("; ")}` : "",
      request.offer ? `Offer: ${request.offer}` : "",
      request.price ? `Price to mention: ${request.price}` : "",
      request.contact ? `Contact details to mention in the final line: ${request.contact}` : "",
      ``,
      `Return exactly four stages in this order: hook, feature, benefit, call to action.`,
      `Rules:`,
      `- ${languageRule}`,
      `- voiceText is spoken aloud: 12 to 18 words, natural and human, no emoji, no hashtags.`,
      `- textOverlay appears on screen: at most 4 words, no ending punctuation.`,
      `- Never invent specifications, materials, ports, warranties or claims that were not given above.`,
      `- The final stage must include the contact or price if one was supplied.`,
      `- caption is one or two sentences for the social post.`,
      `- hashtags: 4 to 6 items, lowercase, no # symbol.`,
    ]
      .filter(Boolean)
      .join("\n");

    const result = await AIProviderRouter.generateJSON<{
      stages?: { voiceText?: string; textOverlay?: string }[];
      caption?: string;
      hashtags?: string[];
    }>({
      prompt,
      systemInstruction:
        "You are a senior short-form advertising copywriter. You write tight, concrete, " +
        "sellable copy and you never fabricate product claims.",
      temperature: 0.8,
      jsonSchema: COPY_SCHEMA,
    });

    const stages = result?.stages;
    if (!Array.isArray(stages) || stages.length < 4) return null;

    const cleaned = stages.slice(0, 4).map((s) => ({
      voiceText: (s?.voiceText || "").trim(),
      textOverlay: (s?.textOverlay || "").trim(),
    }));
    if (cleaned.some((s) => !s.voiceText || !s.textOverlay)) return null;

    return {
      stages: cleaned as AdCopy["stages"],
      caption: (result?.caption || "").trim() || this.fallbackCaption(request),
      hashtags: this.normaliseHashtags(result?.hashtags, request),
      source: "gemini",
    };
  }

  /**
   * Deterministic copy assembled from what the client actually supplied. Deliberately
   * plain — it should read as generic, never as invented product claims.
   */
  private static fallbackCopy(request: AdCopyRequest): AdCopy {
    const { brandName, features = [], offer, price, contact } = request;
    const firstFeature = features[0];
    const secondFeature = features[1];

    const closing = contact
      ? `Order yours today — call ${contact}.`
      : price
      ? `Available now at ${price}.`
      : `Order yours today.`;

    return {
      stages: [
        {
          voiceText: offer
            ? `${offer} on ${brandName} — for a limited time.`
            : `Meet ${brandName}.`,
          textOverlay: brandName,
        },
        {
          voiceText: firstFeature
            ? `${firstFeature}.`
            : `Built for everyday use.`,
          textOverlay: firstFeature ? this.toOverlay(firstFeature) : "Features",
        },
        {
          voiceText: secondFeature
            ? `${secondFeature}.`
            : `Quality you can rely on.`,
          textOverlay: secondFeature ? this.toOverlay(secondFeature) : "Why It Works",
        },
        {
          voiceText: closing,
          textOverlay: price || "Order Today",
        },
      ],
      caption: this.fallbackCaption(request),
      hashtags: this.normaliseHashtags(undefined, request),
      source: "fallback",
    };
  }

  private static fallbackCaption(request: AdCopyRequest): string {
    const parts = [request.brandName];
    if (request.offer) parts.push(request.offer);
    if (request.price) parts.push(request.price);
    if (request.contact) parts.push(`Contact: ${request.contact}`);
    return parts.join(" — ");
  }

  private static normaliseHashtags(
    tags: string[] | undefined,
    request: AdCopyRequest
  ): string[] {
    const source =
      tags && tags.length
        ? tags
        : [request.brandName, request.industry, "offer", "qatar"];
    return Array.from(
      new Set(
        source
          .map((t) => String(t).replace(/^#/, "").trim().toLowerCase().replace(/\s+/g, ""))
          .filter(Boolean)
      )
    ).slice(0, 6);
  }

  /** Compresses a feature sentence into a few words suitable for an on-screen title. */
  private static toOverlay(feature: string): string {
    return feature.split(/\s+/).slice(0, 4).join(" ").replace(/[.,;:]$/, "");
  }
}
