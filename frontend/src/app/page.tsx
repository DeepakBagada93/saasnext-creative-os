"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  BrainCircuit, 
  Search, 
  TrendingUp, 
  FileText, 
  Layers, 
  ChevronRight, 
  ArrowRight, 
  Settings, 
  Check, 
  Play, 
  Code,
  ShieldCheck
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"research" | "hooks" | "concepts" | "memory">("research");

  // Simulated Tool Demos
  const demos = {
    research: {
      input: { product: "Orthodontic Aligners", audience: "Adults 25-40", industry: "Dentistry" },
      output: {
        pain_points: [
          "Embarrassment of wearing traditional wire braces at work meetings.",
          "High upfront costs and unclear financing options."
        ],
        buying_triggers: [
          "Upcoming major life event (wedding, public speaking, promotion).",
          "Seeing a peer get aligners and talk about the ease of use."
        ]
      }
    },
    hooks: {
      input: { product: "Orthodontic Aligners", audience: "Adults 25-40", goal: "Book Free Consultation" },
      output: {
        curiosity: [
          "Why adults are ditching dental wire and doing this instead...",
          "The secret to a perfect smile without anyone noticing you're fixing it."
        ],
        pain: [
          "Still hiding your teeth in business Zoom calls? Read this.",
          "Hate wire braces but want straight teeth? Here is the adult alternative."
        ]
      }
    },
    concepts: {
      input: { product: "Orthodontic Aligners", audience: "Adults 25-40" },
      output: [
        {
          hook: "Show a professional closing their laptop and smiling wide.",
          angle: "Confidence in the Workplace",
          creative_brief: "Video opens on a zoom call. Creator speaks confidently, then points to clear aligners. Cut to product zoom.",
          cta: "Tap to book your clear aligner consultation."
        }
      ]
    },
    memory: {
      query: "dental clinic workplace confidence",
      results: [
        {
          id: "win_92a18b",
          type: "hook",
          content: "Why 35-year-old managers are suddenly wearing clear aligners to board meetings.",
          score: 94,
          similarity: "0.89 (Cosine Similarity)"
        }
      ]
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 font-sans text-slate-100 overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-800/60 bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-indigo-subtle">
              <BrainCircuit className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              CreativeOS
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-indigo-400 transition-colors">Features</a>
            <a href="#playground" className="hover:text-indigo-400 transition-colors">Playground</a>
            <a href="#pricing" className="hover:text-indigo-400 transition-colors">Pricing</a>
            <a href="#docs" className="hover:text-indigo-400 transition-colors">Client Setup</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="px-4 py-2 text-sm font-semibold text-slate-200 hover:text-white border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 rounded-xl transition-all flex items-center gap-2"
            >
              Dashboard
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Glow backdrop */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none glow-indigo"></div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-950/30 text-xs font-semibold text-indigo-300 mb-8 select-none">
          <Sparkles className="h-3.5 w-3.5" />
          Model Context Protocol (MCP) Server
        </div>

        <h1 className="font-display font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.1] mb-6 max-w-4xl text-slate-100">
          Bring Your Own AI. <br />
          <span className="gradient-text">We Provide The Memory.</span>
        </h1>

        <p className="text-base sm:text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
          The creative memory layer for marketing agencies. Connect your AI models directly to historical campaign winners, customer research, and hook performance using Supabase vector indexing.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link 
            href="/dashboard" 
            className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 group shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/45 border border-indigo-400/20"
          >
            Launch Agency Dashboard
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#playground" 
            className="w-full sm:w-auto px-8 py-4 border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900/90 text-slate-300 hover:text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            See Live Demo
            <Play className="h-4 w-4 text-indigo-400" />
          </a>
        </div>
      </section>

      {/* Trust banner */}
      <section className="py-12 border-y border-slate-900/80 bg-slate-950/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-6">Works out of the box with major clients</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 text-slate-400 font-display font-bold text-sm tracking-wide">
            <span className="hover:text-slate-300 cursor-default transition-colors">Claude Code</span>
            <span className="hover:text-slate-300 cursor-default transition-colors">Gemini CLI</span>
            <span className="hover:text-slate-300 cursor-default transition-colors">Cursor</span>
            <span className="hover:text-slate-300 cursor-default transition-colors">Windsurf</span>
            <span className="hover:text-slate-300 cursor-default transition-colors">Cline</span>
            <span className="hover:text-slate-300 cursor-default transition-colors">Roo Code</span>
          </div>
        </div>
      </section>

      {/* Feature section */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-4">The Creative Intelligence Moat</h2>
          <p className="text-slate-400 max-w-xl mx-auto">AI models change. Your agency’s memory and historical winning knowledge should stay with you.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-xl mb-3 text-slate-200">Winner Memory</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Log winning ads, hook metrics, and angle performance in a dedicated Supabase database. Retrieve them instantly for new briefs.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <Search className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-xl mb-3 text-slate-200">Semantic Vector Querying</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Find related historical winning copy. The system translates queries into vector space to pull contextual matches.
            </p>
          </div>

          <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden">
            <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="font-display font-bold text-xl mb-3 text-slate-200">SaaS Plan Enforcements</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Configure agency API keys. Enforce limits on active clients and saved assets directly at the MCP routing gateway.
            </p>
          </div>
        </div>
      </section>

      {/* Playground / Interactive Shell */}
      <section id="playground" className="py-20 px-6 bg-slate-900/30 border-y border-slate-900/60">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-950/20 text-xs font-semibold text-indigo-400 mb-6">
              Interactive Demo
            </div>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl mb-6 leading-tight">
              MCP Tools in Action
            </h2>
            <p className="text-slate-400 leading-relaxed mb-8">
              Explore how CreativeOS processes client instructions, searches the memory database, generates copywriting, and logs outputs back to Supabase.
            </p>

            {/* Tab select list */}
            <div className="flex flex-col gap-3">
              {[
                { id: "research", title: "Market Research", icon: Search, desc: "Pain points, triggers, objections" },
                { id: "hooks", title: "Hook Engine", icon: FileText, desc: "100 categorized hooks generator" },
                { id: "concepts", title: "Creative Concepts", icon: Layers, desc: "20 multi-platform ad angles" },
                { id: "memory", title: "Winner Library Search", icon: BrainCircuit, desc: "Semantic vector similarity queries" },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                      active 
                        ? "bg-slate-900/80 border-indigo-500/40 text-slate-100 glow-indigo-subtle" 
                        : "bg-slate-950/20 border-slate-800/40 hover:border-slate-700/60 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${
                      active ? "bg-indigo-600 border-indigo-400 text-white" : "bg-slate-950 border-slate-800 text-slate-400"
                    }`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{tab.title}</h4>
                      <p className="text-xs text-slate-500">{tab.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive UI Screen */}
          <div className="lg:col-span-7">
            <div className="glass-panel rounded-3xl overflow-hidden shadow-2xl border-slate-800/80">
              <div className="bg-slate-900/95 px-6 py-3 border-b border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500"></div>
                  <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                  <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono font-semibold">
                  <Code className="h-3.5 w-3.5 text-indigo-500" />
                  tool_execution.json
                </div>
              </div>

              <div className="p-6 font-mono text-xs overflow-y-auto max-h-[420px] bg-slate-950/90 text-slate-300">
                {activeTab === "research" && (
                  <div>
                    <span className="text-slate-500">// Executing mcp.tool("market_research", arguments)</span>
                    <pre className="text-indigo-400 mt-2">{JSON.stringify(demos.research.input, null, 2)}</pre>
                    <div className="my-4 border-t border-slate-800/80"></div>
                    <span className="text-emerald-400 font-semibold">// Output:</span>
                    <pre className="text-slate-300 mt-2">{JSON.stringify(demos.research.output, null, 2)}</pre>
                  </div>
                )}
                {activeTab === "hooks" && (
                  <div>
                    <span className="text-slate-500">// Executing mcp.tool("generate_hooks", arguments)</span>
                    <pre className="text-indigo-400 mt-2">{JSON.stringify(demos.hooks.input, null, 2)}</pre>
                    <div className="my-4 border-t border-slate-800/80"></div>
                    <span className="text-emerald-400 font-semibold">// Generated 100 hooks. Sample output:</span>
                    <pre className="text-slate-300 mt-2">{JSON.stringify(demos.hooks.output, null, 2)}</pre>
                  </div>
                )}
                {activeTab === "concepts" && (
                  <div>
                    <span className="text-slate-500">// Executing mcp.tool("generate_creative_concepts", arguments)</span>
                    <pre className="text-indigo-400 mt-2">{JSON.stringify(demos.concepts.input, null, 2)}</pre>
                    <div className="my-4 border-t border-slate-800/80"></div>
                    <span className="text-emerald-400 font-semibold">// Generated 20 concepts. Sample concept:</span>
                    <pre className="text-slate-300 mt-2">{JSON.stringify(demos.concepts.output, null, 2)}</pre>
                  </div>
                )}
                {activeTab === "memory" && (
                  <div>
                    <span className="text-slate-500">// Executing mcp.tool("retrieve_winners", query)</span>
                    <pre className="text-indigo-400 mt-2">{`{ query: "${demos.memory.query}" }`}</pre>
                    <div className="my-4 border-t border-slate-800/80"></div>
                    <span className="text-emerald-400 font-semibold">// Vector Search results from Supabase (pgvector Match):</span>
                    <pre className="text-slate-300 mt-2">{JSON.stringify(demos.memory.results, null, 2)}</pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Grid */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl sm:text-4xl mb-4">Flexible Plans for Growing Agencies</h2>
          <p className="text-slate-400 max-w-md mx-auto">Select a subscription plan that fits your active client portfolio and asset storage needs.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {/* Free */}
          <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between border-slate-800">
            <div>
              <h3 className="font-display font-bold text-xl text-slate-200 mb-2">Free</h3>
              <p className="text-xs text-slate-400 mb-6">Perfect for solo copywriters and testers</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-display font-extrabold text-4xl">$0</span>
                <span className="text-sm text-slate-400">/mo</span>
              </div>
              <div className="border-t border-slate-800/60 my-6"></div>
              <ul className="flex flex-col gap-4 text-sm text-slate-300">
                <li className="flex items-center gap-3"><Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> 3 Active Clients</li>
                <li className="flex items-center gap-3"><Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> 100 Saved Assets</li>
                <li className="flex items-center gap-3"><Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> Full MCP Access</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8 w-full py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-center font-semibold rounded-2xl transition-all">
              Get Started
            </Link>
          </div>

          {/* Agency */}
          <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between border-indigo-500/40 relative glow-indigo-subtle">
            <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full bg-indigo-600 text-xs font-semibold text-white">
              RECOMMENDED
            </div>
            <div>
              <h3 className="font-display font-bold text-xl text-slate-200 mb-2">Agency</h3>
              <p className="text-xs text-slate-400 mb-6">Built for growing marketing agencies</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-display font-extrabold text-4xl text-indigo-200">$99</span>
                <span className="text-sm text-slate-400">/mo</span>
              </div>
              <div className="border-t border-indigo-500/25 my-6"></div>
              <ul className="flex flex-col gap-4 text-sm text-slate-300">
                <li className="flex items-center gap-3"><Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> 25 Active Clients</li>
                <li className="flex items-center gap-3"><Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> 5,000 Saved Assets</li>
                <li className="flex items-center gap-3"><Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> Winner Memory Storage</li>
                <li className="flex items-center gap-3"><Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> Vector Similarity Querying</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8 w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-center font-semibold rounded-2xl transition-all shadow-md shadow-indigo-600/20">
              Upgrade to Agency
            </Link>
          </div>

          {/* Scale */}
          <div className="glass-panel p-8 rounded-3xl flex flex-col justify-between border-slate-800">
            <div>
              <h3 className="font-display font-bold text-xl text-slate-200 mb-2">Scale</h3>
              <p className="text-xs text-slate-400 mb-6">For large agencies running high volume</p>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="font-display font-extrabold text-4xl">$299</span>
                <span className="text-sm text-slate-400">/mo</span>
              </div>
              <div className="border-t border-slate-800/60 my-6"></div>
              <ul className="flex flex-col gap-4 text-sm text-slate-300">
                <li className="flex items-center gap-3"><Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> Unlimited Clients</li>
                <li className="flex items-center gap-3"><Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> Unlimited Assets</li>
                <li className="flex items-center gap-3"><Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> Team Workspaces</li>
                <li className="flex items-center gap-3"><Check className="h-4.5 w-4.5 text-indigo-400 shrink-0" /> Priority API Latency</li>
              </ul>
            </div>
            <Link href="/dashboard" className="mt-8 w-full py-3 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-center font-semibold rounded-2xl transition-all">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Docs / Connect block */}
      <section id="docs" className="py-20 px-6 max-w-4xl mx-auto border-t border-slate-900/60">
        <h2 className="font-display font-bold text-2xl sm:text-3xl mb-6 text-center">Integrating the MCP Server</h2>
        <p className="text-slate-400 text-sm mb-8 text-center leading-relaxed">
          Configure CreativeOS inside your local AI editor or CLI client configuration. Replace keys with your workspace api key.
        </p>

        <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800/60 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-4 w-4 text-indigo-400" />
            <span className="text-xs text-slate-400 font-mono font-semibold">claude_desktop_config.json / mcp_config.json</span>
          </div>
          <pre className="font-mono text-xs text-slate-300 overflow-x-auto p-4 bg-slate-950 rounded-2xl leading-relaxed">
{`{
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
}`}
          </pre>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-900/60 bg-slate-950 mt-auto text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <span>&copy; {new Date().getFullYear()} CreativeOS. All rights reserved.</span>
          <div className="flex gap-6 text-slate-500">
            <a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-indigo-400 transition-colors">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
