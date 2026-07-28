import React, { useState, useEffect } from 'react';
import { Image, Search, Shield, RefreshCw } from 'lucide-react';
import api from '../../../api/axios';

export default function MemberImagesView() {
  const [images, setImages] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchLocalImages = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/images/');
      setImages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setImages([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocalImages();
  }, []);

  const filtered = images.filter(img => {
    if (!img) return false;
    const alias = img.aliases?.[0]?.name || img.properties?.description || img.properties?.os || img.fingerprint || '';
    return alias.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-app-text-h">Base OS Images</h3>
          <p className="text-gray-400 text-sm mt-1">Available base image templates loaded from the local Tblinc registry.</p>
        </div>
        <button
          onClick={fetchLocalImages}
          className="flex items-center gap-2 px-4 py-2 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl text-xs font-semibold border border-app-border-dim hover:border-app-border transition cursor-pointer self-start"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Registry
        </button>
      </div>

      <div className="flex items-center gap-3 bg-app-card/50 border border-app-border rounded-xl px-4 py-2">
        <Search className="w-5 h-5 text-gray-500" />
        <input
          type="text"
          placeholder="Search OS templates (e.g. ubuntu, alpine)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent border-none text-app-text-h focus:outline-none w-full text-xs font-semibold"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(img => {
          const alias = img.aliases?.[0]?.name || img.properties?.description || (img.fingerprint ? img.fingerprint.substring(0, 12) : 'Unknown');
          return (
            <div key={img.fingerprint || Math.random().toString()} className="p-5 rounded-2xl border border-app-border bg-app-card/40 flex items-center justify-between">
              <div className="space-y-1">
                <div className="font-bold text-app-text-h text-sm font-mono">{alias}</div>
                <div className="text-[10px] text-gray-500 font-mono">Fingerprint: {img.fingerprint ? img.fingerprint.substring(0, 24) : 'N/A'}...</div>
              </div>
              <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[9px] uppercase font-bold">
                {img.type === 'virtual-machine' ? 'VM' : 'Tblinc'}
              </span>
            </div>
          );
        })}{filtered.length === 0 && (
          <div className="col-span-2 p-8 text-center text-gray-500 border border-app-border border-dashed rounded-2xl">
            No base OS templates found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}
