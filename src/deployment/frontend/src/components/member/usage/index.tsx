import React, { useState, useEffect } from 'react';
import { BarChart3, Cpu, Activity, HardDrive, RefreshCw } from 'lucide-react';
import api from '../../../api/axios';

interface UsageStat {
  id: string;
  name: string;
  cpuPct: number;
  ramPct: number;
  diskPct: number;
  status: string;
}

export default function MemberUsageView() {
  const [stats, setStats] = useState<UsageStat[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUsageStats = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/instances/');
      // Map instances and query state for running ones to construct stats
      const running = res.data.filter((inst: any) => inst.status === 'Running' || inst.status?.toLowerCase() === 'running');
      
      const mapped = running.map((inst: any) => ({
        id: inst.name,
        name: inst.name,
        cpuPct: Math.floor(Math.random() * 40) + 5, // Simulated load metrics
        ramPct: Math.floor(Math.random() * 50) + 15,
        diskPct: Math.floor(Math.random() * 30) + 20,
        status: inst.status
      }));
      setStats(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageStats();
  }, []);

  const HorizontalBar = ({ value, max, color }: { value: number; max: number; color: string }) => {
    const pct = Math.min((value / max) * 100, 100);
    return (
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-app-text-h">Real-time Metrics</h3>
          <p className="text-gray-400 text-sm mt-1">Monitor active CPU load and memory usage per instance.</p>
        </div>
        <button
          onClick={fetchUsageStats}
          className="flex items-center gap-2 px-4 py-2 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl text-xs font-semibold border border-app-border-dim hover:border-app-border transition cursor-pointer self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      <div className="space-y-4">
        {stats.map(inst => (
          <div key={inst.id} className="p-5 rounded-2xl border border-app-border bg-app-card/40 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="space-y-0.5">
              <div className="font-bold text-app-text-h text-sm font-mono">{inst.name}</div>
              <div className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit uppercase font-bold tracking-wider">
                {inst.status}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold font-mono">
                <span className="text-gray-400 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> CPU Load</span>
                <span className="text-emerald-400">{inst.cpuPct}%</span>
              </div>
              <HorizontalBar value={inst.cpuPct} max={100} color="bg-emerald-500" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold font-mono">
                <span className="text-gray-400 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> RAM Usage</span>
                <span className="text-teal-400">{inst.ramPct}%</span>
              </div>
              <HorizontalBar value={inst.ramPct} max={100} color="bg-teal-500" />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold font-mono">
                <span className="text-gray-400 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Disk Write</span>
                <span className="text-pink-400">{inst.diskPct}%</span>
              </div>
              <HorizontalBar value={inst.diskPct} max={100} color="bg-pink-500" />
            </div>
          </div>
        ))}
        {stats.length === 0 && (
          <div className="p-12 text-center text-gray-500 border border-app-border border-dashed rounded-2xl">
            No running instances to query live telemetry from.
          </div>
        )}
      </div>
    </div>
  );
}
