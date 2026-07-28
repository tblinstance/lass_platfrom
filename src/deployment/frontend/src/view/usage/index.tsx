import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart3, Cpu, HardDrive, Activity, Server, ArrowUp, ArrowDown } from 'lucide-react';

interface InstanceUsage {
  id: string;
  name: string;
  type: 'container' | 'virtual-machine';
  cpuPct: number;
  ramGB: number;
  ramLimitGB: number;
  diskGB: number;
  diskLimitGB: number;
  netRxMB: number;
  netTxMB: number;
}

function HorizontalBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function UsageView() {
  const [sortBy, setSortBy] = useState<'cpu' | 'ram' | 'disk'>('cpu');
  const [ascending, setAscending] = useState(false);

  const rawData: InstanceUsage[] = [
    { id: '1', name: 'db-primary-main', type: 'virtual-machine', cpuPct: 74, ramGB: 14.1, ramLimitGB: 16, diskGB: 120, diskLimitGB: 150, netRxMB: 840, netTxMB: 420 },
    { id: '2', name: 'api-gateway-prod', type: 'container', cpuPct: 42, ramGB: 2.8, ramLimitGB: 4, diskGB: 22, diskLimitGB: 40, netRxMB: 1200, netTxMB: 980 },
    { id: '3', name: 'worker-node-01', type: 'container', cpuPct: 28, ramGB: 5.6, ramLimitGB: 8, diskGB: 34, diskLimitGB: 80, netRxMB: 310, netTxMB: 180 },
    { id: '4', name: 'backend-api', type: 'container', cpuPct: 35, ramGB: 1.8, ramLimitGB: 4, diskGB: 15, diskLimitGB: 40, netRxMB: 480, netTxMB: 310 },
  ];

  const sorted = [...rawData].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'cpu') diff = a.cpuPct - b.cpuPct;
    else if (sortBy === 'ram') diff = (a.ramGB / a.ramLimitGB) - (b.ramGB / b.ramLimitGB);
    else diff = (a.diskGB / a.diskLimitGB) - (b.diskGB / b.diskLimitGB);
    return ascending ? diff : -diff;
  });

  const totals = {
    cpu: Math.round(rawData.reduce((s, i) => s + i.cpuPct, 0) / rawData.length),
    ram: rawData.reduce((s, i) => s + i.ramGB, 0).toFixed(1),
    ramMax: rawData.reduce((s, i) => s + i.ramLimitGB, 0),
    disk: rawData.reduce((s, i) => s + i.diskGB, 0),
    diskMax: rawData.reduce((s, i) => s + i.diskLimitGB, 0),
    rx: (rawData.reduce((s, i) => s + i.netRxMB, 0) / 1024).toFixed(1),
    tx: (rawData.reduce((s, i) => s + i.netTxMB, 0) / 1024).toFixed(1),
  };

  const summary = [
    { label: 'Avg CPU Load', value: `${totals.cpu}%`, icon: <Cpu className="w-5 h-5 text-purple-400" />, color: 'from-purple-500/10' },
    { label: 'Total RAM Used', value: `${totals.ram} / ${totals.ramMax} GB`, icon: <Activity className="w-5 h-5 text-blue-400" />, color: 'from-blue-500/10' },
    { label: 'Total Disk Used', value: `${totals.disk} / ${totals.diskMax} GB`, icon: <HardDrive className="w-5 h-5 text-pink-400" />, color: 'from-pink-500/10' },
    { label: 'Network I/O', value: `↓${totals.rx} GB ↑${totals.tx} GB`, icon: <Server className="w-5 h-5 text-emerald-400" />, color: 'from-emerald-500/10' },
  ];

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setAscending(!ascending);
    else { setSortBy(col); setAscending(false); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return null;
    return ascending ? <ArrowUp className="w-3 h-3 inline ml-1" /> : <ArrowDown className="w-3 h-3 inline ml-1" />;
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
          <BarChart3 className="text-orange-500 w-8 h-8" />
          Resource Usage
        </h2>
        <p className="text-gray-400 mt-1">Per-instance consumption analytics and cluster-wide resource totals.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {summary.map(({ label, value, icon, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border border-app-border bg-gradient-to-br ${color} to-transparent space-y-3`}
          >
            <div className="w-9 h-9 rounded-xl bg-app-border-dim flex items-center justify-center">{icon}</div>
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-widest">{label}</div>
              <div className="text-lg font-bold text-app-text-h mt-0.5">{value}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Per-instance table */}
      <div className="p-6 rounded-2xl border border-app-border bg-app-card/50 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-app-text-h text-lg">Per-Instance Breakdown</h3>
          <div className="flex gap-2 text-xs">
            {(['cpu', 'ram', 'disk'] as const).map(col => (
              <button
                key={col}
                onClick={() => handleSort(col)}
                className={`px-3 py-1.5 rounded-lg capitalize font-semibold border transition cursor-pointer ${
                  sortBy === col
                    ? 'bg-orange-500/15 border-orange-500/30 text-orange-300'
                    : 'bg-app-card/50 border-app-border-dim text-gray-400 hover:text-app-text-h'
                }`}
              >
                {col.toUpperCase()} <SortIcon col={col} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sorted.map(inst => (
              <motion.div
                layout
                key={inst.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl border border-app-border-dim bg-app-card/30 grid grid-cols-1 md:grid-cols-4 gap-4 items-center"
              >
                {/* Name */}
                <div className="space-y-0.5">
                  <div className="font-semibold text-app-text-h text-sm">{inst.name}</div>
                  <div className="text-[10px] px-1.5 py-0.5 rounded bg-app-border-dim border border-app-border text-gray-400 uppercase w-fit">
                    {inst.type === 'container' ? 'Tblinc' : 'VM'}
                  </div>
                </div>

                {/* CPU */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1"><Cpu className="w-3.5 h-3.5" /> CPU</span>
                    <span className={`font-semibold ${inst.cpuPct > 70 ? 'text-rose-400' : inst.cpuPct > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>{inst.cpuPct}%</span>
                  </div>
                  <HorizontalBar value={inst.cpuPct} max={100} color={inst.cpuPct > 70 ? 'bg-rose-500' : inst.cpuPct > 50 ? 'bg-amber-500' : 'bg-emerald-500'} />
                </div>

                {/* RAM */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> RAM</span>
                    <span className="font-semibold text-app-text-h">{inst.ramGB} / {inst.ramLimitGB} GB</span>
                  </div>
                  <HorizontalBar value={inst.ramGB} max={inst.ramLimitGB} color="bg-blue-500" />
                </div>

                {/* Disk */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400 flex items-center gap-1"><HardDrive className="w-3.5 h-3.5" /> Disk</span>
                    <span className="font-semibold text-app-text-h">{inst.diskGB} / {inst.diskLimitGB} GB</span>
                  </div>
                  <HorizontalBar value={inst.diskGB} max={inst.diskLimitGB} color="bg-pink-500" />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
