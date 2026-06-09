import os
import json
import contextvars
from typing import List, Union
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mcp.server.fastmcp import FastMCP
from mcp.server.sse import SseServerTransport

from services.gemini_service import GeminiService
from services.supabase_service import SupabaseService

# Thread/Task-local storage to track multitenant workspace context
workspace_var = contextvars.ContextVar("workspace")

# Global fallback workspace for local stdio runs
global_workspace = None

# Initialize FastMCP Server
mcp = FastMCP("creativeos-mcp")

# Initialize SseServerTransport
sse = SseServerTransport("/messages")

# Registry for active SSE session to workspace mapping
session_workspaces = {}


def get_current_workspace() -> dict:
    try:
        return workspace_var.get()
    except LookupError:
        if global_workspace:
            return global_workspace
        raise Exception("Unauthorized: No active workspace context found. Verify your API Key configuration.")


def format_success(data: dict) -> str:
    return json.dumps(data, indent=2)


# --- MCP Tool Registrations ---

@mcp.tool()
async def create_client(name: str, industry: str) -> str:
    """Register a new client under the agency workspace. Subject to plan limitations."""
    workspace = get_current_workspace()
    client = await SupabaseService.create_client(workspace, name, industry)
    return format_success({
        "message": f"Client '{name}' registered successfully under workspace '{workspace['name']}'.",
        "client": client
    })


@mcp.tool()
async def market_research(product: str, audience: str, industry: str, client_id: str = None) -> str:
    """Conduct high-quality market research. Generates customer pain points, desires, fears, objections, and buying triggers."""
    workspace = get_current_workspace()
    
    winning_campaigns_context = ""
    if client_id:
        winners = await SupabaseService.retrieve_winners(workspace, client_id=client_id, limit=3)
        if winners:
            winning_campaigns_context = f"\nUse these historical winning campaigns/themes for this client to inform the style, voice, and triggers: {json.dumps(winners)}"
            
    enhanced_product = product + winning_campaigns_context
    result = await GeminiService.market_research(enhanced_product, audience, industry)
    return format_success(result)


@mcp.tool()
async def competitor_analysis(competitor_urls: Union[List[str], str], client_id: str = None) -> str:
    """Analyze competitor URLs to uncover positioning, offers, messaging strengths, and weaknesses."""
    urls = [competitor_urls] if isinstance(competitor_urls, str) else competitor_urls
    result = await GeminiService.competitor_analysis(urls)
    return format_success(result)


@mcp.tool()
async def generate_hooks(product: str, audience: str, goal: str, client_id: str = None) -> str:
    """Generate 100 categorized high-converting marketing hooks (curiosity, pain, authority, contrarian, urgency). Auto-saves to memory if client_id is set."""
    workspace = get_current_workspace()
    
    memory_context = ""
    if client_id:
        winners = await SupabaseService.retrieve_winners(workspace, client_id=client_id, limit=5)
        if winners:
            memory_context = f"\nClient historical winners to build upon: {json.dumps(winners)}"
            
    enhanced_product = product + memory_context
    result = await GeminiService.generate_hooks(enhanced_product, audience, goal)
    
    if client_id:
        print(f"[CreativeOS MCP] Auto-saving generated hooks to database for client: {client_id}")
        hooks_to_save = []
        categories = ["curiosity", "pain", "authority", "contrarian", "urgency"]
        for cat in categories:
            if cat in result and isinstance(result[cat], list):
                for hook in result[cat]:
                    hooks_to_save.append({"hook": hook, "category": cat})
        if hooks_to_save:
            try:
                await SupabaseService.save_hooks(client_id, hooks_to_save, workspace)
            except Exception as save_err:
                print(f"[CreativeOS MCP] Hook autosave failed (limit hit): {save_err}")
                
    return format_success(result)


@mcp.tool()
async def generate_angles(product: str, audience: str, client_id: str = None) -> str:
    """Generate 50 distinct high-converting marketing angles (perspectives or copy themes) for a product. Auto-saves if client_id is set."""
    workspace = get_current_workspace()
    result = await GeminiService.generate_angles(product, audience)
    
    if client_id and "angles" in result and isinstance(result["angles"], list):
        print(f"[CreativeOS MCP] Auto-saving generated angles to database for client: {client_id}")
        angles_to_save = [f"{a['name']}: {a['angle']}" for a in result["angles"] if 'name' in a and 'angle' in a]
        if angles_to_save:
            try:
                await SupabaseService.save_angles(client_id, angles_to_save, workspace)
            except Exception as save_err:
                print(f"[CreativeOS MCP] Angle autosave failed (limit hit): {save_err}")
                
    return format_success(result)


@mcp.tool()
async def generate_creative_concepts(product: str, audience: str, competitors: Union[List[str], str] = None, client_id: str = None) -> str:
    """Generate 20 distinct ad creative concepts (hooks, angles, briefs, CTAs). Leverages agency memory if client_id is set."""
    workspace = get_current_workspace()
    
    memory_context = ""
    if client_id:
        winners = await SupabaseService.retrieve_winners(workspace, client_id=client_id, limit=3)
        if winners:
            memory_context = f"\nClient historical winners context to guide angle framing: {json.dumps(winners)}"
            
    enhanced_product = product + memory_context
    comp_list = []
    if competitors:
        comp_list = [competitors] if isinstance(competitors, str) else competitors
        
    result = await GeminiService.generate_creative_concepts(enhanced_product, audience, comp_list)
    
    if client_id and "concepts" in result and isinstance(result["concepts"], list):
        print(f"[CreativeOS MCP] Auto-saving generated concepts to database for client: {client_id}")
        try:
            await SupabaseService.save_concepts(client_id, result["concepts"], workspace)
        except Exception as save_err:
            print(f"[CreativeOS MCP] Concept autosave failed (limit hit): {save_err}")
            
    return format_success(result)


@mcp.tool()
async def generate_ugc_scripts(product: str, audience: str, client_id: str = None) -> str:
    """Generate 10 structured User Generated Content (UGC) video scripts (hook, script body, CTA, visual cues)."""
    result = await GeminiService.generate_ugc_scripts(product, audience)
    return format_success(result)


@mcp.tool()
async def save_winner(client_id: str, type: str, content: Union[dict, str], score: int = 10) -> str:
    """Store successful marketing assets (hooks, ads, angles, campaigns) in Supabase vector memory for future similarity searches."""
    workspace = get_current_workspace()
    result = await SupabaseService.save_winner(client_id, type, content, score, workspace)
    return format_success({
        "message": "Winning asset successfully saved to agency memory database.",
        "winner": result
    })


@mcp.tool()
async def retrieve_winners(query: str = None, client_id: str = None, limit: int = 10) -> str:
    """Retrieve similar winning campaigns using semantic vector search and Client ID filtering."""
    workspace = get_current_workspace()
    result = await SupabaseService.retrieve_winners(workspace, query, client_id, limit)
    return format_success(result)


# --- FastAPI Application Configuration ---

from contextlib import asynccontextmanager

async def bootstrap():
    global global_workspace
    stdio_key = os.environ.get("CREATIVEOS_API_KEY") or "cos_live_mockkey12345"
    try:
        global_workspace = await SupabaseService.validate_api_key(stdio_key)
        print(f"[CreativeOS MCP] Local stdio fallback context initialized: '{global_workspace['name']}' ({global_workspace['plan'].upper()})")
    except Exception as e:
        print(f"[CreativeOS MCP] Warning during startup key validation: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Run bootstrap
    await bootstrap()
    yield

app = FastAPI(lifespan=lifespan)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Middleware to bind workspace context to request thread
@app.middleware("http")
async def workspace_context_middleware(request: Request, call_next):
    session_id = request.query_params.get("sessionId") or request.query_params.get("session_id")
    workspace = None
    if session_id and session_id in session_workspaces:
        workspace = session_workspaces[session_id]
        
    if workspace:
        token = workspace_var.set(workspace)
        try:
            return await call_next(request)
        finally:
            workspace_var.reset(token)
    else:
        return await call_next(request)


# Helper to authenticate REST calls
async def get_active_workspace(request: Request) -> dict:
    try:
        return workspace_var.get()
    except LookupError:
        pass
        
    api_key = (
        request.headers.get("x-api-key") or 
        request.query_params.get("apiKey") or 
        request.query_params.get("api_key") or 
        os.environ.get("CREATIVEOS_API_KEY") or 
        "cos_live_mockkey12345"
    )
    return await SupabaseService.validate_api_key(api_key)


# --- Pydantic Body Models for REST Endpoints ---

class CreateClientRequest(BaseModel):
    name: str
    industry: str

class SaveWinnerRequest(BaseModel):
    client_id: str
    type: str
    content: Union[dict, str]
    score: int = 10

class GenerateHooksRequest(BaseModel):
    product: str
    audience: str
    goal: str
    client_id: str = None

class GenerateAnglesRequest(BaseModel):
    product: str
    audience: str
    client_id: str = None

class GenerateConceptsRequest(BaseModel):
    product: str
    audience: str
    competitors: List[str] = None
    client_id: str = None

class GenerateUgcRequest(BaseModel):
    product: str
    audience: str


# --- SSE & Messages Endpoints ---

@app.get("/sse")
async def handle_sse(request: Request):
    api_key = (
        request.headers.get("x-api-key") or 
        request.query_params.get("apiKey") or 
        request.query_params.get("api_key") or 
        os.environ.get("CREATIVEOS_API_KEY") or 
        "cos_live_mockkey12345"
    )
    try:
        workspace = await SupabaseService.validate_api_key(api_key)
        print(f"[CreativeOS MCP] SSE Connection validated: {workspace['name']} ({workspace['plan'].upper()})")
    except Exception as err:
        return JSONResponse({"error": str(err)}, status_code=401)

    existing_session_ids = set(sse._read_stream_writers.keys())
    
    async def stream_runner():
        async with sse.connect_sse(request.scope, request.receive, request._send) as streams:
            # Discover the newly created session ID
            current_session_ids = set(sse._read_stream_writers.keys())
            new_session_ids = current_session_ids - existing_session_ids
            if new_session_ids:
                session_id = list(new_session_ids)[0]
                hex_id = session_id.hex if hasattr(session_id, 'hex') else str(session_id)
                session_workspaces[hex_id] = workspace
                print(f"[CreativeOS MCP] Mapped session {hex_id} to workspace '{workspace['name']}'")
            
            try:
                # Route streams directly to underlying MCP server
                await mcp._mcp_server.run(
                    streams[0],
                    streams[1],
                    mcp._mcp_server.create_initialization_options()
                )
            finally:
                if new_session_ids:
                    session_id = list(new_session_ids)[0]
                    hex_id = session_id.hex if hasattr(session_id, 'hex') else str(session_id)
                    session_workspaces.pop(hex_id, None)
                    print(f"[CreativeOS MCP] Cleaned up session {hex_id}")

    await stream_runner()
    return Response()

# Mount /messages to SSE transport post message handler
app.mount("/messages", sse.handle_post_message)


# --- REST API Routing ---

@app.get("/api/stats")
async def api_stats(request: Request):
    try:
        workspace = await get_active_workspace(request)
        stats = await SupabaseService.get_workspace_stats(workspace)
        return stats
    except Exception as err:
        return JSONResponse({"error": str(err)}, status_code=401)


@app.get("/api/clients")
async def api_get_clients(request: Request):
    try:
        workspace = await get_active_workspace(request)
        clients = await SupabaseService.get_clients(workspace)
        return clients
    except Exception as err:
        return JSONResponse({"error": str(err)}, status_code=401)


@app.post("/api/clients")
async def api_create_client(request: Request, body: CreateClientRequest):
    try:
        workspace = await get_active_workspace(request)
        client = await SupabaseService.create_client(workspace, body.name, body.industry)
        return client
    except Exception as err:
        return JSONResponse({"error": str(err)}, status_code=400)


@app.get("/api/winners")
async def api_get_winners(request: Request, query: str = None, client_id: str = None, limit: int = 10):
    try:
        workspace = await get_active_workspace(request)
        winners = await SupabaseService.retrieve_winners(workspace, query, client_id, limit)
        return winners
    except Exception as err:
        return JSONResponse({"error": str(err)}, status_code=400)


@app.post("/api/winners")
async def api_save_winner(request: Request, body: SaveWinnerRequest):
    try:
        workspace = await get_active_workspace(request)
        result = await SupabaseService.save_winner(body.client_id, body.type, body.content, body.score, workspace)
        return result
    except Exception as err:
        return JSONResponse({"error": str(err)}, status_code=400)


@app.post("/api/generate/hooks")
async def api_generate_hooks(request: Request, body: GenerateHooksRequest):
    try:
        workspace = await get_active_workspace(request)
        
        memory_context = ""
        if body.client_id:
            winners = await SupabaseService.retrieve_winners(workspace, client_id=body.client_id, limit=5)
            if winners:
                memory_context = f"\nClient historical winners to build upon: {json.dumps(winners)}"
                
        enhanced_product = body.product + memory_context
        result = await GeminiService.generate_hooks(enhanced_product, body.audience, body.goal)
        
        if body.client_id:
            hooks_to_save = []
            categories = ["curiosity", "pain", "authority", "contrarian", "urgency"]
            for cat in categories:
                if cat in result and isinstance(result[cat], list):
                    for hook in result[cat]:
                        hooks_to_save.append({"hook": hook, "category": cat})
            if hooks_to_save:
                try:
                    await SupabaseService.save_hooks(body.client_id, hooks_to_save, workspace)
                except Exception as save_err:
                    print(f"Hook autosave during HTTP generate failed: {save_err}")
                    
        return result
    except Exception as err:
        return JSONResponse({"error": str(err)}, status_code=400)


@app.post("/api/generate/angles")
async def api_generate_angles(request: Request, body: GenerateAnglesRequest):
    try:
        workspace = await get_active_workspace(request)
        result = await GeminiService.generate_angles(body.product, body.audience)
        
        if body.client_id and "angles" in result and isinstance(result["angles"], list):
            angles_to_save = [f"{a['name']}: {a['angle']}" for a in result["angles"] if 'name' in a and 'angle' in a]
            if angles_to_save:
                try:
                    await SupabaseService.save_angles(body.client_id, angles_to_save, workspace)
                except Exception as save_err:
                    print(f"Angle autosave during HTTP generate failed: {save_err}")
                    
        return result
    except Exception as err:
        return JSONResponse({"error": str(err)}, status_code=400)


@app.post("/api/generate/concepts")
async def api_generate_concepts(request: Request, body: GenerateConceptsRequest):
    try:
        workspace = await get_active_workspace(request)
        
        memory_context = ""
        if body.client_id:
            winners = await SupabaseService.retrieve_winners(workspace, client_id=body.client_id, limit=3)
            if winners:
                memory_context = f"\nClient historical winners context to guide angle framing: {json.dumps(winners)}"
                
        enhanced_product = body.product + memory_context
        result = await GeminiService.generate_creative_concepts(enhanced_product, body.audience, body.competitors or [])
        
        if body.client_id and "concepts" in result and isinstance(result["concepts"], list):
            try:
                await SupabaseService.save_concepts(body.client_id, result["concepts"], workspace)
            except Exception as save_err:
                print(f"Concept autosave during HTTP generate failed: {save_err}")
                
        return result
    except Exception as err:
        return JSONResponse({"error": str(err)}, status_code=400)


@app.post("/api/generate/ugc")
async def api_generate_ugc(request: Request, body: GenerateUgcRequest):
    try:
        workspace = await get_active_workspace(request)
        result = await GeminiService.generate_ugc_scripts(body.product, body.audience)
        return result
    except Exception as err:
        return JSONResponse({"error": str(err)}, status_code=400)


# --- Execution Hook ---

if __name__ == "__main__" and not os.environ.get("VERCEL"):
    import asyncio
    import uvicorn
    
    # Run the bootstrap function to check local stdio keys
    asyncio.run(bootstrap())
    
    port_env = os.environ.get("PORT")
    transport_env = os.environ.get("TRANSPORT")
    
    # SSE running mode
    if port_env or transport_env == "sse":
        port_num = int(port_env) if port_env else 3000
        print(f"[CreativeOS MCP] Starting server using SSE transport on port {port_num}...")
        uvicorn.run("server:app", host="0.0.0.0", port=port_num, log_level="info")
    # Stdio running mode
    else:
        print("[CreativeOS MCP] Starting server using Stdio transport...")
        mcp.run()
