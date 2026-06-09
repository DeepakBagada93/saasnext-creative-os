"use client";

import React, { useState, useEffect } from "react";
import { Users, Plus, ShieldCheck, AlertCircle } from "lucide-react";
import { requestMcpApi } from "@/utils/mcpClient";

interface Client {
  id: string;
  workspace_id: string;
  name: string;
  industry: string;
  created_at: string;
}

export default function ClientsManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await requestMcpApi<Client[]>("/api/clients");
      setClients(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load clients. Check your server status.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleRegisterClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setSuccessMsg(null);

    try {
      const newClient = await requestMcpApi<Client>("/api/clients", {
        method: "POST",
        body: JSON.stringify({ name, industry }),
      });

      setSuccessMsg(`Client '${newClient.name}' registered successfully!`);
      setName("");
      setIndustry("");
      // Reload clients
      fetchClients();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && clients.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-950/40">
        <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-400">Loading client portfolios...</p>
      </div>
    );
  }

  return (
    <div className="p-8 sm:p-12 max-w-7xl w-full mx-auto grid lg:grid-cols-12 gap-10">
      
      {/* Title section */}
      <div className="lg:col-span-12">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-slate-100 tracking-tight">
          Clients Manager
        </h1>
        <p className="text-slate-400 text-sm mt-1">Register and organize client brands in your agency workspace memory.</p>
        {error && (
          <div className="mt-6 p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-400 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>

      {/* Left Column: Register New Client Form */}
      <div className="lg:col-span-4">
        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Plus className="h-5 w-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-slate-200">New Client Portfolio</h3>
          </div>

          <form onSubmit={handleRegisterClient} className="flex flex-col gap-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Company / Brand Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl text-sm transition-all text-slate-100"
                placeholder="e.g. Smile Dental Clinic"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Niche / Industry</label>
              <input
                type="text"
                required
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500/50 focus:outline-none rounded-xl text-sm transition-all text-slate-100"
                placeholder="e.g. Dentistry"
              />
            </div>

            {formError && (
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-400 text-xs leading-relaxed">
                {formError}
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-emerald-400" />
                {successMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/40 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-indigo-600/15"
            >
              {submitting ? "Registering..." : "Register Client"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: List of Clients */}
      <div className="lg:col-span-8">
        <div className="glass-panel rounded-3xl overflow-hidden border-slate-800">
          <div className="px-8 py-5 bg-slate-900/40 border-b border-slate-850 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Registered Clients List</span>
            <span className="text-xs font-mono bg-slate-950 px-2.5 py-1 rounded-full text-indigo-400 font-semibold">{clients.length} Clients</span>
          </div>

          {clients.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No clients registered under this workspace yet. Use the sidebar form to register your first client!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-850 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                    <th className="px-8 py-4">Client Name</th>
                    <th className="px-8 py-4">Industry / Niche</th>
                    <th className="px-8 py-4">Database Client ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60 text-slate-300 text-sm">
                  {clients.map((client) => (
                    <tr key={client.id} className="hover:bg-slate-900/35 transition-colors">
                      <td className="px-8 py-4.5 font-bold text-slate-200">{client.name}</td>
                      <td className="px-8 py-4.5 text-slate-400">{client.industry}</td>
                      <td className="px-8 py-4.5">
                        <code className="text-xs bg-slate-950 border border-slate-850 px-2 py-1 rounded text-indigo-300 font-mono select-all">
                          {client.id}
                        </code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
