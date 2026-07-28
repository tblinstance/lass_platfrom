import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Activity, Clock, User, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface SystemOperation {
  id: string;
  name: string;
  target: string;
  triggeredBy: string;
  status: 'Success' | 'In Progress' | 'Failed';
  startedAt: string;
  duration: string;
}

export default function OperationsView() {
  const [operations, setOperations] = useState<SystemOperation[]>([
    { id: '1', name: 'Start Instance', target: 'api-gateway-prod', triggeredBy: 'tblinc810', status: 'Success', startedAt: '2026-07-10 23:45:10', duration: '2.1s' },
    { id: '2', name: 'Expand Storage Volume', target: 'db-primary-main-disk', triggeredBy: 'tblinc810', status: 'Success', startedAt: '2026-07-10 23:30:15', duration: '5.4s' },
    { id: '3', name: 'Pull OS Image', target: 'alpine/3.20/amd64', triggeredBy: 'tblinc810', status: 'Success', startedAt: '2026-07-10 22:15:00', duration: '12.8s' },
    { id: '4', name: 'Create Network Bridge', target: 'dmz-bridge', triggeredBy: 'tblinc810', status: 'Failed', startedAt: '2026-07-10 21:04:12', duration: '1.2s' },
    { id: '5', name: 'Rebuild Instance', target: 'backend-api', triggeredBy: 'system-timer', status: 'Success', startedAt: '2026-07-10 20:00:00', duration: '8.7s' },
    { id: '6', name: 'Hot Migrating Container', target: 'worker-node-02', triggeredBy: 'tblinc810', status: 'In Progress', startedAt: '2026-07-10 23:58:05', duration: 'Running' }
  ]);

  const [statusFilter, setStatusFilter] = useState<'all' | 'Success' | 'In Progress' | 'Failed'>('all');

  const filteredOps = operations.filter(op => 
    statusFilter === 'all' || op.status === statusFilter
  );

  return (
    <div className="space-y-6 text-left">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
          <Activity className="text-amber-500 w-8 h-8" />
          Operations Log
        </h2>
        <p className="text-gray-400 mt-1">Audit background tasks, instance deployments, and API server execution logs.</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 p-1.5 rounded-xl border border-app-border-dim bg-app-card/50 backdrop-blur-md w-fit">
        {(['all', 'In Progress', 'Success', 'Failed'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
              statusFilter === status
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-gray-400 hover:text-app-text-h border border-transparent'
            }`}
          >
            {status === 'all' ? 'All Task Audits' : status}
          </button>
        ))}
      </div>

      {/* Operations List Table */}
      <div className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md">
        <div className="overflow-x-auto rounded-xl border border-app-border-dim bg-app-card">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-app-border-dim bg-app-card/50 text-gray-400 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Operation Name</th>
                <th className="px-6 py-4 font-semibold">Target Resource</th>
                <th className="px-6 py-4 font-semibold">Triggered By</th>
                <th className="px-6 py-4 font-semibold">Timestamp</th>
                <th className="px-6 py-4 font-semibold">Duration</th>
                <th className="px-6 py-4 font-semibold text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredOps.map((op) => (
                  <motion.tr
                    layout
                    key={op.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-app-border-dim hover:bg-app-card/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-app-text-h flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500/80" />
                      {op.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-300 text-xs">{op.target}</td>
                    <td className="px-6 py-4 text-gray-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-gray-500" />
                      {op.triggeredBy}
                    </td>
                    <td className="px-6 py-4 text-gray-400 font-mono text-xs">{op.startedAt}</td>
                    <td className="px-6 py-4 font-semibold text-app-text-h">{op.duration}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-semibold uppercase border ${
                        op.status === 'Success'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : op.status === 'Failed'
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                      }`}>
                        {op.status === 'Success' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : op.status === 'Failed' ? (
                          <XCircle className="w-3 h-3 text-rose-400" />
                        ) : (
                          <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                        )}
                        {op.status}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
