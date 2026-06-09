"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BrainCircuit, 
  Users, 
  Search, 
  Wrench, 
  Settings, 
  Activity, 
  Wifi, 
  WifiOff,
  Copy,
  Check,
  LayoutDashboard
} from "lucide-react";
import { getServerSettings, saveServerSettings, requestMcpApi } from "@/utils/mcpClient";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [serverUrl, setServerUrl] = useState("http://localhost:3000");
  const [apiKey, setApiKey] = useState("cos_live_mockkey12345");
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Connection states
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "checking">("checking");
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [workspacePlan, setWorkspacePlan] = useState<string | null>(null);

  // Load settings on mount
  useEffect(() => {
    const settings = getServerSettings();
    setServerUrl(settings.serverUrl);
    setApiKey(settings.apiKey);
  }, []);

  // Ping backend server to verify connection
  const checkConnection = async () => {
    setConnectionStatus("checking");
    try {
      const stats = await requestMcpApi<{ workspaceName: string; plan: string }>("/api/stats");
      setConnectionStatus("connected");
      setWorkspaceName(stats.workspaceName);
      setWorkspacePlan(stats.plan);
    } catch (err) {
      setConnectionStatus("disconnected");
      setWorkspaceName(null);
      setWorkspacePlan(null);
    }
  };

  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverUrl, apiKey]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveServerSettings(serverUrl, apiKey);
    setShowSettings(false);
    // Reloads window so other pages hook to the new settings
    window.location.reload();
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Nav list
  const navItems = [
    { name: "Overview", path: "/dashboard", icon: LayoutDashboard },
    { name: "Clients Manager", path: "/dashboard/clients", icon: Users },
    { name: "Winners Library", path: "/dashboard/winners", icon: Search },
    { name: "Creative Tools", path: "/dashboard/tools", icon: Wrench },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-slate-900/40 border-r border-slate-900 flex flex-col justify-between p-6 z-20">
        <div>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 mb-10 hover:opacity-80 transition-opacity">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center glow-indigo-subtle">
              <BrainCircuit className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="font-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-indigo-200 to-indigo-400 bg-clip-text text-transparent">
              CreativeOS
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/15" 
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Server Status & Settings trigger */}
        <div className="border-t border-slate-900 pt-6 flex flex-col gap-4">
          <div className="flex items-center justify-between bg-slate-950/40 border border-slate-900 p-3 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className={`h-2.5 w-2.5 rounded-full ${
                connectionStatus === "connected" 
                  ? "bg-emerald-500 shadow-md shadow-emerald-500/50" 
                  : connectionStatus === "disconnected" 
                    ? "bg-rose-500 shadow-md shadow-rose-500/50" 
                    : "bg-amber-500 animate-pulse"
              }`}></div>
              <div className="text-xs">
                <p className="font-semibold text-slate-300">
                  {connectionStatus === "connected" ? "Connected" : connectionStatus === "disconnected" ? "Offline" : "Connecting..."}
                </p>
                {workspaceName && <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{workspaceName}</p>}
              </div>
            </div>
            
            <button 
              onClick={() => checkConnection()}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 text-slate-400 hover:text-slate-200 transition-all"
              title="Refresh connection status"
            >
              <Activity className="h-3.5 w-3.5" />
            </button>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            className="w-full px-4 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-slate-300 hover:text-white"
          >
            <Settings className="h-4.5 w-4.5 text-indigo-400" />
            Server Settings
          </button>
        </div>
      </aside>

      {/* Main panel */}
      <main className="flex-1 overflow-y-auto flex flex-col relative z-10">
        {children}
      </main>

      {/* Overlay Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-8 border-slate-800/80">
            <h3 className="font-display font-bold text-xl mb-2">MCP Server Configuration</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Connect the frontend interface to your running local or cloud CreativeOS MCP Server.
            </p>

            <form onSubmit={handleSaveSettings} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">MCP Server URL</label>
                <input
                  type="url"
                  required
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl text-sm transition-all"
                  placeholder="e.g. http://localhost:3000"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">CreativeOS API Key</label>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl text-sm font-mono text-indigo-300 transition-all"
                  placeholder="e.g. cos_live_xxxxx"
                />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="flex-1 py-3 border border-slate-800 hover:border-slate-700 bg-slate-900/30 text-slate-300 font-semibold rounded-xl text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/20"
                >
                  Save & Connect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
