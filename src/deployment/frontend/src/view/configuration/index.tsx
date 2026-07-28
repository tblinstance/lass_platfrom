import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Plus, Trash2, Edit3, Check, X, Search } from 'lucide-react';

interface ConfigEntry {
  id: string;
  key: string;
  value: string;
  description: string;
  category: 'networking' | 'security' | 'storage' | 'instances';
  editable: boolean;
}

export default function ConfigurationView() {
  const [entries, setEntries] = useState<ConfigEntry[]>([
    { id: '1', key: 'core.https_address', value: ':8443', description: 'HTTPS API listening address', category: 'networking', editable: true },
    { id: '2', key: 'core.trust_password', value: '••••••••', description: 'Cluster trust password (hashed)', category: 'security', editable: false },
    { id: '3', key: 'core.proxy_https', value: '', description: 'HTTPS proxy URL (empty = no proxy)', category: 'networking', editable: true },
    { id: '4', key: 'images.auto_update_cached', value: 'true', description: 'Auto-update cached images', category: 'instances', editable: true },
    { id: '5', key: 'images.auto_update_interval', value: '6', description: 'Hours between auto-update checks', category: 'instances', editable: true },
    { id: '6', key: 'storage.backups_volume', value: 'local-zfs/backups', description: 'Volume path for instance backups', category: 'storage', editable: true },
    { id: '7', key: 'cluster.https_address', value: '192.168.1.144:8443', description: 'Cluster member API address', category: 'networking', editable: true },
    { id: '8', key: 'security.acme.agree_tos', value: 'false', description: 'Agree to ACME TOS for auto TLS', category: 'security', editable: true },
  ]);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | ConfigEntry['category']>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<ConfigEntry['category']>('instances');

  const handleEdit = (entry: ConfigEntry) => {
    setEditingId(entry.id);
    setEditValue(entry.value === '••••••••' ? '' : entry.value);
  };

  const handleSave = (id: string) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, value: editValue } : e));
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  };

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey) return;
    setEntries(prev => [{
      id: Date.now().toString(),
      key: newKey,
      value: newValue,
      description: newDesc,
      category: newCategory,
      editable: true
    }, ...prev]);
    setNewKey(''); setNewValue(''); setNewDesc('');
    setIsAddingNew(false);
  };

  const categoryColors: Record<string, string> = {
    networking: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    security: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    storage: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
    instances: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  };

  const filtered = entries.filter(e => {
    const matchCat = categoryFilter === 'all' || e.category === categoryFilter;
    const matchSearch = e.key.toLowerCase().includes(search.toLowerCase()) || e.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
            <Settings className="text-slate-400 w-8 h-8" />
            Configuration
          </h2>
          <p className="text-gray-400 mt-1">Manage global TblInc Cloud server configuration key-value pairs.</p>
        </div>
        <button
          onClick={() => setIsAddingNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-600 hover:bg-slate-500 text-app-text-h rounded-xl font-medium shadow-lg active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Config Key
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 p-4 rounded-2xl border border-app-border-dim bg-app-card/50">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search config keys..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h placeholder:text-gray-400 focus:outline-none focus:border-slate-400 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'networking', 'security', 'storage', 'instances'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-xl capitalize text-xs font-semibold transition cursor-pointer border ${
                categoryFilter === cat
                  ? 'bg-white/10 border-white/20 text-app-text-h'
                  : 'bg-app-card/50 border-app-border-dim text-gray-400 hover:text-app-text-h'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Add New Form */}
      <AnimatePresence>
        {isAddingNew && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddNew} className="p-5 rounded-2xl border border-app-border bg-app-card/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Key</label>
                <input required value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="e.g. core.proxy_http" className="w-full px-4 py-2 rounded-xl border border-app-border bg-app-card/70 text-app-text-h font-mono text-sm focus:outline-none focus:border-slate-400 transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Value</label>
                <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="e.g. http://proxy:3128" className="w-full px-4 py-2 rounded-xl border border-app-border bg-app-card/70 text-app-text-h font-mono text-sm focus:outline-none focus:border-slate-400 transition-colors" />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-semibold">Description</label>
                <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Brief description..." className="w-full px-4 py-2 rounded-xl border border-app-border bg-app-card/70 text-app-text-h text-sm focus:outline-none focus:border-slate-400 transition-colors" />
              </div>
              <div className="flex gap-2">
                <select
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value as ConfigEntry['category'])}
                  className="flex-1 px-3 py-2 rounded-xl border border-app-border bg-app-card/70 text-app-text-h text-sm focus:outline-none cursor-pointer"
                >
                  <option value="networking">Networking</option>
                  <option value="security">Security</option>
                  <option value="storage">Storage</option>
                  <option value="instances">Instances</option>
                </select>
                <button type="submit" className="p-2 bg-emerald-600 hover:bg-emerald-700 text-app-text-h rounded-xl transition cursor-pointer"><Check className="w-4 h-4" /></button>
                <button type="button" onClick={() => setIsAddingNew(false)} className="p-2 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl transition cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Config Table */}
      <div className="overflow-x-auto rounded-2xl border border-app-border">
        <table className="w-full text-sm text-left bg-app-card/30">
          <thead>
            <tr className="border-b border-app-border-dim bg-app-card/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-4">Configuration Key</th>
              <th className="px-6 py-4">Value</th>
              <th className="px-6 py-4 hidden md:table-cell">Description</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {filtered.map(entry => (
                <motion.tr
                  layout
                  key={entry.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border-b border-app-border-dim hover:bg-white/[0.015] transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-indigo-300 text-xs">{entry.key}</td>
                  <td className="px-6 py-4 font-mono text-app-text-h font-semibold text-xs max-w-[180px]">
                    {editingId === entry.id ? (
                      <input
                        autoFocus
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave(entry.id)}
                        className="w-full px-2 py-1 rounded-lg border border-slate-400 bg-app-card/80 text-app-text-h font-mono text-xs focus:outline-none"
                      />
                    ) : (
                      <span className={entry.value === '' ? 'text-gray-600 italic' : ''}>{entry.value || 'not set'}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs hidden md:table-cell">{entry.description}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase border ${categoryColors[entry.category]}`}>
                      {entry.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-1">
                      {editingId === entry.id ? (
                        <>
                          <button onClick={() => handleSave(entry.id)} className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 rounded-lg text-gray-500 hover:bg-app-border-dim transition cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                        </>
                      ) : (
                        <>
                          {entry.editable && (
                            <button onClick={() => handleEdit(entry)} className="p-1.5 rounded-lg text-gray-500 hover:text-slate-300 hover:bg-app-border-dim transition cursor-pointer"><Edit3 className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => handleDelete(entry.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
    </div>
  );
}
