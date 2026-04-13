import type { GeneratedContentInput } from "@/types/contracts";
import { hasAnthropic } from "@/lib/env";

export interface ContentGenerationContext {
  projectContext: string;
  updateData: string;
  campaignContext: string;
  requestedOutputs: string[];
}

export interface ContentProvider {
  generateContent(context: ContentGenerationContext): Promise<GeneratedContentInput>;
}

export class AnthropicContentProvider implements ContentProvider {
  async generateContent(context: ContentGenerationContext): Promise<GeneratedContentInput> {
    if (hasAnthropic) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200,
          system:
            "You are the Astral Foundation content engine. Return only valid JSON with emotionalHook, instagramCaptionShort, instagramCaptionLong, reelScript, carouselBreakdown, telegramUpdate, whatsappDigest, csrSummary.",
          messages: [
            {
              role: "user",
              content: `PROJECT CONTEXT:\n${context.projectContext}\n\nUPDATE DATA:\n${context.updateData}\n\nCAMPAIGN CONTEXT:\n${context.campaignContext}\n\nREQUESTED OUTPUTS:\n${context.requestedOutputs.join(", ")}`
            }
          ]
        })
      });

      if (response.ok) {
        const payload = await response.json();
        const text = payload.content?.[0]?.text;
        if (text) {
          return JSON.parse(text) as GeneratedContentInput;
        }
      }
    }

    const fallback = {
      emotionalHook: "Impact story pending live AI generation.",
      instagramCaptionShort: `Short caption placeholder for ${context.requestedOutputs.join(", ")}.`,
      instagramCaptionLong: "Long caption placeholder generated through the provider abstraction.",
      reelScript: "Reel script placeholder.",
      carouselBreakdown: ["Slide 1", "Slide 2", "Slide 3"],
      telegramUpdate: "Telegram update placeholder.",
      whatsappDigest: "WhatsApp digest placeholder.",
      csrSummary: "CSR summary placeholder."
    };

    return fallback;
  }
}
