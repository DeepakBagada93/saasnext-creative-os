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

## Cloud Deployment Guide

### 1. Frontend Deployment (Vercel)
Next.js is fully optimized for Vercel. To deploy the frontend:
1. Connect your repository to **Vercel**.
2. Under **Project Settings**, configure the **Root Directory** to `frontend`.
3. In **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://your-supabase-url.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `your-anon-key`
4. Click **Deploy**. Vercel will build the Next.js static pages and serve it.

---

### 2. Backend Deployment (Railway, Render, or Fly.io)
The MCP backend runs as a standard Node.js server using a Docker container.
1. Connect your repository to **Railway**, **Render**, or **Fly.io**.
2. The platform will automatically detect the root [Dockerfile](Dockerfile).
3. Set the following environment variables:
   - `TRANSPORT` = `sse`
   - `PORT` = `3000`
   - `GEMINI_API_KEY` = `your-gemini-key`
   - `SUPABASE_URL` = `your-supabase-url`
   - `SUPABASE_ANON_KEY` = `your-supabase-anon-key`
4. Deploy the service. It will expose a public web address (e.g. `https://creativeos.onrender.com`).
5. Configure your IDE client to point to the SSE URL:
   - **Endpoint**: `https://your-backend-app.com/sse`
   - **Header**: `x-api-key`: `cos_live_mockkey12345` (or your custom API key)

---

### 3. AWS Deployment (AWS App Runner or ECS Fargate)
For enterprise hosting on AWS:

#### Option A: AWS App Runner (Recommended)
1. Push your built Docker container to **Amazon ECR** (Elastic Container Registry), or connect App Runner directly to your GitHub repository.
2. Configure App Runner settings:
   - **Runtime**: `Docker`
   - **Port**: `3000`
3. Add the required environment variables (`TRANSPORT=sse`, `PORT=3000`, `GEMINI_API_KEY`, etc.) in the App Runner console configuration.
4. Deploy. AWS will provision load balancers and secure endpoints automatically.

#### Option B: Amazon ECS (Fargate)
1. Build and push the docker image to ECR:
   ```bash
   docker build -t creativeos-mcp .
   docker tag creativeos-mcp:latest <ECR_REPO_URL>:latest
   docker push <ECR_REPO_URL>:latest
   ```
2. Create an ECS **Task Definition** using the **Fargate** launch type:
   - Memory: `0.5 GB` or `1 GB`
   - CPU: `0.25 vCPU` or `0.5 vCPU`
   - Map Port `3000` (TCP)
3. Set the environment variables in the container definition section.
4. Launch an ECS Service under an Application Load Balancer (ALB) to expose the service over HTTPS.

