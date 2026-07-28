import React, { useState, useEffect } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import api from '../../../api/axios';

export default function MemberStorageView() {
  const [pools, setPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPools = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/storage-pools/');
      setPools(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, []);

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold text-app-text-h">Storage Pools</h3>
          <p className="text-gray-400 text-sm mt-1">Available block volumes and storage directories allocated to the cluster.</p>
        </div>
        <button
          onClick={fetchPools}
          className="flex items-center gap-2 px-4 py-2 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl text-xs font-semibold border border-app-border-dim hover:border-app-border transition cursor-pointer self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pools.map(pool => (
          <div key={pool.name} className="p-6 rounded-2xl border border-app-border bg-app-card/40 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <HardDrive className="text-teal-400 w-5 h-5" />
                <span className="font-bold text-app-text-h text-sm font-mono">{pool.name}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-gray-400 border border-zinc-700 text-[9px] uppercase font-bold tracking-wider font-mono">
                {pool.driver}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono text-gray-400 border-t border-app-border-dim pt-4">
              <div>Source Path: <span className="text-gray-200 truncate block max-w-[150px]">{pool.config?.source || 'Default'}</span></div>
              {pool.config?.size && (
                <div>Total Size: <span className="text-emerald-400">{pool.config.size}</span></div>
              )}
            </div>
          </div>
        ))}
        {pools.length === 0 && (
          <div className="col-span-2 p-12 text-center text-gray-500 border border-app-border border-dashed rounded-2xl">
            No active storage pools detected.
          </div>
        )}
      </div>
    </div>
  );
}
