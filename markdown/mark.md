Build a production-ready MCP server called **CreativeOS MCP** for marketing agencies.

Goal:
Create an MCP that works with Gemini CLI, Claude Code, Cursor, Windsurf, Cline, and any MCP-compatible client.

Tech Stack:

* Node.js
* TypeScript
* MCP SDK
* Firebase Admin SDK
* Firestore
* Railway deployment
* Zod validation
* Environment variables
* Modular architecture

Project Structure:

* src/server.ts
* src/tools/
* src/services/
* src/prompts/
* src/types/
* src/utils/

Implement MCP tools:

1. market_research
   Input:

* product
* audience
* industry

Output:

* pain points
* desires
* fears
* objections
* buying triggers

2. competitor_analysis
   Input:

* competitor_urls

Output:

* positioning
* offers
* messaging
* strengths
* weaknesses

3. generate_hooks
   Input:

* product
* audience
* goal

Output:

* 100 categorized hooks
* curiosity
* pain
* authority
* contrarian
* urgency

4. generate_angles
   Input:

* product
* audience

Output:

* 50 marketing angles

5. generate_creative_concepts
   Input:

* product
* audience
* competitors

Output:

* 20 ad concepts
* hook
* angle
* creative brief
* CTA

6. generate_ugc_scripts
   Input:

* product
* audience

Output:

* 10 UGC video scripts

7. save_winner
   Store successful hooks, ads, angles, and campaigns in Firestore.

8. retrieve_winners
   Retrieve similar winning campaigns using semantic search and metadata filtering.

Requirements:

* Full MCP protocol support
* Tool descriptions optimized for AI agents
* Strong TypeScript types
* Error handling
* Logging
* Firebase integration
* Clean service layer
* Production-ready code
* Railway deployment configuration
* Dockerfile
* railway.json
* .env.example
* README.md
* MCP client configuration examples for Gemini CLI and Claude Code

Architecture:

AI Client
↓
CreativeOS MCP
↓
Firebase Memory Layer
↓
Creative Intelligence Engine
↓
Structured Response

Important:
Keep all business logic server-side. The MCP should act as a gateway to proprietary CreativeOS intelligence. Design for future SaaS monetization with API keys, usage tracking, team workspaces, and subscription plans.
