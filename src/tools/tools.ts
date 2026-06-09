import { z } from "zod";

// Zod schemas for validation
export const CreateClientSchema = z.object({
  name: z.string().min(1, "Client name is required"),
  industry: z.string().min(1, "Client industry/niche is required"),
});

export const MarketResearchSchema = z.object({
  product: z.string().min(1, "Product description is required"),
  audience: z.string().min(1, "Target audience description is required"),
  industry: z.string().min(1, "Industry name is required"),
  client_id: z.string().optional().describe("Optional database Client ID to log this research"),
});

export const CompetitorAnalysisSchema = z.object({
  competitor_urls: z.union([
    z.string().url("Must be a valid URL"),
    z.array(z.string().url("Each item must be a valid URL"))
  ]).transform((val) => (Array.isArray(val) ? val : [val])),
  client_id: z.string().optional().describe("Optional database Client ID to log this research"),
});

export const GenerateHooksSchema = z.object({
  product: z.string().min(1, "Product description is required"),
  audience: z.string().min(1, "Target audience description is required"),
  goal: z.string().min(1, "Goal is required (e.g. lead gen, direct purchase)"),
  client_id: z.string().optional().describe("Optional database Client ID to fetch winning memory and auto-save results"),
});

export const GenerateAnglesSchema = z.object({
  product: z.string().min(1, "Product description is required"),
  audience: z.string().min(1, "Target audience description is required"),
  client_id: z.string().optional().describe("Optional database Client ID to auto-save results"),
});

export const GenerateCreativeConceptsSchema = z.object({
  product: z.string().min(1, "Product description is required"),
  audience: z.string().min(1, "Target audience description is required"),
  competitors: z.union([
    z.string(),
    z.array(z.string())
  ]).optional().transform((val) => {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }),
  client_id: z.string().optional().describe("Optional database Client ID to fetch memory and auto-save concepts"),
});

export const GenerateUgcScriptsSchema = z.object({
  product: z.string().min(1, "Product description is required"),
  audience: z.string().min(1, "Target audience description is required"),
  client_id: z.string().optional().describe("Optional database Client ID to log this session"),
});

export const SaveWinnerSchema = z.object({
  client_id: z.string().min(1, "Client ID is required"),
  type: z.enum(["hook", "ad", "angle", "campaign"]),
  content: z.record(z.any()).or(z.string()),
  score: z.number().int().min(0).max(100).optional().default(10),
});

export const RetrieveWinnersSchema = z.object({
  query: z.string().optional().describe("Query string for vector semantic similarity search"),
  client_id: z.string().optional().describe("Filter winners by a specific Client ID"),
  limit: z.number().int().min(1).max(100).optional().default(10),
});

// Infer TypeScript types from Zod schemas
export type CreateClientInput = z.infer<typeof CreateClientSchema>;
export type MarketResearchInput = z.infer<typeof MarketResearchSchema>;
export type CompetitorAnalysisInput = z.infer<typeof CompetitorAnalysisSchema>;
export type GenerateHooksInput = z.infer<typeof GenerateHooksSchema>;
export type GenerateAnglesInput = z.infer<typeof GenerateAnglesSchema>;
export type GenerateCreativeConceptsInput = z.infer<typeof GenerateCreativeConceptsSchema>;
export type GenerateUgcScriptsInput = z.infer<typeof GenerateUgcScriptsSchema>;
export type SaveWinnerInput = z.infer<typeof SaveWinnerSchema>;
export type RetrieveWinnersInput = z.infer<typeof RetrieveWinnersSchema>;

// Tool definitions for MCP registration
export const TOOLS_DEFINITIONS = [
  {
    name: "create_client",
    description: "Register a new client under the agency's workspace. Subject to plan limitations.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Company/brand name of the client" },
        industry: { type: "string", description: "The industry/niche of the client (e.g. Real Estate, Dentistry)" },
      },
      required: ["name", "industry"],
    },
  },
  {
    name: "market_research",
    description: "Conduct high-quality market research. Generates customer pain points, desires, fears, objections, and buying triggers.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Detailed description of the product or service" },
        audience: { type: "string", description: "Detailed description of the target audience" },
        industry: { type: "string", description: "The industry (e.g. B2B SaaS, Fitness, E-commerce)" },
        client_id: { type: "string", description: "Optional Client ID to log this search in history" },
      },
      required: ["product", "audience", "industry"],
    },
  },
  {
    name: "competitor_analysis",
    description: "Analyze competitor URLs to uncover positioning, offers, messaging strengths, and weaknesses.",
    inputSchema: {
      type: "object",
      properties: {
        competitor_urls: { 
          type: "array", 
          items: { type: "string" }, 
          description: "List of competitor website URLs to analyze" 
        },
        client_id: { type: "string", description: "Optional Client ID to link to competitor research" },
      },
      required: ["competitor_urls"],
    },
  },
  {
    name: "generate_hooks",
    description: "Generate 100 categorized high-converting marketing hooks, leverages historical agency winners if client_id is set.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product/service name and features" },
        audience: { type: "string", description: "Target audience details" },
        goal: { type: "string", description: "The marketing goal (e.g. increase conversions, drive engagement)" },
        client_id: { type: "string", description: "Optional Client ID to extract historical vector memory and auto-save the generated hooks" },
      },
      required: ["product", "audience", "goal"],
    },
  },
  {
    name: "generate_angles",
    description: "Generate 50 distinct high-converting marketing angles (perspectives or copy themes) for a product.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product/service details" },
        audience: { type: "string", description: "Target audience details" },
        client_id: { type: "string", description: "Optional Client ID to auto-save results to history" },
      },
      required: ["product", "audience"],
    },
  },
  {
    name: "generate_creative_concepts",
    description: "Generate 20 distinct ad creative concepts (hooks, angles, briefs, CTAs). Leverages agency memory if client_id is set.",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product/service details" },
        audience: { type: "string", description: "Target audience details" },
        competitors: { 
          type: "array", 
          items: { type: "string" }, 
          description: "Optional list of competitor names or URLs" 
        },
        client_id: { type: "string", description: "Optional Client ID to load memories and auto-save concepts" },
      },
      required: ["product", "audience"],
    },
  },
  {
    name: "generate_ugc_scripts",
    description: "Generate 10 structured User Generated Content (UGC) video scripts (hook, script body, CTA, visual cues).",
    inputSchema: {
      type: "object",
      properties: {
        product: { type: "string", description: "Product/service details" },
        audience: { type: "string", description: "Target audience details" },
        client_id: { type: "string", description: "Optional Client ID to track this session" },
      },
      required: ["product", "audience"],
    },
  },
  {
    name: "save_winner",
    description: "Store high-performing marketing assets (hooks, ads, angles, campaigns) in Supabase vector memory for future reuse.",
    inputSchema: {
      type: "object",
      properties: {
        client_id: { type: "string", description: "The Client ID this asset belongs to" },
        type: { type: "string", enum: ["hook", "ad", "angle", "campaign"], description: "The type of the asset" },
        content: { type: "object", description: "The core content of the winning asset (JSON format or text)" },
        score: { type: "number", description: "Performance score/rating from 0 to 100" },
      },
      required: ["client_id", "type", "content"],
    },
  },
  {
    name: "retrieve_winners",
    description: "Retrieve similar high-performing campaigns using semantic vector search and Client ID filtering.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Query string to search semantically in the vector space" },
        client_id: { type: "string", description: "Optional Client ID to filter results" },
        limit: { type: "number", description: "Maximum number of winners to retrieve" },
      },
    },
  },
];
