# CreativeOS MCP Server (v2.0.0)

A production-ready Model Context Protocol (MCP) server for marketing agencies. It acts as a memory-powered creative intelligence layer, enabling AI agents (in Claude Code, Cursor, Gemini CLI, etc.) to perform market research, analyze competitors, generate high-converting copy (hooks, angles, creative concepts, UGC scripts), and save/retrieve campaigns from a **Supabase PostgreSQL database** using semantic vector search.

> **Tagline**: *Bring Your Own AI. We Provide The Memory.*

---

## Architecture Overview

```
                  AI Clients (Claude, Gemini CLI, Cursor, etc.)
                                       │
                         (Stdio / SSE) ├─────────────────────────┐
                                       ▼                         ▼
                              CreativeOS MCP            Next.js Dashboard
                                       │                    (Workspace UI)
                  ┌────────────────────┴────────────────────┐
                  ▼                                         ▼
         Google Gemini API                         Supabase Database
        (Content & Embeddings)                    (Tenancy & Vector Search)
```

- **Tenancy Isolation**: Runs on Express inside the backend. Uses `AsyncLocalStorage` to associate active SSE sessions with the correct authenticated workspace and pricing tier.
- **Proactive Memory Retrieval**: Before generating new hooks, angles, or briefs, the server searches Supabase for historical winning campaigns and passes them to the LLM to guide voice and effectiveness.
- **SaaS Limit Enforcement**: Validates workspace constraints on client count and saved assets dynamically before writing to the database.

---

## Tech Stack

- **MCP Server (Backend)**: Node.js, TypeScript, MCP SDK, Express, CORS, Supabase, Zod, Dotenv.
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

Install all backend dependencies:
```bash
npm install
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

*Note: If no database credentials are provided, the server falls back to an in-memory database with a native TypeScript cosine-similarity vector query engine so you can test connection instantly.*

### 3. Database Schema Migration

The tables have been automatically migrated to your database. For manual verification, you can run the [schema.sql](schema.sql) script inside the Supabase SQL Editor.

---

## How to Configure Your AI Client

To use CreativeOS MCP inside your AI assistant, configure it as an MCP server using your specific API key:

### 1. Claude Code
Add to `~/.config/claude.json` or run `claude config`:

```json
{
  "mcpServers": {
    "creativeos": {
      "command": "node",
      "args": ["/absolute/path/to/creativeos/dist/server.js"],
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
   - **Command**: `node /absolute/path/to/creativeos/dist/server.js`
4. Set environment variables:
   - `CREATIVEOS_API_KEY`: `cos_live_mockkey12345`
   - `GEMINI_API_KEY`: `YOUR_GEMINI_API_KEY`

### 3. Gemini CLI
Configure your global CLI settings:

```json
{
  "mcpServers": {
    "creativeos": {
      "command": "node",
      "args": ["/absolute/path/to/creativeos/dist/server.js"],
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
      "command": "node",
      "args": ["/absolute/path/to/creativeos/dist/server.js"],
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

## Secure Cloud Deployment (Railway)

We provide a direct [Dockerfile](Dockerfile) and [railway.json](railway.json) configuration for cloud deployment:

1. Link your repo to **Railway**.
2. Define the variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY`
   - `TRANSPORT=sse`
   - `PORT=3000`
3. Railway will start the server using Server-Sent Events (SSE) securely.
4. Point your local IDE settings to the web endpoint:
   - URL: `https://your-app.up.railway.app/sse`
   - Custom Header: `x-api-key: cos_live_mockkey12345`
