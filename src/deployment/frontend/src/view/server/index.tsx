import React from 'react';
import { motion } from 'motion/react';
import { Monitor, Cpu, HardDrive, Activity, Wifi, Clock, MemoryStick, ThermometerSun, Layers } from 'lucide-react';

interface MetricGaugeProps {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  icon: React.ReactNode;
}

function MetricGauge({ label, value, max, unit, color, icon }: MetricGaugeProps) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="p-5 rounded-2xl border border-app-border bg-app-card/50 space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-app-text-h text-sm">{label}</span>
        </div>
        <span className="text-xs text-gray-400 font-mono">{value} / {max} {unit}</span>
      </div>

      {/* Circular gauge */}
      <div className="flex flex-col items-center gap-3 py-2">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="40"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 * (1 - pct / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-extrabold text-app-text-h">{pct}%</span>
          </div>
        </div>
        <div className={`text-xs font-semibold ${pct > 85 ? 'text-rose-400' : pct > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
          {pct > 85 ? 'Critical' : pct > 60 ? 'Elevated' : 'Normal'}
        </div>
      </div>
    </div>
  );
}

export default function ServerView() {
  const stats = {
    cpuUsed: 34,
    cpuTotal: 64,
    ramUsedGB: 28.4,
    ramTotalGB: 64,
    diskUsedGB: 680,
    diskTotalGB: 2000,
    swapUsedGB: 1.2,
    swapTotalGB: 8,
  };

  const info = [
    { label: 'Hostname', value: 'incus-node-01' },
    { label: 'Kernel', value: 'Linux 6.8.0-63-generic' },
    { label: 'OS Distribution', value: 'Ubuntu 24.04 LTS' },
    { label: 'Architecture', value: 'x86_64 (amd64)' },
    { label: 'CPU Model', value: 'AMD EPYC 7543 (64 cores)' },
    { label: 'Uptime', value: '43 days, 7 hours, 21 minutes' },
    { label: 'Load Average (1m/5m/15m)', value: '1.12 / 0.87 / 0.74' },
    { label: 'Incus Version', value: '6.14 (LTS)' },
  ];

  const interfaces = [
    { name: 'eth0', rx: '12.4 GB', tx: '8.7 GB', speed: '1 Gbps' },
    { name: 'incusbr0', rx: '84.1 GB', tx: '71.3 GB', speed: '10 Gbps (virtual)' },
  ];

  return (
    <div className="space-y-8 text-left">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
          <Monitor className="text-indigo-500 w-8 h-8" />
          Server Hardware
        </h2>
        <p className="text-gray-400 mt-1">Real-time system resources, kernel details, and network throughput.</p>
      </div>

      {/* Metric Gauges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        <MetricGauge label="CPU Usage" value={stats.cpuUsed} max={stats.cpuTotal} unit="cores" color="#818cf8" icon={<Cpu className="w-4 h-4 text-indigo-400" />} />
        <MetricGauge label="RAM" value={stats.ramUsedGB} max={stats.ramTotalGB} unit="GB" color="#60a5fa" icon={<MemoryStick className="w-4 h-4 text-blue-400" />} />
        <MetricGauge label="Disk" value={stats.diskUsedGB} max={stats.diskTotalGB} unit="GB" color="#f472b6" icon={<HardDrive className="w-4 h-4 text-pink-400" />} />
        <MetricGauge label="Swap" value={stats.swapUsedGB} max={stats.swapTotalGB} unit="GB" color="#34d399" icon={<Layers className="w-4 h-4 text-emerald-400" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Info */}
        <div className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md space-y-5">
          <h3 className="font-bold text-app-text-h text-lg flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-400" />
            System Information
          </h3>
          <div className="space-y-0 divide-y divide-white/5">
            {info.map(({ label, value }) => (
              <motion.div
                key={label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-between items-center py-3 text-sm"
              >
                <span className="text-gray-400">{label}</span>
                <span className="font-semibold text-app-text-h font-mono text-xs text-right max-w-[55%] truncate">{value}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Network IO */}
        <div className="space-y-4">
          <div className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md space-y-5">
            <h3 className="font-bold text-app-text-h text-lg flex items-center gap-2">
              <Wifi className="w-5 h-5 text-indigo-400" />
              Network Interfaces
            </h3>
            <div className="space-y-4">
              {interfaces.map((iface) => (
                <div key={iface.name} className="p-4 rounded-xl border border-app-border-dim bg-app-card/30 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-app-text-h font-mono">{iface.name}</span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">{iface.speed}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-0.5">
                      <div className="text-gray-500 text-xs">RX (Received)</div>
                      <div className="font-semibold text-emerald-400 font-mono">{iface.rx}</div>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-gray-500 text-xs">TX (Transmitted)</div>
                      <div className="font-semibold text-blue-400 font-mono">{iface.tx}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Uptime pill */}
          <div className="p-5 rounded-2xl border border-app-border bg-gradient-to-br from-indigo-500/5 to-indigo-500/[0.02] flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="text-xs text-gray-500 font-semibold uppercase tracking-widest">System Uptime</div>
              <div className="text-xl font-bold text-app-text-h mt-0.5">43 days, 7 hours</div>
              <div className="text-xs text-indigo-300 mt-0.5">Last boot: 2026-05-28 16:33 UTC</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
