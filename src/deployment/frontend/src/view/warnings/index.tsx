import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, ShieldAlert, Info, X, CheckCheck, Filter, Bell, BellOff } from 'lucide-react';

type Severity = 'critical' | 'warning' | 'info';

interface SystemWarning {
  id: string;
  severity: Severity;
  title: string;
  message: string;
  source: string;
  timestamp: string;
  dismissed: boolean;
}

const sevConfig: Record<Severity, { icon: React.ReactNode; color: string; label: string }> = {
  critical: {
    icon: <ShieldAlert className="w-5 h-5" />,
    color: 'border-rose-500/30 bg-rose-500/5 text-rose-400',
    label: 'Critical',
  },
  warning: {
    icon: <AlertTriangle className="w-5 h-5" />,
    color: 'border-amber-500/30 bg-amber-500/5 text-amber-400',
    label: 'Warning',
  },
  info: {
    icon: <Info className="w-5 h-5" />,
    color: 'border-blue-500/30 bg-blue-500/5 text-blue-400',
    label: 'Info',
  },
};

export default function WarningsView() {
  const [warnings, setWarnings] = useState<SystemWarning[]>([
    { id: '1', severity: 'critical', title: 'High CPU Usage on db-primary-main', message: 'The instance has been running above 80% CPU for more than 15 consecutive minutes. Consider scaling the instance or investigating running processes.', source: 'Instance Monitor', timestamp: '2026-07-10 23:55:00', dismissed: false },
    { id: '2', severity: 'warning', title: 'Storage Pool Near Capacity', message: 'The "backup-hdd" storage pool is at 82% utilization (820GB / 1000GB). Writes may fail when capacity is reached.', source: 'Storage Manager', timestamp: '2026-07-10 22:10:31', dismissed: false },
    { id: '3', severity: 'warning', title: 'Stale Image Template Detected', message: 'The image "ubuntu/22.04/amd64" has not been updated in 45 days. Pull a fresh version or enable auto-update.', source: 'Image Manager', timestamp: '2026-07-10 20:00:00', dismissed: false },
    { id: '4', severity: 'info', title: 'New TblInc Cloud Version Available', message: 'TblInc Cloud 6.15 has been released. Your current version is 6.14 (LTS). Review the changelog and update when ready.', source: 'Update Checker', timestamp: '2026-07-10 08:00:00', dismissed: false },
    { id: '5', severity: 'info', title: 'DHCP Lease Pool Running Low', message: 'The incusbr0 bridge has only 12 available DHCP leases remaining in the 10.155.24.0/24 range.', source: 'Network Monitor', timestamp: '2026-07-09 17:22:00', dismissed: false },
  ]);

  const [filter, setFilter] = useState<'all' | Severity>('all');
  const [showDismissed, setShowDismissed] = useState(false);

  const handleDismiss = (id: string) => {
    setWarnings(prev => prev.map(w => w.id === id ? { ...w, dismissed: true } : w));
  };

  const handleDismissAll = () => {
    setWarnings(prev => prev.map(w => ({ ...w, dismissed: true })));
  };

  const handleRestore = (id: string) => {
    setWarnings(prev => prev.map(w => w.id === id ? { ...w, dismissed: false } : w));
  };

  const active = warnings.filter(w => !w.dismissed && (filter === 'all' || w.severity === filter));
  const dismissed = warnings.filter(w => w.dismissed);

  const counts = {
    critical: warnings.filter(w => !w.dismissed && w.severity === 'critical').length,
    warning: warnings.filter(w => !w.dismissed && w.severity === 'warning').length,
    info: warnings.filter(w => !w.dismissed && w.severity === 'info').length,
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
            <Bell className="text-rose-500 w-8 h-8" />
            System Warnings
          </h2>
          <p className="text-gray-400 mt-1">Monitor alerts, anomalies, and system health notices.</p>
        </div>
        {active.length > 0 && (
          <button
            onClick={handleDismissAll}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium border border-app-border transition cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-emerald-400" />
            Dismiss All
          </button>
        )}
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-3 gap-4">
        {(['critical', 'warning', 'info'] as Severity[]).map(sev => {
          const cfg = sevConfig[sev];
          return (
            <button
              key={sev}
              onClick={() => setFilter(filter === sev ? 'all' : sev)}
              className={`p-4 rounded-2xl border flex items-center gap-3 transition cursor-pointer ${
                filter === sev ? cfg.color : 'bg-app-card/50 border-app-border-dim hover:bg-app-card/60'
              }`}
            >
              <span className={filter === sev ? '' : 'text-gray-400'}>{cfg.icon}</span>
              <div className="text-left">
                <div className="text-xl font-extrabold text-app-text-h">{counts[sev]}</div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{cfg.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Warnings List */}
      <div className="space-y-3">
        {active.length === 0 ? (
          <div className="p-12 text-center text-gray-500 rounded-2xl border border-app-border-dim bg-app-card/30">
            <BellOff className="w-10 h-10 text-gray-700 mx-auto mb-3" />
            <p className="text-sm font-medium">No active warnings. System is healthy.</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {active.map(w => {
              const cfg = sevConfig[w.severity];
              return (
                <motion.div
                  layout
                  key={w.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, scale: 0.96 }}
                  className={`p-5 rounded-2xl border flex gap-4 ${cfg.color}`}
                >
                  <div className="shrink-0 mt-0.5">{cfg.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h4 className="font-bold text-app-text-h text-sm">{w.title}</h4>
                        <p className="text-xs text-gray-300 mt-1 leading-relaxed">{w.message}</p>
                      </div>
                      <button
                        onClick={() => handleDismiss(w.id)}
                        className="p-1 rounded-lg hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex gap-4 mt-3 text-[10px] text-gray-500">
                      <span>Source: <span className="text-gray-300">{w.source}</span></span>
                      <span>{w.timestamp}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Dismissed section toggle */}
      {dismissed.length > 0 && (
        <div className="space-y-3">
          <button
            onClick={() => setShowDismissed(!showDismissed)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-app-text-h transition cursor-pointer"
          >
            <BellOff className="w-4 h-4" />
            {showDismissed ? 'Hide' : 'Show'} dismissed ({dismissed.length})
          </button>

          <AnimatePresence>
            {showDismissed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                {dismissed.map(w => (
                  <div key={w.id} className="p-4 rounded-xl border border-app-border-dim bg-app-card/30 flex justify-between items-center opacity-50 hover:opacity-75 transition">
                    <div>
                      <div className="text-sm font-semibold text-gray-300">{w.title}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{w.timestamp}</div>
                    </div>
                    <button
                      onClick={() => handleRestore(w.id)}
                      className="text-xs px-3 py-1 rounded-lg bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer border border-app-border-dim"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
