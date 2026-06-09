# CreativeOS MCP

## Tagline

**Bring Your Own AI. We Provide The Memory.**

A memory-powered MCP for marketing agencies that works with:

* Gemini CLI
* Claude Code
* Cursor
* Windsurf
* Cline
* Roo Code

---

# Problem

Agencies lose valuable knowledge:

* Winning hooks
* Winning ads
* Winning angles
* Competitor insights
* Client research

Everything stays scattered across chats and documents.

---

# Solution

CreativeOS MCP becomes the agency's creative memory layer.

```text
AI Client
(Gemini CLI / Claude Code)
            ↓
      CreativeOS MCP
            ↓
      Creative Memory
            ↓
        Supabase
```

---

# Core Features

### Market Research

Generate:

* Pain Points
* Desires
* Fears
* Objections
* Buying Triggers

---

### Competitor Intelligence

Extract:

* Positioning
* Offers
* Messaging
* Weaknesses

---

### Hook Engine

Generate and store:

* Curiosity Hooks
* Pain Hooks
* Authority Hooks
* Contrarian Hooks
* Urgency Hooks

---

### Angle Engine

Generate:

* Awareness Angles
* Pain Angles
* Desire Angles
* Offer Angles

---

### Creative Concepts

Generate:

* Meta Ads
* Google Ads
* LinkedIn Ads
* Video Concepts
* Campaign Ideas

---

### UGC Engine

Generate:

* Testimonial Scripts
* Founder Stories
* Customer Stories
* Problem/Solution Videos

---

### Winner Memory

Save:

* Winning Hooks
* Winning Ads
* Winning Campaigns
* Winning Angles

Retrieve them later for new campaigns.

---

# MCP Tools

```text
market_research
competitor_analysis
generate_hooks
generate_angles
generate_creative_concepts
generate_ugc_scripts
save_winner
retrieve_winners
```

---

# Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* Tailwind
* Shadcn UI

## Backend

* Node.js
* TypeScript
* MCP SDK
* Express

## Database

* Supabase PostgreSQL
* Supabase Auth
* Supabase Storage

## Deployment

* Vercel (Frontend)
* Railway (MCP Server)

---

# Authentication

Each agency receives:

```env
CREATIVEOS_API_KEY=cos_live_xxxxx
```

MCP validates:

* API Key
* Workspace
* Subscription
* Memory Limits

---

# Database

### Workspaces

```text
id
name
plan
```

### Clients

```text
id
workspace_id
name
industry
```

### Hooks

```text
id
client_id
hook
category
```

### Angles

```text
id
client_id
angle
```

### Concepts

```text
id
client_id
concept
```

### Winners

```text
id
client_id
content
score
```

---

# Pricing

## Free

* 3 Clients
* 100 Saved Assets

$0/mo

---

## Agency

* 25 Clients
* 5,000 Assets
* Winner Memory

$99/mo

---

## Scale

* Unlimited Clients
* Unlimited Assets
* Team Workspaces

$299/mo

---

# Example Workflow

Agency connects:

```json
{
  "creativeos": {
    "url": "https://creativeos.up.railway.app/mcp",
    "headers": {
      "x-api-key": "cos_live_xxxxx"
    }
  }
}
```

Prompt:

```text
Generate 50 hooks for a dentist clinic.
```

CreativeOS:

1. Researches market
2. Searches agency memory
3. Finds winning dental campaigns
4. Generates improved hooks
5. Saves outputs to memory

---

# Moat

Competitors sell AI generation.

CreativeOS sells:

* Agency Memory
* Creative Intelligence
* Historical Winners
* Campaign Knowledge

The AI model can change.

The memory stays with CreativeOS.
