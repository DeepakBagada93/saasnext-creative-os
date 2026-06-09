#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { AsyncLocalStorage } from "async_hooks";
import { GeminiService } from "./services/gemini.service.js";
import { SupabaseService, Workspace } from "./services/supabase.service.js";
import {
  CreateClientSchema,
  MarketResearchSchema,
  CompetitorAnalysisSchema,
  GenerateHooksSchema,
  GenerateAnglesSchema,
  GenerateCreativeConceptsSchema,
  GenerateUgcScriptsSchema,
  SaveWinnerSchema,
  RetrieveWinnersSchema,
} from "./tools/tools.js";

// AsyncLocalStorage to maintain multitenant workspace context on requests
export const workspaceStorage = new AsyncLocalStorage<Workspace>();

// Initialize the MCP server
const server = new McpServer({
  name: "creativeos-mcp",
  version: "2.0.0",
});

// Helper to resolve the active workspace context
let globalWorkspace: Workspace | null = null;
function getActiveWorkspace(): Workspace {
  const store = workspaceStorage.getStore();
  if (store) return store;
  if (globalWorkspace) return globalWorkspace;
  throw new Error("Unauthorized: No active workspace context found. Verify your API Key configuration.");
}

// Helper to format success output for MCP
function formatSuccess(data: any) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

// Helper to format error output for MCP
function formatError(error: any) {
  console.error("[MCP Server Error]:", error);
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      },
    ],
  };
}

// Register Tool: create_client
server.tool(
  "create_client",
  "Register a new client under the agency workspace. Subject to plan limitations.",
  CreateClientSchema.shape,
  async (args) => {
    try {
      const workspace = getActiveWorkspace();
      const client = await SupabaseService.createClient(workspace, args.name, args.industry);
      return formatSuccess({
        message: `Client '${args.name}' registered successfully under workspace '${workspace.name}'.`,
        client
      });
    } catch (err) {
      return formatError(err);
    }
  }
);

// Register Tool: market_research
server.tool(
  "market_research",
  "Conduct high-quality market research. Generates customer pain points, desires, fears, objections, and buying triggers.",
  MarketResearchSchema.shape,
  async (args) => {
    try {
      const workspace = getActiveWorkspace();
      
      // Proactive Memory Search: If client_id is provided, look up winning campaigns to guide research
      let winningCampaignsContext = "";
      if (args.client_id) {
        const winners = await SupabaseService.retrieveWinners(workspace, undefined, args.client_id, 3);
        if (winners && winners.length > 0) {
          winningCampaignsContext = `\nUse these historical winning campaigns/themes for this client to inform the style, voice, and triggers: ${JSON.stringify(winners)}`;
        }
      }

      const enhancedProduct = args.product + winningCampaignsContext;
      const result = await GeminiService.marketResearch(enhancedProduct, args.audience, args.industry);
      
      return formatSuccess(result);
    } catch (err) {
      return formatError(err);
    }
  }
);

// Register Tool: competitor_analysis
server.tool(
  "competitor_analysis",
  "Analyze competitor URLs to uncover positioning, offers, messaging strengths, and weaknesses.",
  CompetitorAnalysisSchema.shape,
  async (args) => {
    try {
      const result = await GeminiService.competitorAnalysis(args.competitor_urls);
      return formatSuccess(result);
    } catch (err) {
      return formatError(err);
    }
  }
);

// Register Tool: generate_hooks
server.tool(
  "generate_hooks",
  "Generate 100 categorized high-converting marketing hooks (curiosity, pain, authority, contrarian, urgency). Auto-saves to memory if client_id is set.",
  GenerateHooksSchema.shape,
  async (args) => {
    try {
      const workspace = getActiveWorkspace();
      
      // Proactive Memory Search: Load client winners
      let memoryContext = "";
      if (args.client_id) {
        const winners = await SupabaseService.retrieveWinners(workspace, undefined, args.client_id, 5);
        if (winners && winners.length > 0) {
          memoryContext = `\nClient historical winners to build upon: ${JSON.stringify(winners)}`;
        }
      }

      const enhancedProduct = args.product + memoryContext;
      const result = await GeminiService.generateHooks(enhancedProduct, args.audience, args.goal);

      // Auto-save generated hooks to Database if client_id is provided
      if (args.client_id) {
        console.error(`[CreativeOS MCP] Auto-saving generated hooks to database for client: ${args.client_id}`);
        const hooksToSave: Array<{ hook: string; category: string }> = [];
        
        const categories = ["curiosity", "pain", "authority", "contrarian", "urgency"] as const;
        for (const cat of categories) {
          if (Array.isArray(result[cat])) {
            result[cat].forEach((h: string) => {
              hooksToSave.push({ hook: h, category: cat });
            });
          }
        }
        
        if (hooksToSave.length > 0) {
          try {
            await SupabaseService.saveHooks(args.client_id, hooksToSave, workspace);
          } catch (saveErr) {
            console.error(`[CreativeOS MCP] Hook autosave failed (limit hit):`, (saveErr as Error).message);
          }
        }
      }

      return formatSuccess(result);
    } catch (err) {
      return formatError(err);
    }
  }
);

// Register Tool: generate_angles
server.tool(
  "generate_angles",
  "Generate 50 distinct high-converting marketing angles (Awareness, Pain, Desire, Offer) for a product. Auto-saves if client_id is set.",
  GenerateAnglesSchema.shape,
  async (args) => {
    try {
      const workspace = getActiveWorkspace();
      
      const result = await GeminiService.generateAngles(args.product, args.audience);

      // Auto-save generated angles to Database if client_id is provided
      if (args.client_id && result.angles && Array.isArray(result.angles)) {
        console.error(`[CreativeOS MCP] Auto-saving generated angles to database for client: ${args.client_id}`);
        const anglesToSave = result.angles.map((a: any) => `${a.name}: ${a.angle}`);
        try {
          await SupabaseService.saveAngles(args.client_id, anglesToSave, workspace);
        } catch (saveErr) {
          console.error(`[CreativeOS MCP] Angle autosave failed (limit hit):`, (saveErr as Error).message);
        }
      }

      return formatSuccess(result);
    } catch (err) {
      return formatError(err);
    }
  }
);

// Register Tool: generate_creative_concepts
server.tool(
  "generate_creative_concepts",
  "Generate 20 distinct ad creative concepts (Meta, Google, LinkedIn Ads). Auto-saves to memory if client_id is set.",
  GenerateCreativeConceptsSchema.shape,
  async (args) => {
    try {
      const workspace = getActiveWorkspace();
      
      // Proactive Memory Search
      let memoryContext = "";
      if (args.client_id) {
        const winners = await SupabaseService.retrieveWinners(workspace, undefined, args.client_id, 3);
        if (winners && winners.length > 0) {
          memoryContext = `\nClient historical winners context to guide angle framing: ${JSON.stringify(winners)}`;
        }
      }

      const enhancedProduct = args.product + memoryContext;
      const result = await GeminiService.generateCreativeConcepts(
        enhancedProduct,
        args.audience,
        args.competitors
      );

      // Auto-save generated concepts to Database if client_id is provided
      if (args.client_id && result.concepts && Array.isArray(result.concepts)) {
        console.error(`[CreativeOS MCP] Auto-saving generated concepts to database for client: ${args.client_id}`);
        try {
          await SupabaseService.saveConcepts(args.client_id, result.concepts, workspace);
        } catch (saveErr) {
          console.error(`[CreativeOS MCP] Concept autosave failed (limit hit):`, (saveErr as Error).message);
        }
      }

      return formatSuccess(result);
    } catch (err) {
      return formatError(err);
    }
  }
);

// Register Tool: generate_ugc_scripts
server.tool(
  "generate_ugc_scripts",
  "Generate 10 structured User Generated Content (UGC) video scripts (Testimonial, Founder Story, Customer Story, etc.).",
  GenerateUgcScriptsSchema.shape,
  async (args) => {
    try {
      const result = await GeminiService.generateUgcScripts(args.product, args.audience);
      return formatSuccess(result);
    } catch (err) {
      return formatError(err);
    }
  }
);

// Register Tool: save_winner
server.tool(
  "save_winner",
  "Store successful marketing assets (hooks, ads, angles, campaigns) in Supabase vector memory for future similarity searches.",
  SaveWinnerSchema.shape,
  async (args) => {
    try {
      const workspace = getActiveWorkspace();
      const result = await SupabaseService.saveWinner(
        args.client_id,
        args.type,
        args.content,
        args.score,
        workspace
      );
      return formatSuccess({
        message: "Winning asset successfully saved to agency memory database.",
        winner: result
      });
    } catch (err) {
      return formatError(err);
    }
  }
);

// Register Tool: retrieve_winners
server.tool(
  "retrieve_winners",
  "Retrieve similar winning campaigns using semantic vector search and Client ID filtering.",
  RetrieveWinnersSchema.shape,
  async (args) => {
    try {
      const workspace = getActiveWorkspace();
      const result = await SupabaseService.retrieveWinners(
        workspace,
        args.query,
        args.client_id,
        args.limit
      );
      return formatSuccess(result);
    } catch (err) {
      return formatError(err);
    }
  }
);

// Express setup for multitenant SSE connection
const app = express();
app.use(cors());
app.use(express.json());

const transports = new Map<string, SSEServerTransport>();
const sessionWorkspaces = new Map<string, Workspace>();

app.get("/sse", async (req, res) => {
  // 1. Authenticate connection API key
  const apiKey = (
    req.headers["x-api-key"] || 
    req.query.apiKey || 
    req.query.api_key || 
    process.env.CREATIVEOS_API_KEY || 
    "cos_live_mockkey12345"
  ) as string;

  try {
    const workspace = await SupabaseService.validateApiKey(apiKey);
    console.error(`[CreativeOS MCP] Connection validated: ${workspace.name} (${workspace.plan.toUpperCase()})`);
    
    const transport = new SSEServerTransport("/messages", res);
    transports.set(transport.sessionId, transport);
    sessionWorkspaces.set(transport.sessionId, workspace);

    res.on("close", () => {
      console.error(`[CreativeOS MCP] SSE connection closed: ${transport.sessionId}`);
      transports.delete(transport.sessionId);
      sessionWorkspaces.delete(transport.sessionId);
    });

    await server.connect(transport);
    console.error(`[CreativeOS MCP] SSE transport connected for session: ${transport.sessionId}`);
  } catch (authErr) {
    console.error(`[CreativeOS MCP] SSE Authentication Failure:`, (authErr as Error).message);
    res.status(401).json({ error: (authErr as Error).message });
  }
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  const workspace = sessionWorkspaces.get(sessionId);

  if (transport && workspace) {
    // Run the request inside AsyncLocalStorage to bind the tenancy context
    await workspaceStorage.run(workspace, async () => {
      await transport.handlePostMessage(req, res);
    });
  } else {
    console.error(`[CreativeOS MCP] No active SSE session found for sessionId: ${sessionId}`);
    res.status(400).send("No active transport session found for the provided sessionId.");
  }
});

// API endpoint to fetch statistics directly for the Next.js frontend
app.get("/api/stats", async (req, res) => {
  const apiKey = (req.headers["x-api-key"] || req.query.apiKey || process.env.CREATIVEOS_API_KEY || "cos_live_mockkey12345") as string;
  try {
    const workspace = await SupabaseService.validateApiKey(apiKey);
    const stats = await SupabaseService.getWorkspaceStats(workspace);
    res.json(stats);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
});

// API endpoint to get list of clients for the frontend
app.get("/api/clients", async (req, res) => {
  const apiKey = (req.headers["x-api-key"] || req.query.apiKey || process.env.CREATIVEOS_API_KEY || "cos_live_mockkey12345") as string;
  try {
    const workspace = await SupabaseService.validateApiKey(apiKey);
    const clientsList = await SupabaseService.getClients(workspace);
    res.json(clientsList);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
});

// API endpoint to create a client for the frontend
app.post("/api/clients", async (req, res) => {
  const apiKey = (req.headers["x-api-key"] || req.query.apiKey || process.env.CREATIVEOS_API_KEY || "cos_live_mockkey12345") as string;
  const { name, industry } = req.body;
  try {
    const workspace = await SupabaseService.validateApiKey(apiKey);
    const client = await SupabaseService.createClient(workspace, name, industry);
    res.json(client);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// API endpoint to search/get winners for the frontend
app.get("/api/winners", async (req, res) => {
  const apiKey = (req.headers["x-api-key"] || req.query.apiKey || process.env.CREATIVEOS_API_KEY || "cos_live_mockkey12345") as string;
  const { query, client_id, limit } = req.query;
  try {
    const workspace = await SupabaseService.validateApiKey(apiKey);
    const winnersList = await SupabaseService.retrieveWinners(
      workspace,
      query ? String(query) : undefined,
      client_id ? String(client_id) : undefined,
      limit ? parseInt(String(limit), 10) : 10
    );
    res.json(winnersList);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// API endpoint to save a winner for the frontend
app.post("/api/winners", async (req, res) => {
  const apiKey = (req.headers["x-api-key"] || req.query.apiKey || process.env.CREATIVEOS_API_KEY || "cos_live_mockkey12345") as string;
  const { client_id, type, content, score } = req.body;
  try {
    const workspace = await SupabaseService.validateApiKey(apiKey);
    const result = await SupabaseService.saveWinner(client_id, type, content, score || 10, workspace);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// API endpoint for hook generation
app.post("/api/generate/hooks", async (req, res) => {
  const apiKey = (req.headers["x-api-key"] || req.query.apiKey || process.env.CREATIVEOS_API_KEY || "cos_live_mockkey12345") as string;
  const { product, audience, goal, client_id } = req.body;
  try {
    const workspace = await SupabaseService.validateApiKey(apiKey);
    
    // Proactive memory lookup
    let memoryContext = "";
    if (client_id) {
      const winners = await SupabaseService.retrieveWinners(workspace, undefined, client_id, 5);
      if (winners && winners.length > 0) {
        memoryContext = `\nClient historical winners to build upon: ${JSON.stringify(winners)}`;
      }
    }

    const result = await GeminiService.generateHooks(product + memoryContext, audience, goal);

    if (client_id) {
      const hooksToSave: Array<{ hook: string; category: string }> = [];
      const categories = ["curiosity", "pain", "authority", "contrarian", "urgency"] as const;
      for (const cat of categories) {
        if (Array.isArray(result[cat])) {
          result[cat].forEach((h: string) => {
            hooksToSave.push({ hook: h, category: cat });
          });
        }
      }
      if (hooksToSave.length > 0) {
        try {
          await SupabaseService.saveHooks(client_id, hooksToSave, workspace);
        } catch (saveErr) {
          console.error("Hook autosave during HTTP generate failed:", (saveErr as Error).message);
        }
      }
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// API endpoint for angle generation
app.post("/api/generate/angles", async (req, res) => {
  const apiKey = (req.headers["x-api-key"] || req.query.apiKey || process.env.CREATIVEOS_API_KEY || "cos_live_mockkey12345") as string;
  const { product, audience, client_id } = req.body;
  try {
    const workspace = await SupabaseService.validateApiKey(apiKey);
    const result = await GeminiService.generateAngles(product, audience);

    if (client_id && result.angles && Array.isArray(result.angles)) {
      const anglesToSave = result.angles.map((a: any) => `${a.name}: ${a.angle}`);
      try {
        await SupabaseService.saveAngles(client_id, anglesToSave, workspace);
      } catch (saveErr) {
        console.error("Angle autosave during HTTP generate failed:", (saveErr as Error).message);
      }
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// API endpoint for creative concepts generation
app.post("/api/generate/concepts", async (req, res) => {
  const apiKey = (req.headers["x-api-key"] || req.query.apiKey || process.env.CREATIVEOS_API_KEY || "cos_live_mockkey12345") as string;
  const { product, audience, competitors, client_id } = req.body;
  try {
    const workspace = await SupabaseService.validateApiKey(apiKey);
    
    let memoryContext = "";
    if (client_id) {
      const winners = await SupabaseService.retrieveWinners(workspace, undefined, client_id, 3);
      if (winners && winners.length > 0) {
        memoryContext = `\nClient historical winners context to guide angle framing: ${JSON.stringify(winners)}`;
      }
    }

    const result = await GeminiService.generateCreativeConcepts(product + memoryContext, audience, competitors || []);

    if (client_id && result.concepts && Array.isArray(result.concepts)) {
      try {
        await SupabaseService.saveConcepts(client_id, result.concepts, workspace);
      } catch (saveErr) {
        console.error("Concept autosave during HTTP generate failed:", (saveErr as Error).message);
      }
    }
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// API endpoint for UGC scripts generation
app.post("/api/generate/ugc", async (req, res) => {
  const apiKey = (req.headers["x-api-key"] || req.query.apiKey || process.env.CREATIVEOS_API_KEY || "cos_live_mockkey12345") as string;
  const { product, audience } = req.body;
  try {
    const workspace = await SupabaseService.validateApiKey(apiKey);
    const result = await GeminiService.generateUgcScripts(product, audience);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Bootstrapping function
async function main() {
  // Validate global API Key for local stdio runs
  const stdioKey = process.env.CREATIVEOS_API_KEY || "cos_live_mockkey12345";
  try {
    globalWorkspace = await SupabaseService.validateApiKey(stdioKey);
    console.error(`[CreativeOS MCP] Local stdio fallback context initialized: '${globalWorkspace.name}' (${globalWorkspace.plan.toUpperCase()})`);
  } catch (err) {
    console.error(`[CreativeOS MCP] Warning during startup key validation:`, (err as Error).message);
  }

  const port = process.env.PORT || (process.env.TRANSPORT === "sse" ? "3000" : null);

  if (port) {
    const numericPort = parseInt(port, 10);
    app.listen(numericPort, "0.0.0.0", () => {
      console.error(`[CreativeOS MCP] SSE & API Server running on port ${numericPort}`);
      console.error(`[CreativeOS MCP] SSE endpoint: http://0.0.0.0:${numericPort}/sse`);
    });
  } else {
    console.error("[CreativeOS MCP] Starting server using Stdio transport...");
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[CreativeOS MCP] Server connected successfully and listening on stdio.");
  }
}

if (!process.env.VERCEL) {
  main().catch((err) => {
    console.error("[CreativeOS MCP] Fatal server startup error:", err);
    process.exit(1);
  });
}

export default app;
