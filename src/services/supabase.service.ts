import { createClient } from "@supabase/supabase-js";
import { GeminiService } from "./gemini.service.js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

let supabase: any = null;
let isSupabaseEnabled = false;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    isSupabaseEnabled = true;
    console.log("[SupabaseService] Initialized client successfully.");
  } catch (error) {
    console.error("[SupabaseService] Failed to initialize Supabase client:", error);
  }
} else {
  console.warn("[SupabaseService] Missing SUPABASE_URL or keys. Running in mockup mode.");
}

// Plan definitions
export type PlanType = "free" | "agency" | "scale";

export interface Workspace {
  id: string;
  name: string;
  plan: PlanType;
  api_key: string;
  created_at: string;
}

export interface Client {
  id: string;
  workspace_id: string;
  name: string;
  industry: string;
  created_at: string;
}

export interface Winner {
  id: string;
  client_id: string;
  content: any;
  score: number;
  embedding?: number[];
  created_at: string;
}

// Fallback mockup in-memory database
const mockWorkspaces: Workspace[] = [
  {
    id: "d3b07384-d113-4ec5-a587-ad2052f53d71",
    name: "Mock Agency Workspace",
    plan: "agency",
    api_key: "cos_live_mockkey12345",
    created_at: new Date().toISOString(),
  },
  {
    id: "f3b07384-d113-4ec5-a587-ad2052f53d72",
    name: "Mock Free Workspace",
    plan: "free",
    api_key: "cos_live_freekey123",
    created_at: new Date().toISOString(),
  }
];

const mockClients: Client[] = [
  {
    id: "client_mock_1",
    workspace_id: "d3b07384-d113-4ec5-a587-ad2052f53d71",
    name: "Smile Dental Clinic",
    industry: "Healthcare",
    created_at: new Date().toISOString(),
  }
];

const mockHooks: any[] = [];
const mockAngles: any[] = [];
const mockConcepts: any[] = [];
const mockWinners: Winner[] = [];

// Enforced limits dictionary
export const PLAN_LIMITS = {
  free: { maxClients: 3, maxAssets: 100 },
  agency: { maxClients: 25, maxAssets: 5000 },
  scale: { maxClients: Infinity, maxAssets: Infinity }
};

// Cosine similarity helper for in-memory semantic search fallback
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export class SupabaseService {
  /**
   * 1. Validates API Key and retrieves workspace
   */
  static async validateApiKey(apiKey: string): Promise<Workspace> {
    if (!apiKey) {
      throw new Error("API key is required. Provide 'CREATIVEOS_API_KEY' or pass in 'x-api-key' header.");
    }

    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("api_key", apiKey)
        .single();

      if (error || !data) {
        throw new Error("Invalid API key. Workspace not found.");
      }
      return data;
    }

    // Fallback mockup validation
    const found = mockWorkspaces.find(w => w.api_key === apiKey);
    if (!found) {
      throw new Error("Invalid API key. Workspace not found (Mockup Mode).");
    }
    return found;
  }

  /**
   * 2. Checks workspace limits
   */
  static async checkLimits(workspace: Workspace, type: "client" | "asset"): Promise<{ allowed: boolean; count: number; max: number }> {
    const limits = PLAN_LIMITS[workspace.plan];
    
    if (type === "client") {
      let clientCount = 0;
      if (isSupabaseEnabled && supabase) {
        const { count, error } = await supabase
          .from("clients")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspace.id);
        
        clientCount = count || 0;
      } else {
        clientCount = mockClients.filter(c => c.workspace_id === workspace.id).length;
      }

      return {
        allowed: clientCount < limits.maxClients,
        count: clientCount,
        max: limits.maxClients
      };
    } else {
      // For assets, we sum: hooks + angles + concepts + winners across all clients of this workspace
      let assetCount = 0;
      
      if (isSupabaseEnabled && supabase) {
        // Fetch list of client IDs
        const { data: clientsList } = await supabase
          .from("clients")
          .select("id")
          .eq("workspace_id", workspace.id);
        
        const clientIds = (clientsList || []).map((c: any) => c.id);
        
        if (clientIds.length > 0) {
          const [hooksRes, anglesRes, conceptsRes, winnersRes] = await Promise.all([
            supabase.from("hooks").select("*", { count: "exact", head: true }).in("client_id", clientIds),
            supabase.from("angles").select("*", { count: "exact", head: true }).in("client_id", clientIds),
            supabase.from("concepts").select("*", { count: "exact", head: true }).in("client_id", clientIds),
            supabase.from("winners").select("*", { count: "exact", head: true }).in("client_id", clientIds),
          ]);
          
          assetCount = (hooksRes.count || 0) + (anglesRes.count || 0) + (conceptsRes.count || 0) + (winnersRes.count || 0);
        }
      } else {
        const clientIds = mockClients.filter(c => c.workspace_id === workspace.id).map(c => c.id);
        const hCount = mockHooks.filter(x => clientIds.includes(x.client_id)).length;
        const aCount = mockAngles.filter(x => clientIds.includes(x.client_id)).length;
        const cCount = mockConcepts.filter(x => clientIds.includes(x.client_id)).length;
        const wCount = mockWinners.filter(x => clientIds.includes(x.client_id)).length;
        assetCount = hCount + aCount + cCount + wCount;
      }

      return {
        allowed: assetCount < limits.maxAssets,
        count: assetCount,
        max: limits.maxAssets
      };
    }
  }

  /**
   * 3. Creates a new Client under a Workspace
   */
  static async createClient(workspace: Workspace, name: string, industry: string): Promise<Client> {
    const limitsCheck = await this.checkLimits(workspace, "client");
    if (!limitsCheck.allowed) {
      throw new Error(`Limit Exceeded: Current plan (${workspace.plan.toUpperCase()}) allows maximum of ${limitsCheck.max} clients. You currently have ${limitsCheck.count}. Please upgrade.`);
    }

    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase
        .from("clients")
        .insert({
          workspace_id: workspace.id,
          name,
          industry
        })
        .select()
        .single();
      
      if (error) throw new Error(`Database Error: ${error.message}`);
      return data;
    }

    // In-memory implementation
    const newClient: Client = {
      id: `client_${Math.random().toString(36).substring(2, 11)}`,
      workspace_id: workspace.id,
      name,
      industry,
      created_at: new Date().toISOString()
    };
    mockClients.push(newClient);
    return newClient;
  }

  /**
   * 4. Retrieves clients in a workspace
   */
  static async getClients(workspace: Workspace): Promise<Client[]> {
    if (isSupabaseEnabled && supabase) {
      const { data } = await supabase
        .from("clients")
        .select("*")
        .eq("workspace_id", workspace.id)
        .order("created_at", { ascending: false });
      return data || [];
    }
    return mockClients.filter(c => c.workspace_id === workspace.id);
  }

  /**
   * 5. Saves individual generated hooks to client history
   */
  static async saveHooks(client_id: string, hooks: Array<{ hook: string; category: string }>, workspace: Workspace) {
    const limitsCheck = await this.checkLimits(workspace, "asset");
    if (!limitsCheck.allowed) {
      throw new Error(`Limit Exceeded: Current plan allows maximum of ${limitsCheck.max} assets. Upgrade required.`);
    }

    if (isSupabaseEnabled && supabase) {
      const rows = hooks.map(h => ({
        client_id,
        hook: h.hook,
        category: h.category
      }));
      const { data, error } = await supabase.from("hooks").insert(rows).select();
      if (error) throw new Error(error.message);
      return data;
    }

    const saved = hooks.map(h => {
      const newHook = {
        id: `hook_${Math.random().toString(36).substring(2, 11)}`,
        client_id,
        hook: h.hook,
        category: h.category,
        created_at: new Date().toISOString()
      };
      mockHooks.push(newHook);
      return newHook;
    });
    return saved;
  }

  /**
   * 6. Saves individual angles
   */
  static async saveAngles(client_id: string, angles: string[], workspace: Workspace) {
    const limitsCheck = await this.checkLimits(workspace, "asset");
    if (!limitsCheck.allowed) {
      throw new Error(`Limit Exceeded: Current plan allows maximum of ${limitsCheck.max} assets. Upgrade required.`);
    }

    if (isSupabaseEnabled && supabase) {
      const rows = angles.map(angle => ({ client_id, angle }));
      const { data, error } = await supabase.from("angles").insert(rows).select();
      if (error) throw new Error(error.message);
      return data;
    }

    const saved = angles.map(angle => {
      const row = {
        id: `angle_${Math.random().toString(36).substring(2, 11)}`,
        client_id,
        angle,
        created_at: new Date().toISOString()
      };
      mockAngles.push(row);
      return row;
    });
    return saved;
  }

  /**
   * 7. Saves ad creative concepts
   */
  static async saveConcepts(client_id: string, concepts: any[], workspace: Workspace) {
    const limitsCheck = await this.checkLimits(workspace, "asset");
    if (!limitsCheck.allowed) {
      throw new Error(`Limit Exceeded: Current plan allows maximum of ${limitsCheck.max} assets. Upgrade required.`);
    }

    if (isSupabaseEnabled && supabase) {
      const rows = concepts.map(concept => ({ client_id, concept }));
      const { data, error } = await supabase.from("concepts").insert(rows).select();
      if (error) throw new Error(error.message);
      return data;
    }

    const saved = concepts.map(concept => {
      const row = {
        id: `concept_${Math.random().toString(36).substring(2, 11)}`,
        client_id,
        concept,
        created_at: new Date().toISOString()
      };
      mockConcepts.push(row);
      return row;
    });
    return saved;
  }

  /**
   * 8. Saves a Campaign Winner
   */
  static async saveWinner(client_id: string, type: string, content: any, score: number, workspace: Workspace) {
    const limitsCheck = await this.checkLimits(workspace, "asset");
    if (!limitsCheck.allowed) {
      throw new Error(`Limit Exceeded: Current plan (${workspace.plan.toUpperCase()}) allows maximum of ${limitsCheck.max} assets. Please upgrade your plan.`);
    }

    // Retrieve client details to verify ownership and construct text for embedding
    let clientName = "Unknown Client";
    if (isSupabaseEnabled && supabase) {
      const { data: client } = await supabase.from("clients").select("name").eq("id", client_id).single();
      if (client) clientName = client.name;
    } else {
      const client = mockClients.find(c => c.id === client_id);
      if (client) clientName = client.name;
    }

    const contentText = typeof content === "string" ? content : JSON.stringify(content);
    const textToEmbed = `Client: ${clientName}\nType: ${type}\nContent: ${contentText}\nScore: ${score}`;

    // Get vector embedding representation
    console.log("[SupabaseService] Creating text embedding for winner...");
    const embedding = await GeminiService.getEmbedding(textToEmbed);

    if (isSupabaseEnabled && supabase) {
      const { data, error } = await supabase
        .from("winners")
        .insert({
          client_id,
          content: { ...content, type },
          score,
          embedding,
        })
        .select()
        .single();
      
      if (error) throw new Error(`Database Error: ${error.message}`);
      
      // Strip embedding vector from returned object for safety
      delete data.embedding;
      return { id: data.id, ...data, mode: "supabase" };
    }

    // In-memory fallback implementation
    const newWinner: Winner = {
      id: `win_${Math.random().toString(36).substring(2, 11)}`,
      client_id,
      content: { ...content, type },
      score,
      embedding,
      created_at: new Date().toISOString()
    };
    mockWinners.push(newWinner);
    return { ...newWinner, embedding: undefined, mode: "in-memory" };
  }

  /**
   * 9. Retrieve Winners via semantic search or filters
   */
  static async retrieveWinners(workspace: Workspace, query?: string, client_id?: string, limit: number = 10) {
    let queryEmbedding: number[] | null = null;
    if (query) {
      console.log(`[SupabaseService] Fetching embedding for query: "${query}"`);
      queryEmbedding = await GeminiService.getEmbedding(query);
    }

    // Verify workspace clients first (to filter winners belonging to this workspace)
    let allowedClientIds: string[] = [];
    if (isSupabaseEnabled && supabase) {
      const { data: clients } = await supabase.from("clients").select("id").eq("workspace_id", workspace.id);
      allowedClientIds = (clients || []).map((c: any) => c.id);
    } else {
      allowedClientIds = mockClients.filter(c => c.workspace_id === workspace.id).map(c => c.id);
    }

    // If client_id parameter is passed, restrict further
    if (client_id) {
      if (!allowedClientIds.includes(client_id)) {
        throw new Error("Access Denied: The requested client does not belong to this workspace.");
      }
      allowedClientIds = [client_id];
    }

    if (allowedClientIds.length === 0) {
      return [];
    }

    if (isSupabaseEnabled && supabase) {
      try {
        if (queryEmbedding) {
          // Perform vector query using the Supabase pgvector RPC function
          const { data, error } = await supabase.rpc("match_winners", {
            query_embedding: queryEmbedding,
            match_threshold: 0.1, // retrieve matches above similarity threshold
            match_count: limit,
            filter_client_id: client_id || null
          });

          if (error) throw new Error(error.message);

          // Filter by clients that belong to this workspace
          return (data || []).filter((item: any) => allowedClientIds.includes(item.client_id));
        } else {
          // Standard query based on client ids
          let queryRef = supabase
            .from("winners")
            .select("id, client_id, content, score, created_at")
            .in("client_id", allowedClientIds)
            .order("created_at", { ascending: false })
            .limit(limit);

          const { data, error } = await queryRef;
          if (error) throw new Error(error.message);
          return data || [];
        }
      } catch (error) {
        console.error("[SupabaseService] Query failed, falling back to in-memory:", error);
      }
    }

    // In-memory fallback search/filtering
    let filtered = mockWinners.filter(win => allowedClientIds.includes(win.client_id));

    if (queryEmbedding) {
      const qEmbed = queryEmbedding;
      const scored = filtered.map(item => {
        const scoreVal = cosineSimilarity(item.embedding || [], qEmbed);
        return { item, similarity: scoreVal };
      });
      // Sort similarity high to low
      scored.sort((a, b) => b.similarity - a.similarity);
      filtered = scored.map(s => ({
        ...s.item,
        similarity: s.similarity
      }));
    }

    return filtered.slice(0, limit).map(item => {
      const win = { ...item } as any;
      delete win.embedding;
      return win;
    });
  }

  /**
   * Helper to retrieve all database statistics for dashboard metrics
   */
  static async getWorkspaceStats(workspace: Workspace) {
    let clientCount = 0;
    let hookCount = 0;
    let angleCount = 0;
    let conceptCount = 0;
    let winnerCount = 0;

    if (isSupabaseEnabled && supabase) {
      // Count clients
      const { count: clients } = await supabase.from("clients").select("*", { count: "exact", head: true }).eq("workspace_id", workspace.id);
      clientCount = clients || 0;

      // Fetch client list
      const { data: clientsList } = await supabase.from("clients").select("id").eq("workspace_id", workspace.id);
      const clientIds = (clientsList || []).map((c: any) => c.id);

      if (clientIds.length > 0) {
        const [hooks, angles, concepts, winners] = await Promise.all([
          supabase.from("hooks").select("*", { count: "exact", head: true }).in("client_id", clientIds),
          supabase.from("angles").select("*", { count: "exact", head: true }).in("client_id", clientIds),
          supabase.from("concepts").select("*", { count: "exact", head: true }).in("client_id", clientIds),
          supabase.from("winners").select("*", { count: "exact", head: true }).in("client_id", clientIds),
        ]);
        hookCount = hooks.count || 0;
        angleCount = angles.count || 0;
        conceptCount = concepts.count || 0;
        winnerCount = winners.count || 0;
      }
    } else {
      const clientIds = mockClients.filter(c => c.workspace_id === workspace.id).map(c => c.id);
      clientCount = clientIds.length;
      hookCount = mockHooks.filter(x => clientIds.includes(x.client_id)).length;
      angleCount = mockAngles.filter(x => clientIds.includes(x.client_id)).length;
      conceptCount = mockConcepts.filter(x => clientIds.includes(x.client_id)).length;
      winnerCount = mockWinners.filter(x => clientIds.includes(x.client_id)).length;
    }

    const totalAssets = hookCount + angleCount + conceptCount + winnerCount;
    const limits = PLAN_LIMITS[workspace.plan];

    return {
      workspaceName: workspace.name,
      plan: workspace.plan,
      clientCount,
      clientMax: limits.maxClients,
      assetCount: totalAssets,
      assetMax: limits.maxAssets,
      breakdown: {
        hooks: hookCount,
        angles: angleCount,
        concepts: conceptCount,
        winners: winnerCount
      }
    };
  }
}
export { mockWorkspaces, mockClients, mockHooks, mockAngles, mockConcepts, mockWinners };
