import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Shield, Plus, Info, Network, AlertCircle, RefreshCw, X, Check, Trash2 } from 'lucide-react';
import api from '../../api/axios';

interface NetworkInterface {
  id: string;
  name: string;
  project?: string;
  type: 'bridge' | 'physical' | 'vlan' | 'ovn';
  status: string;
  ipv4Subnet: string;
  ipv6Subnet: string;
  dhcp: boolean;
  managed: boolean;
}

interface DhcpLease {
  id: string;
  hostname: string;
  ipAddress: string;
  macAddress: string;
  type: 'dynamic' | 'static';
}

export default function NetworkingView() {
  const [networks, setNetworks] = useState<NetworkInterface[]>([]);
  const [leases, setLeases] = useState<DhcpLease[]>([]);
  const [loading, setLoading] = useState(false);
  const [leasesLoading, setLeasesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeNetId, setActiveNetId] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Projects list state
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('default');

  // New Network state
  const [netName, setNetName] = useState('');
  const [netType, setNetType] = useState<'bridge' | 'vlan'>('bridge');
  const [netIpv4, setNetIpv4] = useState('10.10.0.1/24');
  const [netDhcp, setNetDhcp] = useState(true);

  const selectedNet = networks.find(n => n.id === activeNetId) || networks[0];

  const fetchProjectsList = async () => {
    try {
      const res = await api.get('/api/projects/');
      setProjectsList(res.data);
    } catch (err) {
      console.error("Failed to load projects list", err);
    }
  };

  const fetchNetworks = async () => {
    setLoading(true);
    setError(null);
    try {
      const projParam = selectedProject ? `?project=${selectedProject}` : '';
      const response = await api.get(`/api/networks/${projParam}`);
      const mapped = response.data.map((net: any) => {
        const ipv4 = net.config?.['ipv4.address'] || 'N/A';
        const ipv6 = net.config?.['ipv6.address'] || 'N/A';
        const dhcp = net.config?.['ipv4.dhcp'] === 'true' || net.config?.['ipv4.dhcp'] === true || false;
        return {
          id: `${net.name}-${net.project || 'default'}`,
          name: net.name,
          project: net.project,
          type: net.type,
          status: net.status === 'Created' ? 'Up' : net.status || 'Down',
          ipv4Subnet: ipv4,
          ipv6Subnet: ipv6,
          dhcp: dhcp,
          managed: net.managed
        };
      });
      setNetworks(mapped);
      if (mapped.length > 0) {
        if (!mapped.some((n: any) => n.id === activeNetId)) {
          setActiveNetId(mapped[0].id);
        }
      } else {
        setActiveNetId('');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load networks.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLeases = async (netName: string, project?: string) => {
    setLeasesLoading(true);
    try {
      const projParam = project ? `?project=${project}` : '';
      const res = await api.get(`/api/networks/${netName}/leases/${projParam}`);
      const mapped = res.data.map((l: any, index: number) => ({
        id: String(index),
        hostname: l.hostname || 'Unknown',
        ipAddress: l.address || l.ipAddress || 'N/A',
        macAddress: l.hwaddr || l.macAddress || 'N/A',
        type: l.type || 'dynamic'
      }));
      setLeases(mapped);
    } catch (err) {
      console.error(`Failed to load leases for network ${netName}`, err);
      setLeases([]);
    } finally {
      setLeasesLoading(false);
    }
  };

  React.useEffect(() => {
    fetchProjectsList();
  }, []);

  React.useEffect(() => {
    fetchNetworks();
  }, [selectedProject]);

  React.useEffect(() => {
    if (selectedNet && selectedNet.dhcp) {
      fetchLeases(selectedNet.name, selectedNet.project);
    } else {
      setLeases([]);
    }
  }, [activeNetId, networks]);

  const handleDeleteNetwork = async (name: string, project?: string) => {
    if (!window.confirm(`Are you sure you want to delete network bridge "${name}"? This action cannot be undone.`)) {
      return;
    }
    setLoading(true);
    try {
      const projParam = project ? `?project=${project}` : '';
      await api.delete(`/api/networks/${name}/${projParam}`);
      fetchNetworks();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || `Failed to delete network ${name}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNetwork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!netName) return;

    setLoading(true);
    setError(null);
    try {
      const payload = {
        name: netName.toLowerCase().replace(/\s+/g, '-'),
        type: netType,
        config: {
          'ipv4.address': netIpv4,
          'ipv4.dhcp': netDhcp ? 'true' : 'false'
        }
      };
      const projParam = selectedProject ? `?project=${selectedProject}` : '';
      await api.post(`/api/networks/${projParam}`, payload);
      setNetName('');
      setIsModalOpen(false);
      fetchNetworks();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create network. Ensure the name is unique.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
            <Network className="text-cyan-500 w-8 h-8" />
            Networking Bridges
          </h2>
          <p className="text-gray-400 mt-1">Manage networks, virtual switches, VLANs, and active DHCP leases.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase">Namespace:</span>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-app-border bg-app-card text-app-text-h focus:outline-none text-xs font-semibold"
            >
              <option value="">All Projects</option>
              <option value="default">default (System Default)</option>
              {projectsList.filter(p => p.name !== 'default').map((proj) => (
                <option key={proj.name} value={proj.name}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-app-text-h rounded-xl font-medium shadow-lg hover:shadow-cyan-500/20 active:scale-95 transition cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Create Network
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Network Interfaces Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">Network Interfaces</div>
          
          <div className="space-y-3">
            {networks.map((net) => {
              const isActive = net.id === activeNetId;
              return (
                <button
                  key={net.id}
                  onClick={() => setActiveNetId(net.id)}
                  className={`w-full p-4 rounded-2xl border text-left flex flex-col gap-3 transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-br from-cyan-500/15 to-cyan-500/5 border-cyan-500/50 shadow-lg shadow-cyan-500/5'
                      : 'bg-app-card/50 border-app-border-dim hover:border-app-border hover:bg-app-card/60'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold text-app-text-h text-md">{net.name}</span>
                      {net.project && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-cyan-500/10 border border-cyan-500/25 text-cyan-300">
                          {net.project}
                        </span>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      net.status === 'Up'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                        : 'bg-zinc-500/10 border border-zinc-500/30 text-gray-400'
                    }`}>
                      {net.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs text-gray-400">
                    <div className="flex justify-between">
                      <span>Subnet</span>
                      <span className="font-mono text-app-text-h">{net.ipv4Subnet}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Device Type</span>
                      <span className="capitalize text-app-text-h">{net.type}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Network Details & Leases */}
        <div className="lg:col-span-2 space-y-6">
          {selectedNet ? (
            <div className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">Interface Details</div>
                  <h3 className="text-xl font-bold text-app-text-h mt-1 flex items-center gap-2">
                    {selectedNet.name}
                    {selectedNet.project && (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-md bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                        {selectedNet.project}
                      </span>
                    )}
                  </h3>
                </div>
                {selectedNet.managed && (
                  <button
                    onClick={() => handleDeleteNetwork(selectedNet.name, selectedNet.project)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 text-xs font-medium transition cursor-pointer active:scale-95"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Network
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-4 border-y border-app-border-dim">
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">IPv4 Address Scope</div>
                  <div className="text-sm font-semibold text-app-text-h font-mono">{selectedNet.ipv4Subnet}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">IPv6 Address Scope</div>
                  <div className="text-sm font-semibold text-app-text-h font-mono truncate">{selectedNet.ipv6Subnet}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">DHCP Configuration</div>
                  <div className="text-sm font-semibold text-app-text-h flex items-center gap-1.5">
                    {selectedNet.dhcp ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Active (DHCPv4/v6)</span>
                      </>
                    ) : (
                      <>
                        <X className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-500">Disabled</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Leases lists */}
              {selectedNet.dhcp ? (
                leasesLoading ? (
                  <div className="flex items-center justify-center py-8 gap-2 text-cyan-400">
                    <Activity className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-medium">Loading active DHCP leases...</span>
                  </div>
                ) : leases.length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-sm font-semibold text-gray-400">DHCP Lease Allocations</div>
                    
                    <div className="overflow-x-auto rounded-xl border border-app-border-dim bg-app-card/30">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-app-border-dim bg-app-card/50 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="px-6 py-3">Hostname</th>
                            <th className="px-6 py-3 font-mono">IP Address</th>
                            <th className="px-6 py-3 font-mono">MAC Address</th>
                            <th className="px-6 py-3">Lease Type</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leases.map((lease) => (
                            <tr key={lease.id} className="border-b border-app-border-dim hover:bg-app-card/30 transition-colors">
                              <td className="px-6 py-3.5 font-medium text-app-text-h">{lease.hostname}</td>
                              <td className="px-6 py-3.5 font-mono text-cyan-400 font-semibold">{lease.ipAddress}</td>
                              <td className="px-6 py-3.5 font-mono text-gray-400">{lease.macAddress}</td>
                              <td className="px-6 py-3.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                  lease.type === 'static'
                                    ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400'
                                    : 'bg-blue-500/10 border border-blue-500/30 text-blue-400'
                                }`}>
                                  {lease.type}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 bg-app-card/30 rounded-xl border border-app-border-dim">
                    <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-sm">No active DHCP lease allocations found.</p>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-gray-500 bg-app-card/30 rounded-xl border border-app-border-dim">
                  <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-sm">DHCP is disabled or unmanaged on this interface.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500 bg-app-card/30 rounded-2xl border border-app-border-dim flex flex-col items-center justify-center h-full min-h-[300px]">
              <Network className="w-12 h-12 text-gray-600 mb-4" />
              <p className="text-lg font-semibold text-gray-400">No Networks Found</p>
              <p className="text-sm mt-1">Create a new network to view its details.</p>
            </div>
          )}
        </div>
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
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-app-card border border-app-border rounded-2xl p-6 shadow-2xl z-50 text-left"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-app-text-h flex items-center gap-2">
                  <Network className="text-cyan-500" />
                  Create Network Bridge
                </h3>
              </div>

              <form onSubmit={handleCreateNetwork} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Network Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. dmzbr1"
                    value={netName}
                    onChange={(e) => setNetName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Bridge Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setNetType('bridge')}
                      className={`py-2.5 rounded-xl border font-semibold text-sm transition cursor-pointer ${
                        netType === 'bridge'
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300'
                          : 'bg-app-card/30 border-app-border-dim text-gray-400 hover:text-app-text-h'
                      }`}
                    >
                      Managed Bridge
                    </button>
                    <button
                      type="button"
                      onClick={() => setNetType('vlan')}
                      className={`py-2.5 rounded-xl border font-semibold text-sm transition cursor-pointer ${
                        netType === 'vlan'
                          ? 'bg-cyan-500/15 border-cyan-500 text-cyan-300'
                          : 'bg-app-card/30 border-app-border-dim text-gray-400 hover:text-app-text-h'
                      }`}
                    >
                      VLAN Sub-interface
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">IPv4 CIDR Scope</label>
                  <input
                    type="text"
                    required
                    value={netIpv4}
                    onChange={(e) => setNetIpv4(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-cyan-500 font-mono transition-colors"
                  />
                </div>

                <div className="flex items-center justify-between py-2 border-t border-app-border-dim">
                  <div>
                    <div className="text-sm font-semibold text-app-text-h">Enable DHCPv4 Server</div>
                    <div className="text-[10px] text-gray-500">Provide automatic IP addresses to instances.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNetDhcp(!netDhcp)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${
                      netDhcp ? 'bg-cyan-600' : 'bg-white/10'
                    }`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      netDhcp ? 'left-6.5' : 'left-0.5'
                    }`} />
                  </button>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-app-text-h rounded-xl font-medium transition cursor-pointer text-center"
                  >
                    Create Network
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
