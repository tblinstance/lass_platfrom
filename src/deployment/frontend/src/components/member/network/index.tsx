import React, { useState, useEffect } from 'react';
import { Network, Shield, RefreshCw, Plus, X, AlertCircle, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../../api/axios';

interface MemberNetworkViewProps {
  user: { username: string; email: string } | null;
}

export default function MemberNetworkView({ user }: MemberNetworkViewProps) {
  const [networks, setNetworks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create Network Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNetName, setNewNetName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNetworks = async () => {
    setLoading(true);
    try {
      const project = user ? `member-${user.username}`.toLowerCase().replace(/_/g, '-').replace(/\./g, '-') : '';
      const res = await api.get(`/api/networks/?project=${project}`);
      setNetworks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworks();
  }, []);

  const handleCreateNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNetName) return;

    setCreating(true);
    setError(null);

    try {
      const project = user ? `member-${user.username}`.toLowerCase().replace(/_/g, '-').replace(/\./g, '-') : '';
      await api.post(`/api/networks/?project=${project}`, {
        name: newNetName.toLowerCase().replace(/\s+/g, '-'),
        type: 'ovn'
      });
      setNewNetName('');
      setIsModalOpen(false);
      fetchNetworks();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create network namespace.');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteNetwork = async (name: string) => {
    if (!window.confirm(`Are you sure you want to delete network ${name}?`)) {
      return;
    }
    try {
      const project = user ? `member-${user.username}`.toLowerCase().replace(/_/g, '-').replace(/\./g, '-') : '';
      await api.delete(`/api/networks/${name}/?project=${project}`);
      fetchNetworks();
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || '';
      if (errMsg.includes('in use') || errMsg.includes('currently in use')) {
        alert(`Cannot delete network "${name}" because it is currently in use by active compute instances. Please delete or detach all instances using this network first.`);
      } else {
        alert(errMsg || 'Failed to delete network.');
      }
    }
  };

  const filteredNetworks = networks.filter(net => net.type === 'ovn');

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-app-text-h">Network Links (OVN Only)</h3>
          <p className="text-gray-400 text-sm mt-1">Virtual OVN networks and overlay switches assigned to your sandbox environment.</p>
        </div>
        <div className="flex items-center gap-3 self-start">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold shadow-md hover:shadow-teal-500/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Network
          </button>
          <button
            onClick={fetchNetworks}
            className="flex items-center gap-2 px-4 py-2 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl text-xs font-semibold border border-app-border-dim hover:border-app-border transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredNetworks.map(net => (
          <div key={net.name} className="p-6 rounded-2xl border border-app-border bg-app-card/40 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Network className="text-teal-400 w-5 h-5" />
                <span className="font-bold text-app-text-h text-sm font-mono">{net.name}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold border ${
                net.status === 'active' || net.status === 'Created'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-zinc-800 border-zinc-700 text-gray-400'
              }`}>
                {net.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-400 border-t border-app-border-dim pt-4">
              <div>Type: <span className="text-gray-200">{net.type}</span></div>
              <div>Managed: <span className="text-gray-200">{net.managed ? 'Yes' : 'No'}</span></div>
              {net.config?.['ipv4.address'] && (
                <div className="col-span-2">IPv4 Subnet: <span className="text-emerald-400">{net.config['ipv4.address']}</span></div>
              )}
            </div>

            <div className="border-t border-app-border-dim pt-4 flex justify-end">
              <button
                onClick={() => handleDeleteNetwork(net.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold border border-rose-500/25 transition cursor-pointer"
                title="Delete Network"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>
        ))}
        {filteredNetworks.length === 0 && (
          <div className="col-span-2 p-12 text-center text-gray-500 border border-app-border border-dashed rounded-2xl">
            No virtual OVN network switches associated with this member workspace.
          </div>
        )}
      </div>

      {/* Create Network Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-app-card border border-app-border rounded-2xl p-6 shadow-2xl z-50 text-left"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-app-text-h flex items-center gap-2">
                  <Network className="text-teal-400" />
                  Create OVN Network
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNetwork} className="space-y-4">
                {error && (
                  <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold flex items-start gap-2.5">
                    <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Network Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. internal-net"
                    value={newNetName}
                    onChange={(e) => setNewNetName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-teal-500 transition-colors"
                  />
                  <p className="text-[10px] text-gray-500 leading-relaxed mt-1">
                    Lowercase alphanumeric characters and dashes only. Spaces or special characters will be automatically hyphenated.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-teal-500/10 bg-teal-500/5 space-y-2 text-xs leading-relaxed text-teal-300">
                  <p className="font-bold flex items-center gap-1.5 text-teal-400">
                    <Shield className="w-4 h-4" />
                    Isolated Tenant Network
                  </p>
                  <p className="text-gray-400">
                    Networks created in your workspace are isolated OVN overlays. Incus will automatically provision DHCP and map the network securely through the cluster uplink.
                  </p>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition cursor-pointer text-center"
                    disabled={creating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition cursor-pointer text-center flex items-center justify-center gap-2"
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create Network'}
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
