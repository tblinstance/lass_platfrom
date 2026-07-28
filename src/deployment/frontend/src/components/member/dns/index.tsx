import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Globe, Plus, X, ExternalLink } from 'lucide-react';

interface MemberDnsRule {
  id: string;
  subdomain: string;
  targetInstance: string;
  status: 'Active' | 'Pending';
}

interface MemberDnsProps {
  instances: any[];
  dnsRules: MemberDnsRule[];
  onAddDns: (subdomain: string, targetInstance: string) => void;
  onDeleteDns: (id: string) => void;
}

export default function MemberDnsView({ instances, dnsRules, onAddDns, onDeleteDns }: MemberDnsProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dnsSubdomain, setDnsSubdomain] = useState('');
  const [dnsTarget, setDnsTarget] = useState(instances[0]?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dnsSubdomain || !dnsTarget) return;
    onAddDns(dnsSubdomain, dnsTarget);
    setIsModalOpen(false);
    setDnsSubdomain('');
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-app-text-h">DNS Subdomain Mappings</h3>
          <p className="text-gray-400 text-sm mt-1">Map subdomains of tblinc.com directly to your active compute nodes.</p>
        </div>
        <button
          onClick={() => {
            if (instances.length > 0) setDnsTarget(instances[0].name);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-app-text-h rounded-xl text-xs font-semibold shadow-lg transition"
        >
          <Plus className="w-4 h-4" />
          Add Domain Link
        </button>
      </div>

      <div className="rounded-2xl border border-app-border bg-app-card/40 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs font-semibold">
          <thead>
            <tr className="bg-[#110e19] border-b border-app-border-dim text-gray-400">
              <th className="p-4">Subdomain Url</th>
              <th className="p-4">Target Instance</th>
              <th className="p-4">Routing Ingress</th>
              <th className="p-4 text-right">Operations</th>
            </tr>
          </thead>
          <tbody>
            {dnsRules.map(rule => (
              <tr key={rule.id} className="border-b border-app-border-dim hover:bg-white/[0.02]">
                <td className="p-4 text-teal-400 font-mono">
                  <a href={`https://${rule.subdomain}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1.5">
                    {rule.subdomain}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </td>
                <td className="p-4 text-app-text-h font-mono">{rule.targetInstance}</td>
                <td className="p-4">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] uppercase font-bold border border-emerald-500/20">
                    Active Ingress
                  </span>
                </td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => onDeleteDns(rule.id)}
                    className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 rounded-lg transition text-[10px] cursor-pointer font-bold"
                  >
                    Delete Link
                  </button>
                </td>
              </tr>
            ))}
            {dnsRules.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-500">
                  No active DNS domain links registered. Click Add Domain Link to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* DNS Map Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-app-card border border-app-border rounded-2xl p-6 shadow-2xl z-50 text-left overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-app-text-h flex items-center gap-2">
                  <Globe className="text-teal-500" />
                  Map Subdomain Routing
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold">Subdomain Link</label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-3 w-4.5 h-4.5 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. static-portfolio"
                      value={dnsSubdomain}
                      onChange={(e) => setDnsSubdomain(e.target.value)}
                      className="w-full pl-10 pr-32 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    />
                    <span className="absolute right-3 text-xs text-zinc-500 font-mono select-none">
                      .tblinc.com
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs text-gray-300 font-semibold">Target instance app</label>
                  {instances.length === 0 ? (
                    <div className="p-3 rounded-xl border border-amber-500/10 bg-amber-500/5 text-amber-400 text-xs">
                      No active instances to forward domains to.
                    </div>
                  ) : (
                    <select
                      value={dnsTarget}
                      onChange={(e) => setDnsTarget(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card text-app-text-h focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    >
                      {instances.map((inst) => (
                        <option key={inst.id} value={inst.name}>
                          {inst.name} ({inst.ipAddress})
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-app-text-h rounded-xl font-medium transition shadow-lg text-xs"
                  >
                    Save Mapping
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
