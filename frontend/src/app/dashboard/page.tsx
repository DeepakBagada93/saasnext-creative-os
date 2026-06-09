"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Users, 
  FileText, 
  Layers, 
  BrainCircuit, 
  TrendingUp, 
  ChevronRight,
  Sparkles,
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import { requestMcpApi } from "@/utils/mcpClient";

interface StatsData {
  workspaceName: string;
  plan: string;
  clientCount: number;
  clientMax: number;
  assetCount: number;
  assetMax: number;
  breakdown: {
    hooks: number;
    angles: number;
    concepts: number;
    winners: number;
  };
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestMcpApi<StatsData>("/api/stats");
      setStats(data);
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve database stats. Ensure the MCP server is active.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-950/40">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-400">Loading agency metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center max-w-md mx-auto">
        <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-6">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h3 className="font-display font-bold text-xl mb-2">Workspace Offline</h3>
        <p className="text-sm text-slate-400 leading-relaxed mb-6">
          {error || "We couldn't connect to the CreativeOS MCP backend server. Check settings or start your server."}
        </p>
        <button 
          onClick={fetchStats}
          className="px-5 py-2.5 bg-slate-900 border border-slate-800 hover:border-slate-700 font-semibold rounded-xl text-sm transition-all"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Calculate percentage progress for limit visualization
  const clientPercent = Math.min((stats.clientCount / stats.clientMax) * 100, 100);
  const assetPercent = Math.min((stats.assetCount / stats.assetMax) * 100, 100);

  const statsCards = [
    { name: "Active Clients", count: stats.clientCount, max: stats.clientMax, percent: clientPercent, icon: Users, color: "text-indigo-400" },
    { name: "Memory Assets", count: stats.assetCount, max: stats.assetMax, percent: assetPercent, icon: BrainCircuit, color: "text-purple-400" },
  ];

  return (
    <div className="p-8 sm:p-12 max-w-7xl w-full mx-auto flex flex-col gap-10">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/10 bg-indigo-950/20 text-xs font-semibold text-indigo-300 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            {stats.plan.toUpperCase()} Plan
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 tracking-tight">
            {stats.workspaceName}
          </h1>
          <p className="text-slate-400 text-sm mt-1">Creative agency intelligence dashboard & winner memory.</p>
        </div>

        <Link 
          href="/dashboard/tools"
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/15 flex items-center gap-2"
        >
          Creative Tools
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Usage Progress Cards */}
      <div className="grid md:grid-cols-2 gap-8">
        {statsCards.map((card) => {
          const Icon = card.icon;
          const isUnlimited = !isFinite(card.max);
          return (
            <div key={card.name} className="glass-panel p-8 rounded-3xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{card.name}</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-display font-extrabold text-3xl text-slate-200">{card.count}</span>
                    <span className="text-sm text-slate-500">/ {isUnlimited ? "Unlimited" : card.max}</span>
                  </div>
                </div>
                <div className={`h-12 w-12 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-center ${card.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>

              {/* Progress bar */}
              {!isUnlimited && (
                <div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500" 
                      style={{ width: `${card.percent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase">
                    <span>{Math.round(card.percent)}% Used</span>
                    <span>{card.max - card.count} remaining</span>
                  </div>
                </div>
              )}
              {isUnlimited && (
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 mt-2">
                  <TrendingUp className="h-4 w-4" />
                  Unlimited scaling enabled
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Breakdown Grid */}
      <div>
        <h3 className="font-display font-bold text-lg text-slate-300 mb-6">Workspace Asset Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          {[
            { label: "Hooks", count: stats.breakdown.hooks, icon: FileText, border: "hover:border-indigo-500/20" },
            { label: "Angles", count: stats.breakdown.angles, icon: TrendingUp, border: "hover:border-purple-500/20" },
            { label: "Concepts", count: stats.breakdown.concepts, icon: Layers, border: "hover:border-emerald-500/20" },
            { label: "Winner Campaigns", count: stats.breakdown.winners, icon: BrainCircuit, border: "hover:border-pink-500/20" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.label} 
                className={`glass-panel p-6 rounded-2xl text-center transition-all ${item.border}`}
              >
                <div className="h-10 w-10 mx-auto rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mb-4">
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span className="block text-2xl font-extrabold font-display text-slate-100">{item.count}</span>
                <span className="block text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Overview Footer Cta */}
      <div className="glass-panel p-8 rounded-3xl gradient-bg-indigo border-indigo-500/15 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div>
          <h3 className="font-display font-bold text-xl mb-2 text-indigo-200">CreativeOS Agency Moat</h3>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Your generated hooks, competitor insights, and winning scripts are stored securely inside your private Supabase memory layer. The memory stays yours, even if your underlying LLM model changes.
          </p>
        </div>
        <Link 
          href="/dashboard/winners"
          className="px-5 py-3 border border-indigo-500/20 hover:border-indigo-500/40 bg-indigo-950/20 text-indigo-300 hover:text-indigo-200 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 select-none"
        >
          Winners Memory Library
          <ChevronRight className="h-4.5 w-4.5" />
        </Link>
      </div>
    </div>
  );
}
