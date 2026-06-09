import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

// Initialize the Gemini SDK if key is provided
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
  console.log("[GeminiService] Initialized with API key.");
} else {
  console.warn("[GeminiService] No GEMINI_API_KEY found. Running in mockup mode.");
}

export class GeminiService {
  /**
   * Generates embedding for text content.
   */
  static async getEmbedding(text: string): Promise<number[]> {
    if (!ai) {
      // Return a mock vector of 768 dimensions (or 1536) filled with random numbers
      return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
    }

    try {
      const response = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: text,
      });

      if (response.embeddings && response.embeddings.length > 0 && response.embeddings[0].values) {
        return response.embeddings[0].values as number[];
      } else if ((response as any).embedding && (response as any).embedding.values) {
        return (response as any).embedding.values;
      }
      throw new Error("Invalid embedding response format");
    } catch (error) {
      console.error("[GeminiService] Error generating embedding:", error);
      return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
    }
  }

  /**
   * 1. Market Research Tool
   */
  static async marketResearch(product: string, audience: string, industry: string) {
    if (!ai) {
      return this.getMockMarketResearch(product, audience, industry);
    }

    const prompt = `Conduct in-depth market research for a product/service in the '${industry}' industry.
Product: ${product}
Target Audience: ${audience}

Provide a structured analysis focusing on:
1. Pain points (the target audience's core problems, struggles, or frustrations)
2. Desires (what they deeply want, aspirationally or functionally)
3. Fears (what they want to avoid, their anxieties, or worst-case scenarios)
4. Objections (why they would say 'no' to buying this product)
5. Buying triggers (what events, emotions, or logic will compel them to take action now)`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              pain_points: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "List of core customer pain points",
              },
              desires: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "List of customer desires and aspirations",
              },
              fears: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "List of customer fears and anxieties",
              },
              objections: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "List of purchase objections and friction points",
              },
              buying_triggers: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "List of events or emotions that trigger a purchase",
              },
            },
            required: ["pain_points", "desires", "fears", "objections", "buying_triggers"],
          },
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("[GeminiService] Error in marketResearch:", error);
      return this.getMockMarketResearch(product, audience, industry);
    }
  }

  /**
   * 2. Competitor Analysis Tool
   */
  static async competitorAnalysis(urls: string[]) {
    if (!ai) {
      return this.getMockCompetitorAnalysis(urls);
    }

    // Try fetching URLs content to feed to Gemini
    let fetchedContext = "";
    for (const url of urls) {
      try {
        console.log(`[GeminiService] Attempting to fetch content from ${url}`);
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          const text = await res.text();
          // Extract text contents, strip HTML tags roughly, and grab first 2000 chars
          const cleanText = text.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().substring(0, 2000);
          fetchedContext += `Website Source: ${url}\nContent Snippet: ${cleanText}\n\n`;
        }
      } catch (err) {
        console.warn(`[GeminiService] Could not fetch ${url} directly:`, (err as Error).message);
      }
    }

    const prompt = `Analyze the competitor websites listed below.
Competitor URLs: ${urls.join(", ")}
${fetchedContext ? `Website Data Gathered:\n${fetchedContext}\n` : ""}
Provide a comprehensive marketing analysis of these competitors:
1. Positioning (How they present themselves, their unique angle or category)
2. Offers (What products/services are they selling, prices, guarantees, bonuses)
3. Messaging (Key themes, slogans, tone of voice, main benefits highlighted)
4. Strengths (What they are doing exceptionally well)
5. Weaknesses (Where they are falling short, gaps, poor user experience)`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              positioning: { type: "STRING", description: "Strategic market positioning summary" },
              offers: { type: "ARRAY", items: { type: "STRING" }, description: "Competitor offers and pricing structures" },
              messaging: { type: "ARRAY", items: { type: "STRING" }, description: "Core messaging themes and copy angles" },
              strengths: { type: "ARRAY", items: { type: "STRING" }, description: "Key competitor strengths" },
              weaknesses: { type: "ARRAY", items: { type: "STRING" }, description: "Competitor weaknesses and gaps to exploit" },
            },
            required: ["positioning", "offers", "messaging", "strengths", "weaknesses"],
          },
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("[GeminiService] Error in competitorAnalysis:", error);
      return this.getMockCompetitorAnalysis(urls);
    }
  }

  /**
   * 3. Generate Hooks Tool (100 Hooks: 20 per category)
   */
  static async generateHooks(product: string, audience: string, goal: string) {
    if (!ai) {
      return this.getMockHooks(product, audience, goal);
    }

    const prompt = `Generate exactly 100 high-converting marketing hooks (headline or first line of an ad) for this product/service.
Product: ${product}
Target Audience: ${audience}
Goal: ${goal}

Generate exactly 20 hooks for each of the following 5 categories:
1. curiosity (hooks that provoke questions, make readers want to know more, open loops)
2. pain (hooks that immediately highlight a problem or pain point they experience)
3. authority (hooks leveraging statistics, case studies, expertise, credentials, or expert proof)
4. contrarian (hooks that challenge conventional wisdom, state something shocking, or go against the grain)
5. urgency (hooks creating FOMO, time limits, or highlighting the cost of delaying action)

You must return exactly 20 hooks per category, totaling 100 hooks.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              curiosity: { type: "ARRAY", items: { type: "STRING" }, description: "20 curiosity-based hooks" },
              pain: { type: "ARRAY", items: { type: "STRING" }, description: "20 pain-point-based hooks" },
              authority: { type: "ARRAY", items: { type: "STRING" }, description: "20 authority/credibility hooks" },
              contrarian: { type: "ARRAY", items: { type: "STRING" }, description: "20 contrarian/counter-intuitive hooks" },
              urgency: { type: "ARRAY", items: { type: "STRING" }, description: "20 urgency/scarcity hooks" },
            },
            required: ["curiosity", "pain", "authority", "contrarian", "urgency"],
          },
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("[GeminiService] Error in generateHooks:", error);
      return this.getMockHooks(product, audience, goal);
    }
  }

  /**
   * 4. Generate Angles Tool (50 Angles)
   */
  static async generateAngles(product: string, audience: string) {
    if (!ai) {
      return this.getMockAngles(product, audience);
    }

    const prompt = `Generate exactly 50 distinct, high-converting marketing angles (perspectives, unique selling propositions, copy themes, or framing strategies) to sell this product to the target audience.
Product: ${product}
Target Audience: ${audience}

Make sure each angle has a clear, catchy name and a brief description of how it frames the product.
Total: 50 angles.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              angles: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    name: { type: "STRING", description: "Name of the marketing angle (e.g. 'The Sleep-Deprived Parent')" },
                    angle: { type: "STRING", description: "Brief description of the angle and copy focus" },
                  },
                  required: ["name", "angle"],
                },
                description: "Exactly 50 unique marketing angles",
              },
            },
            required: ["angles"],
          },
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("[GeminiService] Error in generateAngles:", error);
      return this.getMockAngles(product, audience);
    }
  }

  /**
   * 5. Generate Creative Concepts Tool (20 Concepts)
   */
  static async generateCreativeConcepts(product: string, audience: string, competitors: string[]) {
    if (!ai) {
      return this.getMockCreativeConcepts(product, audience, competitors);
    }

    const prompt = `Generate exactly 20 distinct ad creative concepts for marketing this product.
Product: ${product}
Target Audience: ${audience}
${competitors.length > 0 ? `Competitors to counter-position against: ${competitors.join(", ")}` : ""}

For each creative concept, provide:
1. Hook (the visual/audio hook to capture attention in the first 3 seconds)
2. Angle (the core psychological angle or theme being used)
3. Creative Brief (description of the visual sequence, video actions, copy overlay, or graphic representation)
4. CTA (Call To Action - what the user should do next)

Total: 20 concepts.`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              concepts: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    hook: { type: "STRING", description: "The attention-grabbing hook" },
                    angle: { type: "STRING", description: "The strategic angle" },
                    creative_brief: { type: "STRING", description: "Visual and execution brief for creators/designers" },
                    cta: { type: "STRING", description: "The call to action" },
                  },
                  required: ["hook", "angle", "creative_brief", "cta"],
                },
                description: "Exactly 20 creative ad concepts",
              },
            },
            required: ["concepts"],
          },
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("[GeminiService] Error in generateCreativeConcepts:", error);
      return this.getMockCreativeConcepts(product, audience, competitors);
    }
  }

  /**
   * 6. Generate UGC Scripts Tool (10 Scripts)
   */
  static async generateUgcScripts(product: string, audience: string) {
    if (!ai) {
      return this.getMockUgcScripts(product, audience);
    }

    const prompt = `Generate exactly 10 short, high-converting User Generated Content (UGC) video scripts (ideal for TikTok, Reels, or Shorts, 30-60 seconds long).
Product: ${product}
Target Audience: ${audience}

For each of the 10 scripts, provide:
1. Title/Name
2. Visual Hook (first 3 seconds visual action)
3. Script body (with speaker lines and visual cues/text overlay directions)
4. CTA (Call to action)`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              scripts: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    title: { type: "STRING", description: "Title of the UGC script" },
                    visual_hook: { type: "STRING", description: "Visual hook to stop the scroll" },
                    script_body: { type: "STRING", description: "The full spoken dialogue with [VISUAL ACTIONS] and [TEXT ON SCREEN] bracketed" },
                    cta: { type: "STRING", description: "Call to Action at the end" },
                  },
                  required: ["title", "visual_hook", "script_body", "cta"],
                },
                description: "Exactly 10 UGC video scripts",
              },
            },
            required: ["scripts"],
          },
        },
      });

      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("[GeminiService] Error in generateUgcScripts:", error);
      return this.getMockUgcScripts(product, audience);
    }
  }

  // --- MOCK FALLBACK DATA GENERATION ---

  private static getMockMarketResearch(product: string, audience: string, industry: string) {
    return {
      pain_points: [
        `High cost and low efficiency in current ${industry} solutions.`,
        `Friction and complex onboarding for target audience: ${audience}.`,
        `Lack of transparency and difficulty tracking results for ${product}.`
      ],
      desires: [
        `Achieve seamless workflow automation and measurable growth.`,
        `Saves time and reduces stress, allowing focus on core creative tasks.`,
        `Affordable scaling without hiring expensive full-time agencies.`
      ],
      fears: [
        `Wasting marketing budget on ineffective campaigns.`,
        `Falling behind competitors who adopt AI and advanced analytics.`,
        `Technical lock-in or complex systems that require intensive training.`
      ],
      objections: [
        `Is ${product} really as easy to use as advertised?`,
        `How is this different from competitor solutions in ${industry}?`,
        `Is there a contracts commitment or can I cancel anytime?`
      ],
      buying_triggers: [
        `Preparing for a major product launch or seasonal marketing campaign.`,
        `A recent drop in organic conversion rate or rise in customer acquisition cost.`,
        `Getting a recommendation from an industry expert or reading a case study.`
      ]
    };
  }

  private static getMockCompetitorAnalysis(urls: string[]) {
    return {
      positioning: `Premium, enterprise-grade tools focused on standard automation and integration, targeting corporate buyers.`,
      offers: [
        `Monthly subscriptions starting at $299/mo.`,
        `14-day free trial requiring credit card details.`,
        `Custom enterprise packages with dedicated support agents.`
      ],
      messaging: [
        `'Scale your team without scaling your workload.'`,
        `Focusing heavily on security, ISO-compliance, and data integrity.`,
        `Aspirational growth messaging but lacking quick-launch templates.`
      ],
      strengths: [
        `Strong established brand trust and deep integrations ecosystem.`,
        `Comprehensive dashboard reporting and custom analytics builder.`
      ],
      weaknesses: [
        `Slow UI interface and extremely high cost for small-to-mid agencies.`,
        `Steep learning curve and poor mobile responsive design.`,
        `No automated generative copywriting templates.`
      ]
    };
  }

  private static getMockHooks(product: string, audience: string, goal: string) {
    const categories = ["curiosity", "pain", "authority", "contrarian", "urgency"];
    const result: Record<string, string[]> = {};
    for (const cat of categories) {
      result[cat] = Array.from({ length: 20 }, (_, idx) => 
        `Mock Hook [${cat.toUpperCase()} #${idx + 1}] designed for ${audience} interested in ${product} to achieve ${goal}.`
      );
    }
    return result;
  }

  private static getMockAngles(product: string, audience: string) {
    return {
      angles: Array.from({ length: 50 }, (_, idx) => ({
        name: `Mock Angle #${idx + 1}`,
        angle: `Unique framing strategy focusing on benefit #${idx + 1} for ${audience} using ${product}.`
      }))
    };
  }

  private static getMockCreativeConcepts(product: string, audience: string, competitors: string[]) {
    return {
      concepts: Array.from({ length: 20 }, (_, idx) => ({
        hook: `Stop doing things the hard way - see how this works! (Concept #${idx + 1})`,
        angle: `Framing the product as the ultimate time saver for ${audience}.`,
        creative_brief: `Open with split-screen showing a stressed person typing on the left, and a relaxed person drinking coffee on the right. Overlay text: 'Before vs After using ${product}'.`,
        cta: `Click 'Sign Up' to start saving hours today!`
      }))
    };
  }

  private static getMockUgcScripts(product: string, audience: string) {
    return {
      scripts: Array.from({ length: 10 }, (_, idx) => ({
        title: `Mock UGC Script #${idx + 1}`,
        visual_hook: `Creator looking directly at the camera, holding up their phone, gasping slightly.`,
        script_body: `[CREATOR]: "I literally never make videos like this, but if you're a ${audience}, you need to hear this. I started using ${product} last week, and my mind is blown. Look at [POINTS TO SCREEN OVERLAY OF RESULTS]. It's so fast. Seriously, just try it."`,
        cta: `Swipe up to try it for free!`
      }))
    };
  }
}
