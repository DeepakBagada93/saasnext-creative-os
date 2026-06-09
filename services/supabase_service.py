import os
import uuid
import math
import random
import json
from datetime import datetime
from typing import List, Union
from supabase import create_client, Client
from services.gemini_service import GeminiService
from dotenv import load_dotenv
load_dotenv()

supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY")

supabase = None
is_supabase_enabled = False

if supabase_url and supabase_key:
    try:
        supabase = create_client(supabase_url, supabase_key)
        is_supabase_enabled = True
        print("[SupabaseService] Initialized client successfully.")
    except Exception as error:
        print(f"[SupabaseService] Failed to initialize Supabase client: {error}")
else:
    print("[SupabaseService] Missing SUPABASE_URL or keys. Running in mockup mode.")

# Plan limits
PLAN_LIMITS = {
    "free": {"maxClients": 3, "maxAssets": 100},
    "agency": {"maxClients": 25, "maxAssets": 5000},
    "scale": {"maxClients": float('inf'), "maxAssets": float('inf')}
}

# Fallback mockup in-memory database
mock_workspaces = [
    {
        "id": "d3b07384-d113-4ec5-a587-ad2052f53d71",
        "name": "Mock Agency Workspace",
        "plan": "agency",
        "api_key": "cos_live_mockkey12345",
        "created_at": datetime.utcnow().isoformat() + "Z",
    },
    {
        "id": "f3b07384-d113-4ec5-a587-ad2052f53d72",
        "name": "Mock Free Workspace",
        "plan": "free",
        "api_key": "cos_live_freekey123",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
]

mock_clients = [
    {
        "id": "client_mock_1",
        "workspace_id": "d3b07384-d113-4ec5-a587-ad2052f53d71",
        "name": "Smile Dental Clinic",
        "industry": "Healthcare",
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
]

mock_hooks = []
mock_angles = []
mock_concepts = []
mock_winners = []


def cosine_similarity(a: List[float], b: List[float]) -> float:
    if len(a) != len(b):
        return 0.0
    dot_product = sum(x * y for x, y in zip(a, b))
    norm_a = sum(x * x for x in a)
    norm_b = sum(y * y for y in b)
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return dot_product / (math.sqrt(norm_a) * math.sqrt(norm_b))


class SupabaseService:
    @staticmethod
    async def validate_api_key(api_key: str) -> dict:
        """
        1. Validates API Key and retrieves workspace
        """
        if not api_key:
            raise ValueError("API key is required. Provide 'CREATIVEOS_API_KEY' or pass in 'x-api-key' header.")

        if is_supabase_enabled and supabase:
            try:
                result = supabase.table("workspaces").select("*").eq("api_key", api_key).execute()
                if result.data:
                    return result.data[0]
                raise Exception("Invalid API key. Workspace not found.")
            except Exception as e:
                raise Exception(f"Invalid API key. Workspace not found. Detail: {e}")

        # Fallback mockup validation
        found = next((w for w in mock_workspaces if w["api_key"] == api_key), None)
        if not found:
            raise ValueError("Invalid API key. Workspace not found (Mockup Mode).")
        return found

    @staticmethod
    async def check_limits(workspace: dict, type_val: str) -> dict:
        """
        2. Checks workspace limits
        """
        plan = workspace.get("plan", "free")
        limits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        
        if type_val == "client":
            client_count = 0
            if is_supabase_enabled and supabase:
                try:
                    result = supabase.table("clients").select("*", count="exact").eq("workspace_id", workspace["id"]).execute()
                    client_count = result.count if result.count is not None else len(result.data)
                except Exception:
                    client_count = 0
            else:
                client_count = len([c for c in mock_clients if c["workspace_id"] == workspace["id"]])

            max_clients = limits["maxClients"]
            return {
                "allowed": client_count < max_clients,
                "count": client_count,
                "max": max_clients
            }
        else:
            # Assets: sum of hooks + angles + concepts + winners
            asset_count = 0
            
            if is_supabase_enabled and supabase:
                try:
                    clients_res = supabase.table("clients").select("id").eq("workspace_id", workspace["id"]).execute()
                    client_ids = [c["id"] for c in (clients_res.data or [])]
                    
                    if client_ids:
                        # Query each table
                        h_res = supabase.table("hooks").select("id", count="exact").in_("client_id", client_ids).execute()
                        a_res = supabase.table("angles").select("id", count="exact").in_("client_id", client_ids).execute()
                        c_res = supabase.table("concepts").select("id", count="exact").in_("client_id", client_ids).execute()
                        w_res = supabase.table("winners").select("id", count="exact").in_("client_id", client_ids).execute()
                        
                        h_count = h_res.count if h_res.count is not None else len(h_res.data)
                        a_count = a_res.count if a_res.count is not None else len(a_res.data)
                        c_count = c_res.count if c_res.count is not None else len(c_res.data)
                        w_count = w_res.count if w_res.count is not None else len(w_res.data)
                        
                        asset_count = h_count + a_count + c_count + w_count
                except Exception:
                    asset_count = 0
            else:
                client_ids = [c["id"] for c in mock_clients if c["workspace_id"] == workspace["id"]]
                h_count = len([x for x in mock_hooks if x["client_id"] in client_ids])
                a_count = len([x for x in mock_angles if x["client_id"] in client_ids])
                c_count = len([x for x in mock_concepts if x["client_id"] in client_ids])
                w_count = len([x for x in mock_winners if x["client_id"] in client_ids])
                asset_count = h_count + a_count + c_count + w_count

            max_assets = limits["maxAssets"]
            return {
                "allowed": asset_count < max_assets,
                "count": asset_count,
                "max": max_assets
            }

    @staticmethod
    async def create_client(workspace: dict, name: str, industry: str) -> dict:
        """
        3. Creates a new Client under a Workspace
        """
        limits_check = await SupabaseService.check_limits(workspace, "client")
        if not limits_check["allowed"]:
            raise Exception(f"Limit Exceeded: Current plan ({workspace['plan'].upper()}) allows maximum of {limits_check['max']} clients. You currently have {limits_check['count']}. Please upgrade.")

        if is_supabase_enabled and supabase:
            result = supabase.table("clients").insert({
                "workspace_id": workspace["id"],
                "name": name,
                "industry": industry
            }).execute()
            if not result.data:
                raise Exception("Failed to insert client into database.")
            return result.data[0]

        # In-memory implementation
        new_client = {
            "id": f"client_{str(uuid.uuid4())[:8]}",
            "workspace_id": workspace["id"],
            "name": name,
            "industry": industry,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        mock_clients.append(new_client)
        return new_client

    @staticmethod
    async def get_clients(workspace: dict) -> List[dict]:
        """
        4. Retrieves clients in a workspace
        """
        if is_supabase_enabled and supabase:
            result = supabase.table("clients").select("*").eq("workspace_id", workspace["id"]).order("created_at", desc=True).execute()
            return result.data or []
        return [c for c in mock_clients if c["workspace_id"] == workspace["id"]]

    @staticmethod
    async def save_hooks(client_id: str, hooks: List[dict], workspace: dict) -> List[dict]:
        """
        5. Saves individual generated hooks to client history
        """
        limits_check = await SupabaseService.check_limits(workspace, "asset")
        if not limits_check["allowed"]:
            raise Exception(f"Limit Exceeded: Current plan allows maximum of {limits_check['max']} assets. Upgrade required.")

        if is_supabase_enabled and supabase:
            rows = [{"client_id": client_id, "hook": h["hook"], "category": h["category"]} for h in hooks]
            result = supabase.table("hooks").insert(rows).execute()
            return result.data or []

        saved = []
        for h in hooks:
            row = {
                "id": f"hook_{str(uuid.uuid4())[:8]}",
                "client_id": client_id,
                "hook": h["hook"],
                "category": h["category"],
                "created_at": datetime.utcnow().isoformat() + "Z"
            }
            mock_hooks.append(row)
            saved.append(row)
        return saved

    @staticmethod
    async def save_angles(client_id: str, angles: List[str], workspace: dict) -> List[dict]:
        """
        6. Saves individual angles
        """
        limits_check = await SupabaseService.check_limits(workspace, "asset")
        if not limits_check["allowed"]:
            raise Exception(f"Limit Exceeded: Current plan allows maximum of {limits_check['max']} assets. Upgrade required.")

        if is_supabase_enabled and supabase:
            rows = [{"client_id": client_id, "angle": angle} for angle in angles]
            result = supabase.table("angles").insert(rows).execute()
            return result.data or []

        saved = []
        for angle in angles:
            row = {
                "id": f"angle_{str(uuid.uuid4())[:8]}",
                "client_id": client_id,
                "angle": angle,
                "created_at": datetime.utcnow().isoformat() + "Z"
            }
            mock_angles.append(row)
            saved.append(row)
        return saved

    @staticmethod
    async def save_concepts(client_id: str, concepts: List[dict], workspace: dict) -> List[dict]:
        """
        7. Saves ad creative concepts
        """
        limits_check = await SupabaseService.check_limits(workspace, "asset")
        if not limits_check["allowed"]:
            raise Exception(f"Limit Exceeded: Current plan allows maximum of {limits_check['max']} assets. Upgrade required.")

        if is_supabase_enabled and supabase:
            rows = [{"client_id": client_id, "concept": concept} for concept in concepts]
            result = supabase.table("concepts").insert(rows).execute()
            return result.data or []

        saved = []
        for concept in concepts:
            row = {
                "id": f"concept_{str(uuid.uuid4())[:8]}",
                "client_id": client_id,
                "concept": concept,
                "created_at": datetime.utcnow().isoformat() + "Z"
            }
            mock_concepts.append(row)
            saved.append(row)
        return saved

    @staticmethod
    async def save_winner(client_id: str, type_val: str, content: Union[dict, str], score: int, workspace: dict) -> dict:
        """
        8. Saves a Campaign Winner
        """
        limits_check = await SupabaseService.check_limits(workspace, "asset")
        if not limits_check["allowed"]:
            raise Exception(f"Limit Exceeded: Current plan ({workspace['plan'].upper()}) allows maximum of {limits_check['max']} assets. Please upgrade your plan.")

        client_name = "Unknown Client"
        if is_supabase_enabled and supabase:
            try:
                client_res = supabase.table("clients").select("name").eq("id", client_id).execute()
                if client_res.data:
                    client_name = client_res.data[0]["name"]
            except Exception:
                pass
        else:
            client_found = next((c for c in mock_clients if c["id"] == client_id), None)
            if client_found:
                client_name = client_found["name"]

        content_text = content if isinstance(content, str) else json.dumps(content)
        text_to_embed = f"Client: {client_name}\nType: {type_val}\nContent: {content_text}\nScore: {score}"

        print("[SupabaseService] Creating text embedding for winner...")
        embedding = await GeminiService.get_embedding(text_to_embed)

        content_obj = content if isinstance(content, dict) else {"text": content}
        content_obj["type"] = type_val

        if is_supabase_enabled and supabase:
            result = supabase.table("winners").insert({
                "client_id": client_id,
                "content": content_obj,
                "score": score,
                "embedding": embedding
            }).execute()
            if not result.data:
                raise Exception("Failed to save winner to database.")
            data = result.data[0]
            if "embedding" in data:
                del data["embedding"]
            data["mode"] = "supabase"
            return data

        # In-memory fallback
        new_winner = {
            "id": f"win_{str(uuid.uuid4())[:8]}",
            "client_id": client_id,
            "content": content_obj,
            "score": score,
            "embedding": embedding,
            "created_at": datetime.utcnow().isoformat() + "Z"
        }
        mock_winners.append(new_winner)
        ret_val = new_winner.copy()
        del ret_val["embedding"]
        ret_val["mode"] = "in-memory"
        return ret_val

    @staticmethod
    async def retrieve_winners(workspace: dict, query: str = None, client_id: str = None, limit: int = 10) -> List[dict]:
        """
        9. Retrieve Winners via semantic search or filters
        """
        query_embedding = None
        if query:
            print(f"[SupabaseService] Fetching embedding for query: \"{query}\"")
            query_embedding = await GeminiService.get_embedding(query)

        allowed_client_ids = []
        if is_supabase_enabled and supabase:
            try:
                clients_res = supabase.table("clients").select("id").eq("workspace_id", workspace["id"]).execute()
                allowed_client_ids = [c["id"] for c in (clients_res.data or [])]
            except Exception:
                allowed_client_ids = []
        else:
            allowed_client_ids = [c["id"] for c in mock_clients if c["workspace_id"] == workspace["id"]]

        if client_id:
            if client_id not in allowed_client_ids:
                raise Exception("Access Denied: The requested client does not belong to this workspace.")
            allowed_client_ids = [client_id]

        if not allowed_client_ids:
            return []

        if is_supabase_enabled and supabase:
            try:
                if query_embedding:
                    # Invoke RPC match_winners
                    rpc_params = {
                        "query_embedding": query_embedding,
                        "match_threshold": 0.1,
                        "match_count": limit,
                        "filter_client_id": client_id or None
                    }
                    result = supabase.rpc("match_winners", rpc_params).execute()
                    # Filter by workspace client IDs
                    winners_list = result.data or []
                    return [w for w in winners_list if w["client_id"] in allowed_client_ids]
                else:
                    result = supabase.table("winners").select("id, client_id, content, score, created_at")\
                        .in_("client_id", allowed_client_ids)\
                        .order("created_at", desc=True)\
                        .limit(limit)\
                        .execute()
                    return result.data or []
            except Exception as e:
                print(f"[SupabaseService] Query failed, falling back to in-memory: {e}")

        # In-memory fallback search/filtering
        filtered = [w for w in mock_winners if w["client_id"] in allowed_client_ids]

        if query_embedding:
            scored = []
            for item in filtered:
                item_embedding = item.get("embedding") or []
                similarity = cosine_similarity(item_embedding, query_embedding)
                scored.append((item, similarity))
            
            scored.sort(key=lambda x: x[1], reverse=True)
            filtered = []
            for item, sim in scored:
                item_copy = item.copy()
                item_copy["similarity"] = f"{sim:.2f} (Cosine Similarity)"
                filtered.append(item_copy)

        sliced = filtered[:limit]
        for item in sliced:
            if "embedding" in item:
                del item["embedding"]
        return sliced

    @staticmethod
    async def get_workspace_stats(workspace: dict) -> dict:
        """
        Helper to retrieve all database statistics for dashboard metrics
        """
        client_count = 0
        hook_count = 0
        angle_count = 0
        concept_count = 0
        winner_count = 0

        if is_supabase_enabled and supabase:
            try:
                c_res = supabase.table("clients").select("id", count="exact").eq("workspace_id", workspace["id"]).execute()
                client_count = c_res.count if c_res.count is not None else len(c_res.data)

                # Get client IDs
                clients_list = supabase.table("clients").select("id").eq("workspace_id", workspace["id"]).execute()
                client_ids = [c["id"] for c in (clients_list.data or [])]

                if client_ids:
                    h_res = supabase.table("hooks").select("id", count="exact").in_("client_id", client_ids).execute()
                    a_res = supabase.table("angles").select("id", count="exact").in_("client_id", client_ids).execute()
                    c_res = supabase.table("concepts").select("id", count="exact").in_("client_id", client_ids).execute()
                    w_res = supabase.table("winners").select("id", count="exact").in_("client_id", client_ids).execute()

                    hook_count = h_res.count if h_res.count is not None else len(h_res.data)
                    angle_count = a_res.count if a_res.count is not None else len(a_res.data)
                    concept_count = c_res.count if c_res.count is not None else len(c_res.data)
                    winner_count = w_res.count if w_res.count is not None else len(w_res.data)
            except Exception as e:
                print(f"[SupabaseService] Error fetching stats, using 0 fallback: {e}")
        else:
            client_ids = [c["id"] for c in mock_clients if c["workspace_id"] == workspace["id"]]
            client_count = len(client_ids)
            hook_count = len([x for x in mock_hooks if x["client_id"] in client_ids])
            angle_count = len([x for x in mock_angles if x["client_id"] in client_ids])
            concept_count = len([x for x in mock_concepts if x["client_id"] in client_ids])
            winner_count = len([x for x in mock_winners if x["client_id"] in client_ids])

        total_assets = hook_count + angle_count + concept_count + winner_count
        limits = PLAN_LIMITS.get(workspace["plan"], PLAN_LIMITS["free"])

        return {
            "workspaceName": workspace["name"],
            "plan": workspace["plan"],
            "clientCount": client_count,
            "clientMax": limits["maxClients"],
            "assetCount": total_assets,
            "assetMax": limits["maxAssets"],
            "breakdown": {
                "hooks": hook_count,
                "angles": angle_count,
                "concepts": concept_count,
                "winners": winner_count
            }
        }
