import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { HardDrive, Database, Server, Plus, Info, RefreshCw, Folder, Trash2 } from 'lucide-react';

interface StoragePool {
  id: string;
  name: string;
  driver: 'zfs' | 'dir' | 'btrfs' | 'lvm';
  status: 'Active' | 'Degraded' | 'Inactive';
  usedGB: number;
  totalGB: number;
  location: string;
  volumeCount: number;
}

interface StorageVolume {
  id: string;
  name: string;
  pool: string;
  type: 'container' | 'custom' | 'virtual-machine';
  usedGB: number;
  attachedTo: string;
}

export default function StorageView() {
  const [pools, setPools] = useState<StoragePool[]>([
    { id: '1', name: 'local-zfs', driver: 'zfs', status: 'Active', usedGB: 182, totalGB: 500, location: '/var/lib/incus/storage-pools/local-zfs', volumeCount: 6 },
    { id: '2', name: 'fast-ssd', driver: 'dir', status: 'Active', usedGB: 85, totalGB: 240, location: '/mnt/fast-ssd/storage', volumeCount: 3 },
    { id: '3', name: 'backup-hdd', driver: 'btrfs', status: 'Active', usedGB: 412, totalGB: 1000, location: '/mnt/backups/storage', volumeCount: 4 },
  ]);

  const [volumes, setVolumes] = useState<StorageVolume[]>([
    { id: '101', name: 'api-gateway-prod-disk', pool: 'local-zfs', type: 'container', usedGB: 40, attachedTo: 'api-gateway-prod' },
    { id: '102', name: 'db-primary-main-disk', pool: 'fast-ssd', type: 'virtual-machine', usedGB: 120, attachedTo: 'db-primary-main' },
    { id: '103', name: 'persistent-logs', pool: 'backup-hdd', type: 'custom', usedGB: 85, attachedTo: 'worker-node-01' },
    { id: '104', name: 'backend-api-disk', pool: 'local-zfs', type: 'container', usedGB: 15, attachedTo: 'backend-api' },
  ]);

  const [activePoolId, setActivePoolId] = useState<string>('1');
  const [isNewVolumeModalOpen, setIsNewVolumeModalOpen] = useState(false);
  const [isNewPoolModalOpen, setIsNewPoolModalOpen] = useState(false);

  // New Pool Form State
  const [poolName, setPoolName] = useState('');
  const [poolDriver, setPoolDriver] = useState<'zfs' | 'dir' | 'btrfs' | 'lvm'>('zfs');
  const [poolSize, setPoolSize] = useState(250);

  // New Volume Form State
  const [volumeName, setVolumeName] = useState('');
  const [volumeSize, setVolumeSize] = useState(10);
  const [volumeType, setVolumeType] = useState<'custom' | 'container' | 'virtual-machine'>('custom');

  const selectedPool = pools.find(p => p.id === activePoolId) || pools[0];
  const selectedPoolVolumes = volumes.filter(v => v.pool === selectedPool.name);

  const handleCreatePool = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poolName) return;

    const newPool: StoragePool = {
      id: Date.now().toString(),
      name: poolName.toLowerCase().replace(/\s+/g, '-'),
      driver: poolDriver,
      status: 'Active',
      usedGB: 0,
      totalGB: poolSize,
      location: `/var/lib/incus/storage-pools/${poolName}`,
      volumeCount: 0
    };

    setPools(prev => [...prev, newPool]);
    setPoolName('');
    setIsNewPoolModalOpen(false);
  };

  const handleCreateVolume = (e: React.FormEvent) => {
    e.preventDefault();
    if (!volumeName) return;

    const newVolume: StorageVolume = {
      id: Date.now().toString(),
      name: volumeName.toLowerCase().replace(/\s+/g, '-'),
      pool: selectedPool.name,
      type: volumeType,
      usedGB: volumeSize,
      attachedTo: 'None'
    };

    // Update volume list and pool count
    setVolumes(prev => [...prev, newVolume]);
    setPools(prev => prev.map(p => 
      p.id === selectedPool.id 
        ? { ...p, volumeCount: p.volumeCount + 1, usedGB: Math.min(p.usedGB + volumeSize, p.totalGB) }
        : p
    ));

    setVolumeName('');
    setIsNewVolumeModalOpen(false);
  };

  const handleDeleteVolume = (id: string, size: number) => {
    setVolumes(prev => prev.filter(v => v.id !== id));
    setPools(prev => prev.map(p => 
      p.name === selectedPool.name 
        ? { ...p, volumeCount: Math.max(0, p.volumeCount - 1), usedGB: Math.max(0, p.usedGB - size) }
        : p
    ));
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
            <HardDrive className="text-pink-500 w-8 h-8" />
            Storage Pools
          </h2>
          <p className="text-gray-400 mt-1">Manage storage backends, mountpoints, and storage volumes.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsNewPoolModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-app-border-dim border border-app-border hover:border-pink-500/30 hover:bg-pink-500/10 text-app-text-h rounded-xl font-medium transition cursor-pointer"
          >
            <Plus className="w-5 h-5 text-pink-400" />
            New Pool
          </button>
        </div>
      </div>

      {/* Pools list & Detailed Allocation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pools Sidebar Panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="text-sm font-semibold text-gray-400 uppercase tracking-wider px-1">Active Storage Backends</div>
          <div className="space-y-3">
            {pools.map((pool) => {
              const usedPercentage = Math.round((pool.usedGB / pool.totalGB) * 100);
              const isActive = pool.id === activePoolId;
              
              return (
                <button
                  key={pool.id}
                  onClick={() => setActivePoolId(pool.id)}
                  className={`w-full p-5 rounded-2xl border text-left flex flex-col gap-4 transition duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-br from-pink-500/15 to-pink-500/5 border-pink-500/50 shadow-lg shadow-pink-500/5'
                      : 'bg-app-card/50 border-app-border-dim hover:border-app-border hover:bg-app-card/60'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2">
                      <Database className={`w-5 h-5 ${isActive ? 'text-pink-400' : 'text-gray-400'}`} />
                      <span className="font-semibold text-app-text-h">{pool.name}</span>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-semibold rounded bg-app-border-dim text-gray-400 uppercase">
                      {pool.driver}
                    </span>
                  </div>

                  <div className="space-y-2 w-full">
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Usage</span>
                      <span className="font-medium text-app-text-h">{pool.usedGB} GB / {pool.totalGB} GB ({usedPercentage}%)</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-pink-500 rounded-full"
                        style={{ width: `${usedPercentage}%` }}
                      />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Pool Details & Volumes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-6 border-b border-app-border-dim">
              <div>
                <div className="text-xs font-semibold text-pink-400 uppercase tracking-widest">Active Pool Details</div>
                <h3 className="text-xl font-bold text-app-text-h mt-1">{selectedPool.name}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsNewVolumeModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-app-text-h rounded-xl text-sm font-semibold shadow-lg hover:shadow-pink-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Create Volume
                </button>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Mount Path</div>
                <div className="text-sm font-mono text-gray-300 break-all bg-app-card/30 p-2 rounded-lg border border-app-border-dim">
                  {selectedPool.location}
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Driver Mode</div>
                <div className="text-sm font-semibold text-app-text-h capitalize">{selectedPool.driver} (default)</div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-500">Allocated Volumes</div>
                <div className="text-sm font-semibold text-app-text-h">{selectedPool.volumeCount} Active Volumes</div>
              </div>
            </div>

            {/* Volume Table */}
            <div className="space-y-3 pt-4">
              <div className="text-sm font-semibold text-gray-400">Allocated Storage Volumes</div>
              
              <div className="overflow-x-auto rounded-xl border border-app-border-dim bg-app-card/30">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-app-border-dim bg-app-card/50 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="px-6 py-3.5 font-semibold">Volume Name</th>
                      <th className="px-6 py-3.5 font-semibold">Type</th>
                      <th className="px-6 py-3.5 font-semibold text-right">Capacity</th>
                      <th className="px-6 py-3.5 font-semibold">Attached Instance</th>
                      <th className="px-6 py-3.5 font-semibold text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence mode="popLayout">
                      {selectedPoolVolumes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                            No volumes allocated in this pool. Click Create Volume to start.
                          </td>
                        </tr>
                      ) : (
                        selectedPoolVolumes.map((vol) => (
                          <motion.tr
                            layout
                            key={vol.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="border-b border-app-border-dim hover:bg-app-card/50 transition-colors"
                          >
                            <td className="px-6 py-4 font-medium text-app-text-h flex items-center gap-2">
                              <Folder className="w-4 h-4 text-pink-400" />
                              {vol.name}
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase bg-app-border-dim text-gray-400">
                                {vol.type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right font-semibold text-app-text-h">{vol.usedGB} GB</td>
                            <td className="px-6 py-4 text-gray-300">
                              {vol.attachedTo !== 'None' ? (
                                <span className="flex items-center gap-1.5">
                                  <Server className="w-3.5 h-3.5 text-purple-400" />
                                  {vol.attachedTo}
                                </span>
                              ) : (
                                <span className="text-gray-500 italic">Unattached</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleDeleteVolume(vol.id, vol.usedGB)}
                                className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* New Pool Modal */}
      <AnimatePresence>
        {isNewPoolModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewPoolModalOpen(false)}
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
                  <Database className="text-pink-500" />
                  Create Storage Pool
                </h3>
              </div>

              <form onSubmit={handleCreatePool} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Pool Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. nvme-pool"
                    value={poolName}
                    onChange={(e) => setPoolName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Storage Driver</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['zfs', 'dir', 'btrfs', 'lvm'] as const).map(drv => (
                      <button
                        key={drv}
                        type="button"
                        onClick={() => setPoolDriver(drv)}
                        className={`py-2.5 rounded-xl border text-sm font-semibold capitalize transition cursor-pointer ${
                          poolDriver === drv
                            ? 'bg-pink-500/15 border-pink-500 text-pink-300'
                            : 'bg-app-card/30 border-app-border-dim text-gray-400 hover:text-app-text-h'
                        }`}
                      >
                        {drv}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Pool Disk Size</span>
                    <span className="text-app-text-h font-medium">{poolSize} GB</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="2000"
                    step="50"
                    value={poolSize}
                    onChange={(e) => setPoolSize(parseInt(e.target.value))}
                    className="w-full accent-pink-500 cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewPoolModalOpen(false)}
                    className="flex-1 py-2.5 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-700 text-app-text-h rounded-xl font-medium transition cursor-pointer text-center"
                  >
                    Add Pool
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* New Volume Modal */}
      <AnimatePresence>
        {isNewVolumeModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNewVolumeModalOpen(false)}
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
                  <Folder className="text-pink-500" />
                  Create Storage Volume
                </h3>
              </div>

              <form onSubmit={handleCreateVolume} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Volume Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. redis-data"
                    value={volumeName}
                    onChange={(e) => setVolumeName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-semibold">Volume Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['custom', 'container', 'virtual-machine'] as const).map(vt => (
                      <button
                        key={vt}
                        type="button"
                        onClick={() => setVolumeType(vt)}
                        className={`py-2 rounded-lg border text-xs font-semibold capitalize transition cursor-pointer ${
                          volumeType === vt
                            ? 'bg-pink-500/15 border-pink-500 text-pink-300'
                            : 'bg-app-card/30 border-app-border-dim text-gray-400 hover:text-app-text-h'
                        }`}
                      >
                        {vt === 'custom' ? 'Custom' : vt === 'container' ? 'Container' : 'VM'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Volume Size</span>
                    <span className="text-app-text-h font-medium">{volumeSize} GB</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={volumeSize}
                    onChange={(e) => setVolumeSize(parseInt(e.target.value))}
                    className="w-full accent-pink-500 cursor-pointer"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewVolumeModalOpen(false)}
                    className="flex-1 py-2.5 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-pink-600 hover:bg-pink-700 text-app-text-h rounded-xl font-medium transition cursor-pointer text-center"
                  >
                    Create Volume
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
