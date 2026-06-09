# CreativeOS MCP Server (v2.0.0)

A production-ready Model Context Protocol (MCP) server for marketing agencies. It acts as a memory-powered creative intelligence layer, enabling AI agents (in Claude Code, Cursor, Gemini CLI, etc.) to perform market research, analyze competitors, generate high-converting copy (hooks, angles, creative concepts, UGC scripts), and save/retrieve campaigns from a **Supabase PostgreSQL database** using semantic vector search.

> **Tagline**: *Bring Your Own AI. We Provide The Memory.*

---

## Architecture Overview

```
                  AI Clients (Claude, Gemini CLI, Cursor, etc.)
                                       │
                         (Stdio / SSE) ├─────────────────────────┐
                                       │                         │
                                       ▼                         ▼
                              CreativeOS MCP            Next.js Dashboard
                              (Python FastAPI)            (Workspace UI)
                                       │                         │
                  ┌────────────────────┴────────────────────┐    │
                  ▼                                         ▼    ▼
         Google Gemini API                         Supabase Database
        (Content & Embeddings)                    (Tenancy & Vector Search)
```

- **Tenancy Isolation**: Runs on FastAPI inside the backend. Uses task-local `contextvars.ContextVar` to associate active SSE sessions and REST requests with the correct authenticated workspace and pricing tier.
- **Proactive Memory Retrieval**: Before generating new hooks, angles, or briefs, the server searches Supabase for historical winning campaigns and passes them to the LLM to guide voice and effectiveness.
- **SaaS Limit Enforcement**: Validates workspace constraints on client count and saved assets dynamically before writing to the database.

---

## Tech Stack

- **MCP Server (Backend)**: Python, FastAPI, Uvicorn, FastMCP SDK (MCP Python SDK), Supabase Python client, Google GenAI SDK, Pydantic, Python-dotenv.
- **Dashboard (Frontend)**: Next.js, React, Tailwind CSS, Lucide icons.
- **Database**: Supabase PostgreSQL + `pgvector` extension.

---

## SaaS Subscription Pricing Policies

Limits are enforced at the database layer of the MCP gateway:

| Plan | Pricing | Client Limit | Asset Limit | Winners Memory |
| :--- | :--- | :--- | :--- | :--- |
| **Free** | $0/mo | Max 3 clients | Max 100 assets | Standard |
| **Agency** | $99/mo | Max 25 clients | Max 5,000 assets | Vector Semantic Search |
| **Scale** | $299/mo | Unlimited | Unlimited | Vector + Teams |

*Note: An **Asset** is any saved Hook, Angle, Concept, or Winner campaign record.*

---

## Quick Start

### 1. Installation

Set up a Python virtual environment and install backend dependencies:
```bash
# Using standard Python venv and pip
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Or using uv (much faster)
uv venv
uv pip install -r requirements.txt
```

Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://jhupwsyyfbngcpxvgtjr.supabase.co
SUPABASE_ANON_KEY=sb_publishable_aRZdktWmra5BrkYPiphkgg_eXtDwwQg
CREATIVEOS_API_KEY=cos_live_mockkey12345
TRANSPORT=stdio
PORT=3000
```

*Note: If no database credentials are provided, the server falls back to an in-memory database with a native Python cosine-similarity vector query engine so you can test connection instantly.*

### 3. Running the Backend Server Locally

To run in **Stdio** mode (for local IDE connections):
```bash
python3 server.py
```

To run in **SSE** mode (for network integrations and the Next.js dashboard):
```bash
python3 -m uvicorn server:app --port 3000
# Or using environment variables
TRANSPORT=sse PORT=3000 python3 server.py
```

---

## How to Configure Your AI Client

To use CreativeOS MCP inside your AI assistant, configure it as an MCP server using your specific API key:

### 1. Claude Code
Add to `~/.config/claude.json` or run `claude config`:

```json
{
  "mcpServers": {
    "creativeos": {
      "command": "/absolute/path/to/creativeos/.venv/bin/python3",
      "args": ["/absolute/path/to/creativeos/server.py"],
      "env": {
        "CREATIVEOS_API_KEY": "cos_live_mockkey12345",
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

### 2. Cursor
1. Go to **Settings** -> **Features** -> **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in the options:
   - **Name**: `creativeos`
   - **Type**: `stdio`
   - **Command**: `/absolute/path/to/creativeos/.venv/bin/python3 /absolute/path/to/creativeos/server.py`
4. Set environment variables:
   - `CREATIVEOS_API_KEY`: `cos_live_mockkey12345`
   - `GEMINI_API_KEY`: `YOUR_GEMINI_API_KEY`

### 3. Gemini CLI
Configure your global CLI settings:

```json
{
  "mcpServers": {
    "creativeos": {
      "command": "/absolute/path/to/creativeos/.venv/bin/python3",
      "args": ["/absolute/path/to/creativeos/server.py"],
      "env": {
        "CREATIVEOS_API_KEY": "cos_live_mockkey12345",
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

### 4. Windsurf
Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "creativeos": {
      "command": "/absolute/path/to/creativeos/.venv/bin/python3",
      "args": ["/absolute/path/to/creativeos/server.py"],
      "env": {
        "CREATIVEOS_API_KEY": "cos_live_mockkey12345",
        "GEMINI_API_KEY": "YOUR_GEMINI_API_KEY"
      }
    }
  }
}
```

---

## Launching the Frontend Dashboard

Run the development server for the Next.js UI:

```bash
cd frontend
npm run dev
```

Visit [http://localhost:3001](http://localhost:3001) (or check output port) to:
- Monitor workspace analytics and limits.
- Manage client databases and client IDs.
- Run vector search queries on winning campaigns.
- Manually configure, log, and rate copywriting winners.
- Test generators directly inside an interactive panel.

---

## Cloud Deployment Guide (Vercel)

Both the Next.js frontend and the FastAPI backend MCP server are fully optimized to deploy to **Vercel** serverless environments without Docker.

---

### 1. Frontend Dashboard Deployment
1. Connect your repository to **Vercel**.
2. Under **Project Settings**, set the **Root Directory** to `frontend`.
3. In **Environment Variables**, configure:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-supabase-url.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key`
4. Click **Deploy**. Vercel will build the Next.js static pages and serve it.

---

### 2. Backend MCP Server Deployment
The root directory contains a [vercel.json](vercel.json) file that automatically routes SSE and API traffic to the serverless-adapted FastAPI app:

1. Import the root repository to **Vercel** as a new project.
2. In **Environment Variables**, add:
   - `GEMINI_API_KEY` = `your-gemini-api-key`
   - `SUPABASE_URL` = `your-supabase-url`
   - `SUPABASE_ANON_KEY` = `your-supabase-anon-key`
   - `CREATIVEOS_API_KEY` = `cos_live_mockkey12345` (or your custom API key)
3. Click **Deploy**. Vercel will build and expose your serverless MCP backend (e.g. `https://creativeos-mcp.vercel.app`).
4. Configure your IDE client to point to the SSE URL:
   - **SSE Endpoint**: `https://your-backend-app.vercel.app/sse`
   - **Messages Endpoint**: `https://your-backend-app.vercel.app/messages`
   - **Header**: `x-api-key`: `cos_live_mockkey12345` (or your custom API key)
