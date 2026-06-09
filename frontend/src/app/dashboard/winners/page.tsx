"use client";

import React, { useState, useEffect } from "react";
import { Search, BrainCircuit, Users, Award, AlertCircle, Plus, ShieldCheck } from "lucide-react";
import { requestMcpApi } from "@/utils/mcpClient";

interface Client {
  id: string;
  name: string;
  industry: string;
}

interface Winner {
  id: string;
  client_id: string;
  content: any;
  score: number;
  similarity?: number;
  created_at: string;
}

export default function WinnersLibrary() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  
  // Loading & error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("");

  // Manual save states
  const [showAddForm, setShowAddForm] = useState(false);
  const [saveClientId, setSaveClientId] = useState("");
  const [saveType, setSaveType] = useState<"hook" | "ad" | "angle" | "campaign">("hook");
  const [saveContent, setSaveContent] = useState("");
  const [saveScore, setSaveScore] = useState(90);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch active clients
      const clientsData = await requestMcpApi<Client[]>("/api/clients");
      setClients(clientsData);

      // Fetch winners
      const winnersData = await requestMcpApi<Winner[]>("/api/winners");
      setWinners(winnersData);
    } catch (err) {
      console.error(err);
      setError("Unable to load library data. Verify that the server is active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let endpoint = `/api/winners?limit=20`;
      if (searchQuery) endpoint += `&query=${encodeURIComponent(searchQuery)}`;
      if (clientFilter) endpoint += `&client_id=${clientFilter}`;
      
      const results = await requestMcpApi<Winner[]>(endpoint);
      setWinners(results);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Search failed.");
    } finally {
      setLoading(false);
    }
  };

  // Run search automatically when filter changes
  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientFilter]);

  const handleManualSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      // Parse content as JSON if object-like, otherwise save string
      let parsedContent: any = saveContent;
      try {
        if (saveContent.trim().startsWith("{")) {
          parsedContent = JSON.parse(saveContent);
        }
      } catch {
        // save as raw string
      }

      await requestMcpApi("/api/winners", {
        method: "POST",
        body: JSON.stringify({
          client_id: saveClientId,
          type: saveType,
          content: typeof parsedContent === "string" ? { text: parsedContent } : parsedContent,
          score: saveScore,
        }),
      });

      setSaveSuccess("Winner logged to memory successfully!");
      setSaveContent("");
      setSaveClientId("");
      
      // Reload lists
      fetchData();
      setTimeout(() => setShowAddForm(false), 1500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Saving failed.");
    } finally {
      setSaving(false);
    }
  };

  // Helper to map client names
  const getClientName = (cid: string) => {
    const c = clients.find(x => x.id === cid);
    return c ? c.name : "Unknown Client";
  };

  return (
    <div className="p-8 sm:p-12 max-w-7xl w-full mx-auto flex flex-col gap-10">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 tracking-tight">
            Winners Library
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Query your historical campaigns and winners semantically via vector similarity matching.
          </p>
        </div>

        <button 
          onClick={() => {
            setShowAddForm(true);
            setSaveSuccess(null);
            setSaveError(null);
          }}
          className="px-5 py-3 bg-slate-900 hover:bg-slate-900/80 border border-slate-800 hover:border-slate-700 font-semibold rounded-xl text-sm transition-all flex items-center gap-2"
        >
          <Plus className="h-4.5 w-4.5 text-indigo-400" />
          Log Winner Manually
        </button>
      </div>

      {/* Query Bar Form */}
      <div className="glass-panel p-6 rounded-3xl border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="flex-1 w-full flex items-center relative">
          <Search className="absolute left-4 h-5 w-5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800/80 focus:border-indigo-500/50 focus:outline-none rounded-2xl text-sm text-slate-200 transition-all font-sans"
            placeholder="Search campaign memory semantically (e.g. 'hooks about workplace smile confidence')..."
          />
          <button 
            type="submit"
            className="absolute right-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl transition-all"
          >
            Vector Search
          </button>
        </form>

        <div className="w-full md:w-60 flex items-center gap-3 shrink-0">
          <Users className="h-4.5 w-4.5 text-slate-500" />
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none px-3 py-3 rounded-2xl text-sm text-slate-400 transition-all cursor-pointer font-semibold"
          >
            <option value="">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Results grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-xs text-slate-500">Executing vector similarity search...</p>
        </div>
      ) : winners.length === 0 ? (
        <div className="glass-panel p-16 rounded-3xl text-center border-slate-900/60 text-slate-500 text-sm">
          No matching winning assets discovered in database memory. Log some winners first or trigger copywriting generations!
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {winners.map((win) => {
            const isTextOnly = win.content.text && Object.keys(win.content).length === 1;
            return (
              <div 
                key={win.id} 
                className="glass-panel p-6 rounded-2xl flex flex-col justify-between border-slate-850 hover:border-slate-800 transition-all relative overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-950/45 border border-indigo-900/40 text-indigo-400 px-2 py-0.5 rounded-full">
                      {win.content.type || "campaign"}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold">
                      <Award className="h-4 w-4" />
                      Score: {win.score}
                    </div>
                  </div>

                  <p className="text-slate-200 text-sm leading-relaxed mb-6 italic select-all">
                    {isTextOnly ? win.content.text : JSON.stringify(win.content, null, 2)}
                  </p>
                </div>

                <div className="border-t border-slate-900 pt-4 flex flex-col gap-2 mt-auto">
                  <div className="flex justify-between items-center text-[10px] font-semibold uppercase text-slate-500">
                    <span>Client: {getClientName(win.client_id)}</span>
                    <span>{new Date(win.created_at).toLocaleDateString()}</span>
                  </div>
                  {win.similarity !== undefined && (
                    <div className="text-[9px] text-emerald-400 font-mono font-semibold">
                      Match Confidence: {Math.round(win.similarity * 100)}% Similarity
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manual save Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl p-8 border-slate-800/80">
            <h3 className="font-display font-bold text-xl mb-2">Log Successful Winner</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Add a high-converting hook, ad copy, or campaign to your database. CreativeOS will generate vector embedding for future matching.
            </p>

            <form onSubmit={handleManualSave} className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Client Portfolio</label>
                  <select
                    required
                    value={saveClientId}
                    onChange={(e) => setSaveClientId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-3 rounded-xl text-sm text-slate-300"
                  >
                    <option value="">Select client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Asset Type</label>
                  <select
                    value={saveType}
                    onChange={(e) => setSaveType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 px-3 py-3 rounded-xl text-sm text-slate-300"
                  >
                    <option value="hook">Hook</option>
                    <option value="ad">Ad Copy</option>
                    <option value="angle">Angle</option>
                    <option value="campaign">Campaign Winner</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Winner Content</label>
                <textarea
                  required
                  rows={4}
                  value={saveContent}
                  onChange={(e) => setSaveContent(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl text-sm font-mono transition-all text-slate-200"
                  placeholder="Enter hook text or copy content..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Performance Score (0 - 100)</label>
                <input
                  type="number"
                  required
                  min={0}
                  max={100}
                  value={saveScore}
                  onChange={(e) => setSaveScore(parseInt(e.target.value, 10))}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl text-sm transition-all text-slate-200"
                />
              </div>

              {saveError && (
                <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-400 text-xs leading-relaxed">
                  {saveError}
                </div>
              )}

              {saveSuccess && (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-emerald-400" />
                  {saveSuccess}
                </div>
              )}

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-300 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-semibold rounded-xl text-sm transition-all"
                >
                  {saving ? "Saving Winner..." : "Save to Database"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
