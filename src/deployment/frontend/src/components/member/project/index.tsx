import React from 'react';
import { Layers, Cpu, HardDrive, Activity } from 'lucide-react';

interface MemberProjectProps {
  instancesCount: number;
}

export default function MemberProjectView({ instancesCount }: MemberProjectProps) {
  return (
    <div className="space-y-6 text-left">
      <div>
        <h3 className="text-2xl font-bold text-app-text-h">Workspace Quotas</h3>
        <p className="text-gray-400 text-sm mt-1">Resource allocation and core thresholds assigned to your workspace.</p>
      </div>

      <div className="p-6 rounded-2xl border border-app-border bg-app-card/40 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-lg font-bold text-app-text-h">Workspace Resource Allocations</h4>
            <div className="text-xs text-gray-500 mt-0.5">Assigned to: sandbox-member-default</div>
          </div>
          <span className="px-2.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] uppercase font-bold tracking-wider">
            Healthy Status
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* CPU Limit */}
          <div className="p-5 rounded-2xl border border-app-border-dim bg-app-card/30 space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-gray-400 flex items-center gap-1.5"><Cpu className="w-4.5 h-4.5 text-purple-400" /> Compute (CPU)</span>
              <span className="text-app-text-h">{instancesCount * 2} / 8 cores</span>
            </div>
            <div className="space-y-2">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full"
                  style={{ width: `${((instancesCount * 2) / 8) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 text-right">
                {Math.round(((instancesCount * 2) / 8) * 100)}% Consumed
              </div>
            </div>
          </div>

          {/* Memory Limit */}
          <div className="p-5 rounded-2xl border border-app-border-dim bg-app-card/30 space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-gray-400 flex items-center gap-1.5"><Activity className="w-4.5 h-4.5 text-blue-400" /> Memory (RAM)</span>
              <span className="text-app-text-h">{instancesCount * 1} / 8 GB</span>
            </div>
            <div className="space-y-2">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{ width: `${((instancesCount * 1) / 8) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 text-right">
                {Math.round(((instancesCount * 1) / 8) * 100)}% Consumed
              </div>
            </div>
          </div>

          {/* Storage Limit */}
          <div className="p-5 rounded-2xl border border-app-border-dim bg-app-card/30 space-y-4">
            <div className="flex justify-between items-center text-xs font-semibold">
              <span className="text-gray-400 flex items-center gap-1.5"><HardDrive className="w-4.5 h-4.5 text-pink-400" /> Disk Quota</span>
              <span className="text-app-text-h">{instancesCount * 20} / 200 GB</span>
            </div>
            <div className="space-y-2">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-pink-500 rounded-full"
                  style={{ width: `${((instancesCount * 20) / 200) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-500 text-right">
                {Math.round(((instancesCount * 20) / 200) * 100)}% Consumed
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
