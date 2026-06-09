"use client";

import React, { useState, useEffect } from "react";
import { Wrench, Sparkles, AlertCircle, FileText, Layers, TrendingUp, Award, Check } from "lucide-react";
import { requestMcpApi } from "@/utils/mcpClient";

interface Client {
  id: string;
  name: string;
  industry: string;
}

export default function CreativeTools() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Selector states
  const [selectedClientId, setSelectedClientId] = useState("");
  const [activeTool, setActiveTool] = useState<"hooks" | "angles" | "concepts" | "ugc">("hooks");

  // Form input fields
  const [product, setProduct] = useState("");
  const [audience, setAudience] = useState("");
  const [goal, setGoal] = useState(""); // Hooks only
  const [competitors, setCompetitors] = useState(""); // Concepts only

  // Generator execution states
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  
  // Results structures
  const [hooksResult, setHooksResult] = useState<any | null>(null);
  const [anglesResult, setAnglesResult] = useState<any[] | null>(null);
  const [conceptsResult, setConceptsResult] = useState<any[] | null>(null);
  const [ugcResult, setUgcResult] = useState<any[] | null>(null);

  // Keep track of which individual items were saved as winners
  const [savedWinnersMap, setSavedWinnersMap] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoadingClients(true);
        const data = await requestMcpApi<Client[]>("/api/clients");
        setClients(data);
        if (data.length > 0) {
          setSelectedClientId(data[0].id);
        }
      } catch (err) {
        console.error(err);
        setGeneralError("Database offline. Start the server and configure credentials.");
      } finally {
        setLoadingClients(false);
      }
    };
    loadClients();
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setGenError(null);
    setHooksResult(null);
    setAnglesResult(null);
    setConceptsResult(null);
    setUgcResult(null);
    setSavedWinnersMap({});

    try {
      const endpoint = `/api/generate/${activeTool}`;
      const payload: any = { product, audience, client_id: selectedClientId };
      if (activeTool === "hooks") payload.goal = goal;
      if (activeTool === "concepts") payload.competitors = competitors ? competitors.split(",").map(c => c.trim()) : [];

      const result = await requestMcpApi<any>(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (activeTool === "hooks") setHooksResult(result);
      if (activeTool === "angles") setAnglesResult(result.angles || []);
      if (activeTool === "concepts") setConceptsResult(result.concepts || []);
      if (activeTool === "ugc") setUgcResult(result.scripts || []);
    } catch (err) {
      console.error(err);
      setGenError(err instanceof Error ? err.message : "Generation failed.");
    } finally {
      setGenerating(false);
    }
  };

  const saveToWinners = async (itemKey: string, type: string, itemContent: any) => {
    try {
      await requestMcpApi("/api/winners", {
        method: "POST",
        body: JSON.stringify({
          client_id: selectedClientId,
          type,
          content: typeof itemContent === "string" ? { text: itemContent } : itemContent,
          score: 95,
        }),
      });
      setSavedWinnersMap(prev => ({ ...prev, [itemKey]: true }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to log winner.");
    }
  };

  if (loadingClients) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-950/40">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-400">Loading creative engine...</p>
      </div>
    );
  }

  if (generalError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto">
        <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="font-display font-bold text-xl mb-2">Workspace Required</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          {generalError}
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 sm:p-12 max-w-7xl w-full mx-auto flex flex-col gap-10">
      
      {/* Title */}
      <div>
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 tracking-tight">
          Creative Tools Hub
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Trigger hook engine, angles generator, and UGC scripting models with historical memory guidance.
        </p>
      </div>

      {/* Grid selector */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        
        {/* Left column: Tool and parameters selector */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-3xl border-slate-800">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Select Target Client</h3>
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 px-3 py-3 rounded-xl text-sm text-slate-300 font-semibold"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.industry})</option>
              ))}
            </select>
          </div>

          <div className="glass-panel p-6 rounded-3xl border-slate-800 flex flex-col gap-2">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Select Tool Model</h3>
            {[
              { id: "hooks", name: "100 Hooks Engine", icon: FileText },
              { id: "angles", name: "50 Angles Engine", icon: TrendingUp },
              { id: "concepts", name: "20 Ad Concepts", icon: Layers },
              { id: "ugc", name: "10 UGC Scripts", icon: Sparkles },
            ].map((tool) => {
              const Icon = tool.icon;
              const active = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id as any);
                    setHooksResult(null);
                    setAnglesResult(null);
                    setConceptsResult(null);
                    setUgcResult(null);
                    setGenError(null);
                  }}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold text-left transition-all ${
                    active 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {tool.name}
                </button>
              );
            })}
          </div>

          {/* Form Parameters */}
          <div className="glass-panel p-6 rounded-3xl border-slate-800">
            <h3 className="font-display font-bold text-sm uppercase tracking-wider text-slate-400 mb-4">Parameters</h3>
            
            <form onSubmit={handleGenerate} className="flex flex-col gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Product Description</label>
                <textarea
                  required
                  rows={3}
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl text-xs text-slate-300"
                  placeholder="e.g. Invisible orthodontic clear aligners for adults..."
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Target Audience</label>
                <input
                  type="text"
                  required
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl text-xs text-slate-300"
                  placeholder="e.g. Professionals age 25-40"
                />
              </div>

              {activeTool === "hooks" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Marketing Goal</label>
                  <input
                    type="text"
                    required
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl text-xs text-slate-300"
                    placeholder="e.g. Book free dental scan"
                  />
                </div>
              )}

              {activeTool === "concepts" && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Competitor URLs (comma-separated)</label>
                  <input
                    type="text"
                    value={competitors}
                    onChange={(e) => setCompetitors(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl text-xs text-slate-300"
                    placeholder="e.g. byte.com, candidco.com"
                  />
                </div>
              )}

              {genError && (
                <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-400 text-xs leading-normal">
                  {genError}
                </div>
              )}

              <button
                type="submit"
                disabled={generating}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 select-none shadow-md shadow-indigo-600/10"
              >
                {generating ? (
                  <>
                    <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Generating Memory Copy...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4" />
                    Trigger Generator
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Output Terminal */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-panel min-h-[400px] rounded-3xl overflow-hidden border-slate-800 flex flex-col">
            <div className="px-8 py-5 bg-slate-900/40 border-b border-slate-850 flex items-center justify-between shrink-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Model Output Terminal</span>
              <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest font-bold">
                {generating ? "running..." : "idle"}
              </span>
            </div>

            {/* Terminal Body */}
            <div className="flex-1 p-8 overflow-y-auto max-h-[700px]">
              {generating && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-500 text-sm">
                  <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                  <span>1. Researches target market triggers...</span>
                  <span className="text-xs text-slate-600 mt-1">2. Scanning Supabase agency memory for high cosine matches...</span>
                </div>
              )}

              {!generating && !hooksResult && !anglesResult && !conceptsResult && !ugcResult && (
                <div className="h-full flex flex-col items-center justify-center text-center py-20 text-slate-500 text-sm leading-relaxed">
                  <Wrench className="h-12 w-12 text-slate-700 mb-4 animate-pulse" />
                  Fill in the parameters and trigger the generator to render structured marketing copy.
                </div>
              )}

              {/* 100 Hooks Engine Result Render */}
              {!generating && hooksResult && (
                <div className="flex flex-col gap-8">
                  {(["curiosity", "pain", "authority", "contrarian", "urgency"] as const).map((cat) => {
                    const list = hooksResult[cat] || [];
                    return (
                      <div key={cat} className="flex flex-col gap-3">
                        <h4 className="font-display font-extrabold text-sm uppercase tracking-wider text-indigo-300 border-b border-slate-800/80 pb-2">
                          {cat} Hooks ({list.length})
                        </h4>
                        <div className="flex flex-col gap-2">
                          {list.map((hookStr: string, idx: number) => {
                            const key = `hook_${cat}_${idx}`;
                            const isSaved = !!savedWinnersMap[key];
                            return (
                              <div key={idx} className="flex justify-between items-center bg-slate-950/40 hover:bg-slate-950/80 p-3.5 rounded-xl border border-slate-900 group">
                                <span className="text-slate-300 text-sm leading-relaxed">{hookStr}</span>
                                <button
                                  onClick={() => saveToWinners(key, "hook", hookStr)}
                                  disabled={isSaved}
                                  className={`ml-4 shrink-0 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
                                    isSaved 
                                      ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" 
                                      : "bg-slate-900 border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200"
                                  }`}
                                >
                                  {isSaved ? <Check className="h-3 w-3" /> : <Award className="h-3 w-3" />}
                                  {isSaved ? "Saved" : "Save Winner"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 50 Angles Engine Result Render */}
              {!generating && anglesResult && anglesResult.length > 0 && (
                <div className="flex flex-col gap-4">
                  {anglesResult.map((a: any, idx: number) => {
                    const key = `angle_${idx}`;
                    const isSaved = !!savedWinnersMap[key];
                    return (
                      <div key={idx} className="flex justify-between items-center bg-slate-950/40 hover:bg-slate-950/80 p-4 rounded-xl border border-slate-900 group">
                        <div>
                          <h5 className="font-bold text-slate-200 text-sm">{a.name}</h5>
                          <p className="text-slate-400 text-xs mt-1 leading-relaxed">{a.angle}</p>
                        </div>
                        <button
                          onClick={() => saveToWinners(key, "angle", { title: a.name, text: a.angle })}
                          disabled={isSaved}
                          className={`ml-6 shrink-0 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
                            isSaved 
                              ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" 
                              : "bg-slate-900 border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          {isSaved ? <Check className="h-3 w-3" /> : <Award className="h-3 w-3" />}
                          {isSaved ? "Saved" : "Save Winner"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 20 Ad Concepts Result Render */}
              {!generating && conceptsResult && conceptsResult.length > 0 && (
                <div className="grid md:grid-cols-2 gap-6">
                  {conceptsResult.map((c: any, idx: number) => {
                    const key = `concept_${idx}`;
                    const isSaved = !!savedWinnersMap[key];
                    return (
                      <div key={idx} className="bg-slate-950/40 p-5 rounded-xl border border-slate-900 flex flex-col justify-between hover:border-slate-800 transition-all">
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-950/30 px-2 py-0.5 rounded">
                              Concept #{idx + 1}
                            </span>
                            <button
                              onClick={() => saveToWinners(key, "ad", c)}
                              disabled={isSaved}
                              className={`px-2.5 py-1 rounded-lg border text-[9px] font-bold transition-all flex items-center gap-1 ${
                                isSaved 
                                  ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" 
                                  : "bg-slate-900 border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              {isSaved ? <Check className="h-2.5 w-2.5" /> : <Award className="h-2.5 w-2.5" />}
                              {isSaved ? "Saved" : "Save Winner"}
                            </button>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold uppercase text-slate-500">Hook Trigger</span>
                            <p className="text-slate-300 text-xs leading-normal mt-0.5 font-sans italic">"{c.hook}"</p>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold uppercase text-slate-500">Marketing Angle</span>
                            <p className="text-slate-300 text-xs leading-normal mt-0.5">{c.angle}</p>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold uppercase text-slate-500">Brief Sequence</span>
                            <p className="text-slate-400 text-xs leading-relaxed mt-0.5">{c.creative_brief}</p>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold uppercase text-slate-500">CTA</span>
                            <p className="text-slate-200 text-xs leading-normal mt-0.5 font-bold">{c.cta}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 10 UGC Scripts Result Render */}
              {!generating && ugcResult && ugcResult.length > 0 && (
                <div className="flex flex-col gap-8">
                  {ugcResult.map((s: any, idx: number) => {
                    const key = `ugc_${idx}`;
                    const isSaved = !!savedWinnersMap[key];
                    return (
                      <div key={idx} className="bg-slate-950/40 p-6 rounded-2xl border border-slate-900 flex flex-col gap-4">
                        <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                          <h5 className="font-bold text-indigo-300 text-sm">UGC Script #{idx + 1}: {s.title}</h5>
                          <button
                            onClick={() => saveToWinners(key, "campaign", s)}
                            disabled={isSaved}
                            className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all flex items-center gap-1 ${
                              isSaved 
                                ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400" 
                                : "bg-slate-900 border-slate-800 hover:border-indigo-500/40 text-slate-400 hover:text-slate-200"
                            }`}
                          >
                            {isSaved ? <Check className="h-3 w-3" /> : <Award className="h-3 w-3" />}
                            {isSaved ? "Saved" : "Save Winner"}
                          </button>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Opening Visual Hook</span>
                          <p className="text-slate-300 text-xs mt-1 leading-normal italic font-sans">"{s.visual_hook}"</p>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">Script Dialogue & Cues</span>
                          <pre className="text-slate-400 text-xs leading-relaxed mt-2 whitespace-pre-wrap font-sans bg-slate-950/50 p-4 rounded-xl border border-slate-900/60">
                            {s.script_body}
                          </pre>
                        </div>
                        <div>
                          <span className="block text-[10px] font-semibold uppercase text-slate-500">CTA</span>
                          <p className="text-slate-200 text-xs font-bold mt-1 leading-normal">{s.cta}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
