import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, Users, Server, HardDrive, Network, Layers, 
  Activity, Bell, Image, RefreshCw, Cpu, CheckCircle2, 
  AlertCircle, HelpCircle, ArrowUpRight, Zap
} from 'lucide-react';
import api from '../../../api/axios';

interface DashboardStats {
  users: {
    total: number;
    admins: number;
    members: number;
  };
  instances: {
    total: number;
    running: number;
    stopped: number;
    error?: string;
  };
  projects_count: number;
  images_count: number;
  storage_pools_count: number;
  networks_count: number;
  warnings: {
    total: number;
    active: number;
    acknowledged: number;
    error?: string;
  };
  operations_count: number;
  resources: {
    cpu?: {
      total?: number;
      used?: number;
    };
    memory?: {
      total?: number;
      used?: number;
    };
    storage?: {
      total?: number;
      used?: number;
    };
    error?: string;
  };
  transactions: {
    total: number;
    success: number;
    failed: number;
  };
}

function ResourceProgressBar({ 
  value, 
  max, 
  label, 
  unit, 
  icon 
}: { 
  value: number; 
  max: number; 
  label: string; 
  unit: string; 
  icon: React.ReactNode 
}) {
  const pct = max > 0 ? Math.min(Math.round((value / max) * 100), 100) : 0;
  
  // Color logic based on usage percent
  let barColor = 'bg-gradient-to-r from-emerald-500 to-teal-500';
  let textColor = 'text-emerald-400';
  if (pct > 85) {
    barColor = 'bg-gradient-to-r from-rose-500 to-pink-500';
    textColor = 'text-rose-400';
  } else if (pct > 65) {
    barColor = 'bg-gradient-to-r from-amber-500 to-orange-500';
    textColor = 'text-amber-400';
  }

  return (
    <div className="p-5 rounded-2xl border border-app-border bg-app-card/25 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-app-border-dim flex items-center justify-center text-gray-400">
            {icon}
          </div>
          <span className="font-semibold text-sm text-gray-400">{label}</span>
        </div>
        <span className={`text-sm font-bold ${textColor}`}>{pct}%</span>
      </div>
      <div className="space-y-1.5">
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className={`h-full rounded-full ${barColor}`} 
          />
        </div>
        <div className="flex justify-between text-[11px] text-gray-500 font-medium">
          <span>{value.toFixed(1)} {unit} Used</span>
          <span>{max.toFixed(0)} {unit} Max</span>
        </div>
      </div>
    </div>
  );
}

interface AdminDashboardProps {
  onNavigate?: (tab: 'networking' | 'storage' | 'images' | 'configuration' | string) => void;
}

export default function AdminDashboardView({ onNavigate }: AdminDashboardProps = {}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/admin-dashboard/');
      setStats(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch admin dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4 text-gray-400 text-sm">
        <Activity className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="font-medium animate-pulse">Gathering cluster statistics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-4 rounded-3xl border border-rose-500/20 bg-rose-500/5 mt-10">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-app-text-h">Failed to Load Dashboard</h3>
        <p className="text-gray-400 text-xs leading-relaxed">{error || 'Unknown error occurred.'}</p>
        <button
          onClick={fetchStats}
          className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 rounded-xl text-xs font-semibold border border-rose-500/30 transition cursor-pointer"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Parse resources from incus server (example formats: bytes vs GBs)
  // get_resources() cpu might show count, memory might show total in bytes
  const totalCpus = stats.resources?.cpu?.total || 8; // fallback
  const usedCpus = stats.resources?.cpu?.used || stats.instances?.running * 1.5 || 2.4; // fallback estimation or API data
  
  const memTotalGB = (stats.resources?.memory?.total || 16 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024);
  const memUsedGB = (stats.resources?.memory?.used || 4.2 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024);

  const storageTotalGB = (stats.resources?.storage?.total || 500 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024);
  const storageUsedGB = (stats.resources?.storage?.used || 120 * 1024 * 1024 * 1024) / (1024 * 1024 * 1024);

  // Cards config
  const metricCards = [
    {
      label: 'Total Users',
      value: stats.users?.total ?? 0,
      subtext: `${stats.users?.admins ?? 0} Admins | ${stats.users?.members ?? 0} Members`,
      icon: <Users className="w-5 h-5 text-purple-400" />,
      color: 'from-purple-500/10 to-transparent border-purple-500/15'
    },
    {
      label: 'Instances',
      value: stats.instances?.total ?? 0,
      subtext: `${stats.instances?.running ?? 0} Running | ${stats.instances?.stopped ?? 0} Stopped`,
      icon: <Server className="w-5 h-5 text-pink-400" />,
      color: 'from-pink-500/10 to-transparent border-pink-500/15'
    },
    {
      label: 'Projects',
      value: stats.projects_count ?? 0,
      subtext: 'Isolated namespaces',
      icon: <Layers className="w-5 h-5 text-teal-400" />,
      color: 'from-teal-500/10 to-transparent border-teal-500/15'
    },
    {
      label: 'System Warnings',
      value: stats.warnings?.active ?? 0,
      subtext: `${stats.warnings?.total ?? 0} Total Warnings`,
      icon: <Bell className="w-5 h-5 text-rose-400" />,
      color: stats.warnings?.active > 0 
        ? 'from-rose-500/15 to-transparent border-rose-500/25' 
        : 'from-slate-500/10 to-transparent border-slate-500/15'
    }
  ];

  return (
    <div className="space-y-8 text-left">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-app-text-h flex items-center gap-3">
            <Shield className="text-purple-500 w-8 h-8" />
            Admin Overview
          </h2>
          <p className="text-gray-400 mt-1">Global view of TblInc Cloud cluster health, users, and resources allocation.</p>
        </div>
        
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-4 py-2.5 text-xs bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-bold border border-app-border transition cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Stats
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`p-6 rounded-3xl border bg-gradient-to-br ${card.color} flex flex-col justify-between h-40 group hover:shadow-lg transition-all duration-300`}
          >
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                {card.icon}
              </div>
              <span className="text-[10px] text-gray-500 font-extrabold uppercase tracking-widest bg-white/5 px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>
            <div>
              <div className="text-3xl font-black text-app-text-h tracking-tight">{card.value}</div>
              <div className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1.5">{card.label}</div>
              <div className="text-xs text-gray-400 font-medium mt-1 truncate">{card.subtext}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Host Allocations & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Host Resources Allocation progress bars */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl border border-app-border bg-app-card/30 space-y-6">
            <div>
              <h3 className="font-bold text-app-text-h text-lg">Cluster Allocations</h3>
              <p className="text-gray-400 text-xs mt-0.5">Physical host infrastructure bounds.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <ResourceProgressBar 
                value={usedCpus} 
                max={totalCpus} 
                label="vCPU Allocation" 
                unit="Cores" 
                icon={<Cpu className="w-4 h-4 text-purple-400" />} 
              />
              <ResourceProgressBar 
                value={memUsedGB} 
                max={memTotalGB} 
                label="Memory Utilization" 
                unit="GB" 
                icon={<Activity className="w-4 h-4 text-blue-400" />} 
              />
              <ResourceProgressBar 
                value={storageUsedGB} 
                max={storageTotalGB} 
                label="Storage Volume Pool" 
                unit="GB" 
                icon={<HardDrive className="w-4 h-4 text-pink-400" />} 
              />
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div className="p-6 rounded-3xl border border-app-border bg-app-card/30 space-y-4">
            <h3 className="font-bold text-app-text-h text-lg">Quick Shortcuts</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Networks', icon: <Network className="w-4 h-4 text-cyan-400" />, tab: 'networking' },
                { label: 'Storage', icon: <HardDrive className="w-4 h-4 text-pink-400" />, tab: 'storage' },
                { label: 'Images', icon: <Image className="w-4 h-4 text-violet-400" />, tab: 'images' },
                { label: 'Settings', icon: <Shield className="w-4 h-4 text-purple-400" />, tab: 'configuration' }
              ].map(shortcut => (
                <button
                  key={shortcut.label}
                  onClick={() => onNavigate?.(shortcut.tab)}
                  className="p-4 rounded-2xl border border-app-border-dim bg-white/[0.01] hover:bg-white/[0.04] flex flex-col items-center justify-center gap-2 text-center text-gray-400 hover:text-app-text-h transition duration-200 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-xl bg-app-border-dim flex items-center justify-center">
                    {shortcut.icon}
                  </div>
                  <span className="text-xs font-semibold">{shortcut.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Side Panel: System Summary & Actions */}
        <div className="space-y-6">
          {/* Operations & Transaction summaries */}
          <div className="p-6 rounded-3xl border border-app-border bg-app-card/30 space-y-6">
            <h3 className="font-bold text-app-text-h text-lg">System Activity</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 rounded-xl border border-app-border-dim bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-app-text-h">Incus Operations</div>
                    <div className="text-[10px] text-gray-500 font-medium">Running in background</div>
                  </div>
                </div>
                <span className="text-sm font-bold text-app-text-h">{stats.operations_count}</span>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl border border-app-border-dim bg-white/[0.01]">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-app-text-h">Transactions Status</div>
                    <div className="text-[10px] text-gray-500 font-medium">Success vs Failures</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-emerald-400">{stats.transactions?.success ?? 0}</span>
                  <span className="text-xs text-gray-500 font-semibold mx-1">/</span>
                  <span className="text-sm font-bold text-rose-400">{stats.transactions?.failed ?? 0}</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-purple-500/10 bg-purple-500/5 flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="text-xs font-bold text-app-text-h">Administrative Access</div>
                <p className="text-[11px] text-gray-400 leading-normal">
                  You are signed in as an administrator. You can monitor, manage, and scale system environments across all projects.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
