import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Square, RotateCw, Plus, Server, Cpu, HardDrive, Shield, Activity, Search, X, Trash2, RefreshCw, Terminal } from 'lucide-react';
import api from '../../api/axios';

interface Instance {
  id: string;
  name: string;
  project?: string;
  type: 'container' | 'virtual-machine';
  status: 'Running' | 'Stopped' | 'Restarting';
  ipAddress: string;
  ipv4: string;
  ipv6: string;
  cpuCores: number;
  ramGB: number;
  diskGB: number;
  uptime: string;
}

function parseMemoryToGB(memStr?: string): number {
  if (!memStr) return 1;
  const val = parseFloat(memStr);
  if (isNaN(val)) return 1;
  if (memStr.toUpperCase().endsWith('MB')) {
    return val / 1024;
  }
  return val;
}

function calculateUptime(startedAtStr?: string): string {
  if (!startedAtStr || startedAtStr.startsWith('0001-01-01') || startedAtStr === 'N/A') return 'N/A';
  try {
    const started = new Date(startedAtStr);
    const diffMs = Date.now() - started.getTime();
    if (diffMs < 0) return 'Just started';
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffDay > 0) {
      return `${diffDay} days, ${diffHour % 24} hours`;
    }
    if (diffHour > 0) {
      return `${diffHour} hours, ${diffMin % 60} mins`;
    }
    if (diffMin > 0) {
      return `${diffMin} mins`;
    }
    return `${diffSec} secs`;
  } catch {
    return 'N/A';
  }
}

export default function InstancesView() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'container' | 'virtual-machine'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // New Instance Form state
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'container' | 'virtual-machine'>('container');
  const [newCpu, setNewCpu] = useState(2);
  const [newRam, setNewRam] = useState(4);
  const [newDisk, setNewDisk] = useState(40);
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState('default');

  // Terminal Console Modal state
  const [terminalInstance, setTerminalInstance] = useState<string | null>(null);
  const [terminalCommand, setTerminalCommand] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<{ command: string; stdout: string; stderr: string; exitCode: number }[]>([]);
  const [terminalLoading, setTerminalLoading] = useState(false);
  const terminalEndRef = React.useRef<HTMLDivElement>(null);

  const handleExecuteCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalCommand || !terminalInstance) return;

    const cmd = terminalCommand;
    setTerminalCommand('');
    setTerminalLoading(true);

    try {
      const inst = instances.find(i => i.name === terminalInstance);
      const projParam = inst?.project ? `?project=${inst.project}` : '';
      const res = await api.post(`/api/instances/${terminalInstance}/exec/${projParam}`, { command: cmd });
      setTerminalHistory(prev => [...prev, {
        command: cmd,
        stdout: res.data.stdout,
        stderr: res.data.stderr,
        exitCode: res.data.exit_code
      }]);
    } catch (err: any) {
      console.error(err);
      setTerminalHistory(prev => [...prev, {
        command: cmd,
        stdout: '',
        stderr: err.response?.data?.error || 'Failed to execute command.',
        exitCode: -1
      }]);
    } finally {
      setTerminalLoading(false);
      setTimeout(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  // Local image templates list for new instances base select
  const [localImages, setLocalImages] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');

  const fetchProjectsList = async () => {
    try {
      const res = await api.get('/api/projects/');
      setProjectsList(res.data);
    } catch (err) {
      console.error("Failed to load projects list", err);
    }
  };

  const fetchLocalImages = async () => {
    try {
      const projParam = selectedProject ? `?project=${selectedProject}` : '';
      const res = await api.get(`/api/images/${projParam}`);
      const mapped = res.data.map((img: any) => {
        let alias = '';
        if (img.aliases && img.aliases.length > 0) {
          alias = img.aliases[0].name;
        } else if (img.properties && img.properties.description) {
          alias = img.properties.description;
        } else if (img.properties && img.properties.os) {
          alias = `${img.properties.os} ${img.properties.release || ''}`;
        } else {
          alias = img.fingerprint.substring(0, 12);
        }
        return {
          fingerprint: img.fingerprint,
          alias: alias,
          type: img.type === 'virtual-machine' ? 'virtual-machine' : 'container',
          sizeMB: Math.round((img.size || 0) / (1024 * 1024))
        };
      });
      setLocalImages(mapped);
      if (mapped.length > 0) {
        setSelectedImage(mapped[0].fingerprint);
        setNewType(mapped[0].type);
      }
    } catch (err) {
      console.error("Failed to load local images", err);
    }
  };

  const fetchInstances = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/instances/');
      const mapped: Instance[] = response.data.map((inst: any) => {
        let diskSize = 20;
        if (inst.devices?.root?.size) {
          diskSize = parseFloat(inst.devices.root.size) || 20;
        }
        return {
          id: inst.name,
          name: inst.name,
          project: inst.project,
          type: inst.type === 'virtual-machine' ? 'virtual-machine' : 'container',
          status: inst.status || 'Stopped',
          ipAddress: 'Loading...',
          ipv4: 'Loading...',
          ipv6: 'Loading...',
          cpuCores: parseInt(inst.config?.['limits.cpu']) || 1,
          ramGB: parseMemoryToGB(inst.config?.['limits.memory']),
          diskGB: diskSize,
          uptime: calculateUptime(inst.created_at),
        };
      });

      setInstances(mapped);

      // Async fetch state for each instance in parallel
      mapped.forEach(async (inst) => {
        try {
          const projParam = inst.project ? `?project=${inst.project}` : '';
          const stateRes = await api.get(`/api/instances/${inst.name}/state/${projParam}`);
          const stateData = stateRes.data;
          
          let ipAddress = 'N/A';
          let ipv4 = 'N/A';
          let ipv6 = 'N/A';
          if (stateData.network) {
            for (const [ifaceName, iface] of Object.entries<any>(stateData.network)) {
              if (ifaceName !== 'lo' && iface.addresses) {
                const inetAddr = iface.addresses.find((addr: any) => addr.family === 'inet');
                if (inetAddr) {
                  ipv4 = inetAddr.address;
                  ipAddress = inetAddr.address;
                }
                const inet6Addr = iface.addresses.find((addr: any) => addr.family === 'inet6');
                if (inet6Addr) {
                  ipv6 = inet6Addr.address;
                }
                if (ipv4 !== 'N/A' || ipv6 !== 'N/A') {
                  break;
                }
              }
            }
          }
          
          let uptime = inst.uptime;
          if (stateData.started_at) {
            uptime = calculateUptime(stateData.started_at);
          }

          setInstances(prev => prev.map(p => {
            if (p.id === inst.id) {
              return {
                ...p,
                ipAddress,
                ipv4,
                ipv6,
                uptime,
                status: stateData.status || p.status
              };
            }
            return p;
          }));
        } catch (err) {
          console.error(`Failed to fetch state for ${inst.name}`, err);
          setInstances(prev => prev.map(p => {
            if (p.id === inst.id) {
              return {
                ...p,
                ipAddress: 'N/A',
                ipv4: 'N/A',
                ipv6: 'N/A'
              };
            }
            return p;
          }));
        }
      });
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load instances.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchInstances();
  }, []);

  React.useEffect(() => {
    if (isModalOpen) {
      fetchLocalImages();
      fetchProjectsList();
    }
  }, [isModalOpen, selectedProject]);

  const handleAction = async (id: string, actionName: 'start' | 'stop' | 'restart') => {
    setInstances(prev => prev.map(inst => {
      if (inst.id === id) {
        if (actionName === 'start') return { ...inst, status: 'Running', uptime: 'Starting...' };
        if (actionName === 'stop') return { ...inst, status: 'Stopped', uptime: 'Stopping...' };
        if (actionName === 'restart') return { ...inst, status: 'Restarting', uptime: 'Restarting...' };
      }
      return inst;
    }));

    try {
      const inst = instances.find(i => i.id === id);
      const projParam = inst?.project ? `?project=${inst.project}` : '';
      await api.post(`/api/instances/${id}/action/${projParam}`, { action: actionName });
      setTimeout(async () => {
        try {
          const stateRes = await api.get(`/api/instances/${id}/state/${projParam}`);
          const stateData = stateRes.data;
          
          let ipAddress = 'N/A';
          let ipv4 = 'N/A';
          let ipv6 = 'N/A';
          if (stateData.network) {
            for (const [ifaceName, iface] of Object.entries<any>(stateData.network)) {
              if (ifaceName !== 'lo' && iface.addresses) {
                const inetAddr = iface.addresses.find((addr: any) => addr.family === 'inet');
                if (inetAddr) {
                  ipv4 = inetAddr.address;
                  ipAddress = inetAddr.address;
                }
                const inet6Addr = iface.addresses.find((addr: any) => addr.family === 'inet6');
                if (inet6Addr) {
                  ipv6 = inet6Addr.address;
                }
                if (ipv4 !== 'N/A' || ipv6 !== 'N/A') {
                  break;
                }
              }
            }
          }
          
          let uptime = 'N/A';
          if (stateData.started_at) {
            uptime = calculateUptime(stateData.started_at);
          }

          setInstances(prev => prev.map(p => {
            if (p.id === id) {
              return {
                ...p,
                ipAddress,
                ipv4,
                ipv6,
                uptime,
                status: stateData.status || p.status
              };
            }
            return p;
          }));
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || `Failed to perform action ${actionName} on instance ${id}.`);
      fetchInstances();
    }
  };

  const handleDelete = async (id: string) => {
    const inst = instances.find(i => i.id === id);
    if (!inst) return;

    const isRunning = inst.status === 'Running';
    const message = isRunning
      ? `Instance ${id} is currently running. We will stop it first, then destroy it. This action cannot be undone. Proceed?`
      : `Are you sure you want to delete instance ${id}? This action cannot be undone. Proceed?`;

    if (!window.confirm(message)) {
      return;
    }
    
    setInstances(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Stopped', uptime: 'Deleting...' };
      }
      return item;
    }));

    try {
      const projParam = inst.project ? `?project=${inst.project}` : '';
      if (isRunning) {
        await api.post(`/api/instances/${id}/action/${projParam}`, { action: 'stop', force: true });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      await api.delete(`/api/instances/${id}/${projParam}`);
      setInstances(prev => prev.filter(item => item.id !== id));
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || `Failed to delete instance ${id}.`);
      fetchInstances();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    if (!selectedImage) {
      setError("Please pull a base image template first.");
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const sanitizedName = newName.toLowerCase().replace(/\s+/g, '-');

      const payload = {
        name: sanitizedName,
        type: newType,
        source: {
          type: 'image',
          fingerprint: selectedImage
        },
        config: {
          'limits.cpu': String(newCpu),
          'limits.memory': `${newRam}GB`
        },
        devices: {
          root: {
            path: '/',
            pool: 'local',
            type: 'disk',
            size: `${newDisk}GB`
          }
        }
      };

      const projParam = selectedProject ? `?project=${selectedProject}` : '';
      await api.post(`/api/instances/${projParam}`, payload);
      setNewName('');
      setIsModalOpen(false);
      fetchInstances();
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to create instance. Ensure the name is unique.');
    } finally {
      setLoading(false);
    }
  };

  const filteredInstances = instances.filter(inst => {
    const matchesSearch = inst.name.toLowerCase().includes(search.toLowerCase()) || 
                          inst.ipAddress.includes(search) ||
                          (inst.ipv4 && inst.ipv4.includes(search)) ||
                          (inst.ipv6 && inst.ipv6.includes(search));
    const matchesFilter = filter === 'all' || inst.type === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
            <Server className="text-purple-500 w-8 h-8" />
            Instances
          </h2>
          <p className="text-gray-400 mt-1">Manage virtual machines and system containers.</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={fetchInstances}
            title="Refresh List"
            className="p-2.5 rounded-xl bg-app-card hover:bg-app-border-dim border border-app-border text-gray-400 hover:text-app-text-h active:scale-95 transition cursor-pointer"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-purple-500' : ''}`} />
          </button>
          
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-app-text-h rounded-xl font-medium shadow-lg hover:shadow-purple-500/20 active:scale-95 transition cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            New Instance
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-start gap-2.5 text-sm">
          <Shield className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-gray-400 hover:text-rose-400 transition ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-app-border-dim bg-app-card/50 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or IP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'container', 'virtual-machine'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t as any)}
              className={`px-4 py-2 rounded-xl capitalize font-medium transition cursor-pointer ${
                filter === t
                  ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                  : 'bg-app-card/50 border border-app-border-dim text-gray-400 hover:text-app-text-h hover:bg-app-card/80'
              }`}
            >
              {t.replace('-', ' ')}s
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {loading && instances.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Activity className="w-12 h-12 text-purple-500 animate-spin" />
          <p className="text-gray-400 font-medium">Fetching instances from cloud host...</p>
        </div>
      ) : filteredInstances.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-app-border rounded-2xl bg-app-card/20">
          <Server className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-app-text-h mb-1">No Instances Found</h3>
          <p className="text-gray-400 max-w-xs mx-auto text-sm">
            {search ? 'No instances match your search filters.' : 'Launch your first virtual machine or container to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredInstances.map((inst) => (
              <motion.div
                layout
                key={inst.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="p-6 rounded-2xl border border-app-border bg-gradient-to-br from-app-card/60 to-app-card/20 hover:bg-app-card/80 transition-all duration-300 relative group"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-lg text-app-text-h group-hover:text-purple-300 transition-colors">
                        {inst.name}
                      </span>
                      <span className="px-2 py-0.5 text-xs font-semibold rounded-md uppercase tracking-wider bg-app-border-dim border border-app-border text-gray-400">
                        {inst.type === 'container' ? 'Tblinc' : 'VM'}
                      </span>
                      {inst.project && (
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-purple-500/10 border border-purple-500/20 text-purple-300">
                          {inst.project}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-1 text-xs font-mono">
                      {inst.ipv4 && inst.ipv4 !== 'N/A' && (
                        <div className="flex items-center gap-1.5 text-emerald-400">
                          <span className="px-1 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-extrabold tracking-wide uppercase">IPv4</span>
                          <span>{inst.ipv4}</span>
                        </div>
                      )}
                      {inst.ipv6 && inst.ipv6 !== 'N/A' && (
                        <div className="flex items-center gap-1.5 text-blue-400">
                          <span className="px-1 py-0.2 rounded bg-blue-500/10 border border-blue-500/20 text-[9px] font-extrabold tracking-wide uppercase">IPv6</span>
                          <span className="truncate max-w-[200px]" title={inst.ipv6}>{inst.ipv6}</span>
                        </div>
                      )}
                      {(!inst.ipv4 || inst.ipv4 === 'N/A' || inst.ipv4 === 'Loading...') && (!inst.ipv6 || inst.ipv6 === 'N/A' || inst.ipv6 === 'Loading...') && (
                        <div className="text-zinc-500 flex items-center gap-1.5">
                          <span className="px-1 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-[9px] font-extrabold tracking-wide uppercase">IP</span>
                          <span>{inst.ipAddress || 'N/A'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                      inst.status === 'Running'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : inst.status === 'Stopped'
                        ? 'bg-zinc-500/10 border-zinc-500/30 text-gray-400'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${
                        inst.status === 'Running'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                          : inst.status === 'Stopped'
                          ? 'bg-zinc-400'
                          : 'bg-amber-400'
                      }`} />
                      {inst.status}
                    </span>
                  </div>
                </div>

                {/* Hardware stats */}
                <div className="grid grid-cols-3 gap-4 my-6 p-3 rounded-xl bg-app-card/30 border border-app-border-dim text-sm">
                  <div className="flex flex-col gap-1 items-center justify-center text-center">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <span className="text-gray-400 text-xs">Cores</span>
                    <span className="font-semibold text-app-text-h">{inst.cpuCores} vCPU</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center justify-center text-center">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-400 text-xs">RAM</span>
                    <span className="font-semibold text-app-text-h">{inst.ramGB} GB</span>
                  </div>
                  <div className="flex flex-col gap-1 items-center justify-center text-center">
                    <HardDrive className="w-4 h-4 text-pink-400" />
                    <span className="text-gray-400 text-xs">Storage</span>
                    <span className="font-semibold text-app-text-h">{inst.diskGB} GB</span>
                  </div>
                </div>

                {/* Footer / Controls */}
                <div className="flex justify-between items-center pt-2 border-t border-app-border-dim">
                  <div className="text-xs text-gray-500">
                    Uptime: <span className="text-gray-300 font-medium">{inst.uptime}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Terminal Console (Only if running) */}
                    <button
                      onClick={() => setTerminalInstance(inst.name)}
                      disabled={inst.status !== 'Running'}
                      title="Open Interactive Shell Terminal"
                      className={`p-2 rounded-lg transition active:scale-95 cursor-pointer border ${
                        inst.status === 'Running'
                          ? 'bg-violet-500/10 border-violet-500/25 text-violet-400 hover:bg-violet-500/20'
                          : 'bg-[#120f1a] border-app-border-dim text-gray-600 cursor-not-allowed opacity-40'
                      }`}
                    >
                      <Terminal className="w-4 h-4" />
                    </button>

                    {/* Start (If stopped) */}
                    {inst.status !== 'Running' && (
                      <button
                        onClick={() => handleAction(inst.id, 'start')}
                        title="Start Instance"
                        className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 active:scale-95 transition cursor-pointer"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    )}

                    {/* Restart (If running) */}
                    {inst.status === 'Running' && (
                      <button
                        onClick={() => handleAction(inst.id, 'restart')}
                        title="Restart Instance"
                        className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 active:scale-95 transition cursor-pointer"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    )}

                    {/* Stop (If running) */}
                    {inst.status === 'Running' && (
                      <button
                        onClick={() => handleAction(inst.id, 'stop')}
                        title="Stop Instance"
                        className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 active:scale-95 transition cursor-pointer"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    )}

                    {/* Destroy / Delete */}
                    <button
                      onClick={() => handleDelete(inst.id)}
                      title="Destroy Instance"
                      className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 active:scale-95 transition cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal Slide-over for Creation */}
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
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-app-card border-l border-app-border p-8 shadow-2xl z-50 overflow-y-auto flex flex-col text-left"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-bold text-app-text-h flex items-center gap-2">
                  <Server className="text-purple-500" />
                  New Instance
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-6 flex-1">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Project Namespace</label>
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card text-app-text-h focus:outline-none focus:border-purple-500 transition-colors text-sm font-semibold"
                  >
                    <option value="default">default (System Default)</option>
                    {projectsList.filter(p => p.name !== 'default').map((proj) => (
                      <option key={proj.name} value={proj.name}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Instance Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. redis-cache"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-sm font-semibold text-gray-300">Base Image Template</label>
                  {localImages.length === 0 ? (
                    <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-400 text-xs">
                      No local templates found. Please pull an image template under the <strong>Images</strong> tab first.
                    </div>
                  ) : (
                    <select
                      required
                      value={selectedImage}
                      onChange={(e) => {
                        const fp = e.target.value;
                        setSelectedImage(fp);
                        const matched = localImages.find(img => img.fingerprint === fp);
                        if (matched) {
                          setNewType(matched.type);
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card text-app-text-h focus:outline-none focus:border-purple-500 transition-colors text-sm"
                    >
                      {localImages.map(img => (
                        <option key={img.fingerprint} value={img.fingerprint}>
                          {img.alias} ({img.type === 'virtual-machine' ? 'VM' : 'Tblinc'}) - {img.sizeMB}MB
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Type</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setNewType('container')}
                      className={`p-4 rounded-xl border font-semibold text-center flex flex-col items-center gap-2 transition cursor-pointer ${
                        newType === 'container'
                          ? 'bg-purple-500/15 border-purple-500 text-purple-300'
                          : 'bg-app-card/50 border-app-border-dim text-gray-400 hover:text-app-text-h'
                      }`}
                    >
                      <Shield className="w-6 h-6" />
                      Tblinc Container
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewType('virtual-machine')}
                      className={`p-4 rounded-xl border font-semibold text-center flex flex-col items-center gap-2 transition cursor-pointer ${
                        newType === 'virtual-machine'
                          ? 'bg-purple-500/15 border-purple-500 text-purple-300'
                          : 'bg-app-card/50 border-app-border-dim text-gray-400 hover:text-app-text-h'
                      }`}
                    >
                      <Server className="w-6 h-6" />
                      Virtual Machine
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-semibold text-gray-300">Resource Limits</label>
                  
                  {/* CPU Cores */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">CPU Cores</span>
                      <span className="text-app-text-h font-medium">{newCpu} Cores</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="16"
                      step="1"
                      value={newCpu}
                      onChange={(e) => setNewCpu(parseInt(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* RAM Allocation */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Memory (RAM)</span>
                      <span className="text-app-text-h font-medium">{newRam} GB</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="32"
                      step="1"
                      value={newRam}
                      onChange={(e) => setNewRam(parseInt(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>

                  {/* Disk Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Disk Space</span>
                      <span className="text-app-text-h font-medium">{newDisk} GB</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="10"
                      value={newDisk}
                      onChange={(e) => setNewDisk(parseInt(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    disabled={loading}
                    className="flex-1 py-3 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition cursor-pointer text-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-app-text-h rounded-xl font-medium transition cursor-pointer text-center shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Activity className="w-4 h-4 animate-spin text-purple-200" />
                        Launching...
                      </>
                    ) : (
                      'Launch'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Terminal Console Modal */}
      <AnimatePresence>
        {terminalInstance && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setTerminalInstance(null);
                setTerminalHistory([]);
              }}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#09070f] border border-app-border rounded-2xl overflow-hidden shadow-2xl z-50 text-left flex flex-col h-[500px]"
            >
              {/* Header */}
              <div className="flex justify-between items-center bg-[#110e19] px-6 py-4 border-b border-app-border-dim shrink-0">
                <div className="flex items-center gap-2.5">
                  <Terminal className="text-violet-400 w-5 h-5" />
                  <span className="font-mono text-sm font-semibold text-app-text-h">
                    Interactive Console — {terminalInstance}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setTerminalInstance(null);
                    setTerminalHistory([]);
                  }}
                  className="p-1.5 rounded-lg bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Terminal Screen Body */}
              <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-emerald-400 space-y-4 bg-[#050408] scrollbar-thin">
                <div className="text-gray-500 pb-2 border-b border-zinc-900">
                  Welcome to Tblinc Instance Console!
                  <br />
                  Connected to container root shell via /bin/sh.
                </div>

                {terminalHistory.map((h, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <span>root@{terminalInstance}:~#</span>
                      <span className="text-white font-medium">{h.command}</span>
                    </div>
                    {h.stdout && (
                      <pre className="whitespace-pre-wrap text-emerald-400 pl-4">{h.stdout}</pre>
                    )}
                    {h.stderr && (
                      <pre className="whitespace-pre-wrap text-rose-400 pl-4">{h.stderr}</pre>
                    )}
                    {h.exitCode !== 0 && (
                      <div className="text-[10px] text-zinc-600 pl-4">
                        Process exited with code {h.exitCode}
                      </div>
                    )}
                  </div>
                ))}

                {terminalLoading && (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing command...</span>
                  </div>
                )}
                
                <div ref={terminalEndRef} />
              </div>

              {/* Command Input Bar */}
              <form onSubmit={handleExecuteCommand} className="bg-[#110e19] p-4 border-t border-app-border-dim flex gap-3 shrink-0 items-center">
                <span className="font-mono text-xs text-zinc-500 shrink-0 select-none pl-2">
                  root@{terminalInstance}:~#
                </span>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Type a shell command (e.g. ls -la, uname -a, ip a)..."
                  value={terminalCommand}
                  onChange={(e) => setTerminalCommand(e.target.value)}
                  className="flex-1 bg-black/50 border border-app-border-dim rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={terminalLoading}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800/40 text-white rounded-xl text-xs font-semibold shadow-lg transition active:scale-95 cursor-pointer flex-shrink-0"
                >
                  Run
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
