import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image as ImageIcon, Search, Trash2, Shield, Cpu, HardDrive, RefreshCw, X, Download, Activity, Upload } from 'lucide-react';
import api from '../../api/axios';

interface OsImage {
  id: string;
  alias: string;
  fingerprint: string;
  type: 'container' | 'virtual-machine';
  architecture: string;
  sizeMB: number;
  uploadedAt: string;
}

export default function ImagesView() {
  const [images, setImages] = useState<OsImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Pull / Import Tabs
  const [activeTab, setActiveTab] = useState<'base' | 'iso' | 'file' | 'oci'>('base');

  // Base Image state
  const [imageAlias, setImageAlias] = useState('');
  const [imageType, setImageType] = useState<'container' | 'virtual-machine'>('container');
  const [remoteSearch, setRemoteSearch] = useState('');

  // Custom ISO state
  const [isoUrl, setIsoUrl] = useState('');
  const [publicImage, setPublicImage] = useState(false);

  // File Upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // OCI state
  const [ociAlias, setOciAlias] = useState('');
  const [ociServer, setOciServer] = useState('https://registry-1.docker.io');

  // Progress and state
  const [isPulling, setIsPulling] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  // Remote images browsing list
  const [remoteImages, setRemoteImages] = useState<any[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  const fetchRemoteImages = async () => {
    if (remoteImages.length > 0) return;
    setLoadingRemote(true);
    try {
      const res = await api.get('/api/images/remote/');
      setRemoteImages(res.data);
    } catch (err) {
      console.error('Failed to load remote images list', err);
    } finally {
      setLoadingRemote(false);
    }
  };

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/images/');
      const data = Array.isArray(response.data) ? response.data : [];
      const mapped = data.map((img: any) => {
        if (!img) return null;
        let alias = '';
        if (img.aliases && Array.isArray(img.aliases) && img.aliases.length > 0 && img.aliases[0]?.name) {
          alias = img.aliases[0].name;
        } else if (img.properties && img.properties.description) {
          alias = img.properties.description;
        } else if (img.properties && img.properties.os) {
          alias = `${img.properties.os} ${img.properties.release || ''}`;
        } else {
          alias = img.fingerprint ? img.fingerprint.substring(0, 12) : 'Unknown';
        }

        const fingerprint = img.fingerprint ? img.fingerprint.substring(0, 12) : 'N/A';

        return {
          id: img.fingerprint || Math.random().toString(),
          alias: alias,
          fingerprint: fingerprint,
          type: img.type === 'virtual-machine' ? 'virtual-machine' : 'container',
          architecture: img.architecture || 'x86_64',
          sizeMB: Math.round((img.size || 0) / (1024 * 1024)),
          uploadedAt: img.created_at && typeof img.created_at === 'string' ? img.created_at.split('T')[0] : 'N/A'
        };
      }).filter((x): x is OsImage => !!x);
      setImages(mapped);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to load images.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      fetchRemoteImages();
    }
  }, [isModalOpen]);

  const handlePullImage = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsPulling(true);
    setPullProgress(0);
    setError(null);

    let progressInterval: any;

    try {
      let response;
      if (activeTab === 'base') {
        if (!imageAlias) return;
        progressInterval = setInterval(() => {
          setPullProgress(prev => Math.min(prev + 5, 90));
        }, 1000);

        response = await api.post('/api/images/', {
          mode: 'simplestreams',
          alias: imageAlias,
          type: imageType
        });
      } else if (activeTab === 'oci') {
        if (!ociAlias) return;
        progressInterval = setInterval(() => {
          setPullProgress(prev => Math.min(prev + 5, 90));
        }, 1000);

        response = await api.post('/api/images/', {
          mode: 'oci',
          alias: ociAlias,
          server: ociServer || 'https://registry-1.docker.io'
        });
      } else if (activeTab === 'iso') {
        if (!isoUrl) return;
        progressInterval = setInterval(() => {
          setPullProgress(prev => Math.min(prev + 3, 95));
        }, 1500);

        response = await api.post('/api/images/', {
          mode: 'iso',
          url: isoUrl,
          public: String(publicImage)
        });
      } else if (activeTab === 'file') {
        if (!selectedFile) return;
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('public', String(publicImage));

        response = await api.post('/api/images/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setPullProgress(percentCompleted);
          }
        });
      }

      if (!response) return;

      const operationUrl = response.data.operation; // e.g. "/1.0/operations/uuid"
      const uuid = operationUrl ? operationUrl.split('/').pop() : null;

      if (!uuid) {
        // If it was sync or immediate, finish
        if (progressInterval) clearInterval(progressInterval);
        setPullProgress(100);
        setTimeout(() => {
          setIsPulling(false);
          setIsModalOpen(false);
          resetForm();
          fetchImages();
        }, 500);
        return;
      }

      // Poll backend operations endpoint
      const checkInterval = setInterval(async () => {
        try {
          const opRes = await api.get(`/api/operations/${uuid}/`);
          const opData = opRes.data;

          if (opData.status === 'Success') {
            clearInterval(checkInterval);
            if (progressInterval) clearInterval(progressInterval);
            setPullProgress(100);
            setTimeout(() => {
              setIsPulling(false);
              setIsModalOpen(false);
              resetForm();
              fetchImages();
            }, 500);
          } else if (opData.status === 'Failure' || opData.status_code === 400 || opData.err) {
            clearInterval(checkInterval);
            if (progressInterval) clearInterval(progressInterval);
            setIsPulling(false);
            setError(opData.err || 'Image pull operation failed.');
          }
        } catch (err) {
          // If operation is not found, assume complete
          clearInterval(checkInterval);
          if (progressInterval) clearInterval(progressInterval);
          setPullProgress(100);
          setTimeout(() => {
            setIsPulling(false);
            setIsModalOpen(false);
            resetForm();
            fetchImages();
          }, 500);
        }
      }, 2000);

    } catch (err: any) {
      if (progressInterval) clearInterval(progressInterval);
      console.error(err);
      setError(err.response?.data?.error || 'Failed to complete image pull request.');
      setIsPulling(false);
    }
  };

  const resetForm = () => {
    setImageAlias('');
    setIsoUrl('');
    setOciAlias('');
    setSelectedFile(null);
  };

  const handleDelete = async (fingerprint: string) => {
    if (!window.confirm(`Are you sure you want to delete this image template?`)) {
      return;
    }
    setError(null);
    try {
      await api.delete(`/api/images/${fingerprint}/`);
      setImages(prev => prev.filter(img => img.id !== fingerprint));
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || `Failed to delete image template.`);
      fetchImages();
    }
  };

  const filteredImages = images.filter(img => 
    img.alias.toLowerCase().includes(search.toLowerCase()) || img.fingerprint.includes(search)
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
            <ImageIcon className="text-violet-500 w-8 h-8" />
            Image Templates
          </h2>
          <p className="text-gray-400 mt-1">Manage bootable OS templates and container base images.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchImages}
            title="Refresh List"
            className="p-2.5 rounded-xl bg-app-card hover:bg-app-border-dim border border-app-border text-gray-400 hover:text-app-text-h active:scale-95 transition cursor-pointer"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-violet-500' : ''}`} />
          </button>
          
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-app-text-h rounded-xl font-medium shadow-lg hover:shadow-violet-500/20 active:scale-95 transition cursor-pointer"
          >
            <Download className="w-5 h-5" />
            Pull Image
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-start gap-2.5 text-sm">
          <Shield className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
          <div className="flex-1 flex justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-gray-400 hover:text-rose-400 transition ml-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-app-border-dim bg-app-card/50 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search images by alias or fingerprint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h placeholder:text-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Images List */}
      {loading && images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Activity className="w-12 h-12 text-violet-500 animate-spin" />
          <p className="text-gray-400 font-medium">Loading OS image templates...</p>
        </div>
      ) : filteredImages.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-app-border rounded-2xl bg-app-card/20">
          <ImageIcon className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-app-text-h mb-1">No Images Found</h3>
          <p className="text-gray-400 max-w-xs mx-auto text-sm">
            {search ? 'No image templates match your filters.' : 'Pull your first OS image template to launch new containers or VMs.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredImages.map(img => (
              <motion.div
                layout
                key={img.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-5 rounded-2xl border border-app-border bg-gradient-to-br from-app-card/60 to-app-card/20 hover:bg-app-card/80 transition-all duration-200 flex justify-between items-center"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5">
                    <span className="font-semibold text-app-text-h text-md">{img.alias}</span>
                    <span className="px-2 py-0.5 rounded bg-app-border-dim text-[10px] font-semibold text-gray-400 uppercase tracking-wide border border-app-border">
                      {img.type === 'container' ? 'Tblinc' : 'VM'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <div className="font-mono">FP: {img.fingerprint}</div>
                    <div>Size: <span className="font-medium text-app-text-h">{img.sizeMB} MB</span></div>
                    <div>Arch: <span className="text-app-text-h">{img.architecture}</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDelete(img.id)}
                    title="Delete Template"
                    className="p-2.5 rounded-xl text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 transition cursor-pointer border border-transparent hover:border-rose-500/20"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Pull / Import Image Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => !isPulling && setIsModalOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full ${activeTab === 'base' ? 'max-w-2xl' : 'max-w-md'} bg-app-card border border-app-border rounded-2xl p-6 shadow-2xl z-50 text-left transition-all duration-300`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-app-text-h flex items-center gap-2">
                  <Download className="text-violet-500" />
                  Add OS Image
                </h3>
                {!isPulling && (
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-lg bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              {isPulling ? (
                <div className="py-6 space-y-4 text-center">
                  <RefreshCw className="w-10 h-10 text-violet-400 animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="font-semibold text-app-text-h">
                      {activeTab === 'file' ? 'Uploading template file...' : 'Importing template...'}
                    </p>
                    <p className="text-xs text-gray-400 font-mono">
                      {activeTab === 'base' && `Fetching image: ${imageAlias}`}
                      {activeTab === 'oci' && `Pulling OCI: ${ociAlias}`}
                      {activeTab === 'iso' && `Downloading URL...`}
                      {activeTab === 'file' && `Uploading: ${selectedFile?.name}`}
                    </p>
                  </div>
                  <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-violet-500 transition-all duration-300" style={{ width: `${pullProgress}%` }} />
                  </div>
                  <p className="text-xs text-gray-500">{pullProgress}% completed</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Tabs */}
                  <div className="flex border-b border-app-border-dim gap-1">
                    {(['base', 'iso', 'file', 'oci'] as const).map(tab => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 border-b-2 font-medium text-xs capitalize transition cursor-pointer ${
                          activeTab === tab
                            ? 'border-violet-500 text-violet-400'
                            : 'border-transparent text-gray-400 hover:text-app-text-h'
                        }`}
                      >
                        {tab === 'base' && 'Base Image'}
                        {tab === 'iso' && 'Use Custom ISO'}
                        {tab === 'file' && 'Upload File'}
                        {tab === 'oci' && 'Use OCI'}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handlePullImage} className="space-y-4">
                    {/* Tab contents */}
                    {activeTab === 'base' && (
                      <div className="space-y-4 text-left">
                        <div className="space-y-3">
                          <label className="text-xs text-gray-400 font-semibold">Browse Public Registry Templates</label>
                          <div className="relative">
                            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Search OS templates (e.g. ubuntu, alpine, debian)..."
                              value={remoteSearch}
                              onChange={(e) => setRemoteSearch(e.target.value)}
                              className="w-full pl-9 pr-4 py-2 rounded-xl border border-app-border bg-app-card/70 text-app-text-h placeholder:text-gray-500 focus:outline-none focus:border-violet-500 text-xs transition-colors"
                            />
                          </div>

                          <div className="border border-app-border-dim rounded-xl bg-app-card/30 overflow-hidden">
                            <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-app-card/50 text-[10px] font-semibold text-gray-400 border-b border-app-border-dim uppercase tracking-wider">
                              <div className="col-span-6">OS Template Alias</div>
                              <div className="col-span-2 text-center">Type</div>
                              <div className="col-span-2 text-right">Size</div>
                              <div className="col-span-2"></div>
                            </div>
                            
                            <div className="max-h-56 overflow-y-auto divide-y divide-app-border-dim/50">
                              {loadingRemote ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                  <Activity className="w-8 h-8 text-violet-500 animate-spin" />
                                  <p className="text-xs text-gray-400">Loading remote OS registry index...</p>
                                </div>
                              ) : remoteImages.filter(r => 
                                  r.alias.toLowerCase().includes(remoteSearch.toLowerCase()) ||
                                  (r.aliases && r.aliases.some((a: string) => a.toLowerCase().includes(remoteSearch.toLowerCase()))) ||
                                  r.os.toLowerCase().includes(remoteSearch.toLowerCase()) ||
                                  r.release.toLowerCase().includes(remoteSearch.toLowerCase())
                                ).length === 0 ? (
                                 <div className="text-center py-12 text-xs text-gray-500">
                                   No remote templates match your search.
                                 </div>
                              ) : (
                                remoteImages.filter(r => 
                                  r.alias.toLowerCase().includes(remoteSearch.toLowerCase()) ||
                                  (r.aliases && r.aliases.some((a: string) => a.toLowerCase().includes(remoteSearch.toLowerCase()))) ||
                                  r.os.toLowerCase().includes(remoteSearch.toLowerCase()) ||
                                  r.release.toLowerCase().includes(remoteSearch.toLowerCase())
                                ).map(r => {
                                  const isSelected = imageAlias === r.alias;
                                  return (
                                    <div
                                      key={`${r.fingerprint}-${r.type}`}
                                      onClick={() => {
                                        setImageAlias(r.alias);
                                        setImageType(r.type);
                                      }}
                                      className={`grid grid-cols-12 gap-2 px-4 py-2.5 text-xs items-center cursor-pointer transition-colors ${
                                        isSelected 
                                          ? 'bg-violet-600/10 hover:bg-violet-600/15 text-violet-300' 
                                          : 'hover:bg-app-card/40 text-gray-300'
                                      }`}
                                    >
                                      <div className="col-span-6 flex flex-col">
                                        <span className="font-semibold text-app-text-h truncate">{r.alias}</span>
                                        <span className="text-[10px] text-gray-500 truncate">
                                          {r.os} {r.release || ''}
                                          {r.aliases && r.aliases.length > 1 && (
                                            <span className="text-gray-500 font-mono text-[9px] ml-1.5 opacity-60">
                                              ({r.aliases.slice(1).join(', ')})
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                      <div className="col-span-2 text-center">
                                        <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                                          r.type === 'container' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                            : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                        }`}>
                                          {r.type === 'container' ? 'Tblinc' : 'VM'}
                                        </span>
                                      </div>
                                      <div className="col-span-2 text-right font-mono text-[10px] text-gray-400">
                                        {r.sizeMB} MB
                                      </div>
                                      <div className="col-span-2 text-right">
                                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ml-auto ${
                                          isSelected ? 'border-violet-500 bg-violet-600' : 'border-app-border bg-transparent'
                                        }`}>
                                          {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {imageAlias && (
                            <div className="p-3 rounded-xl border border-violet-500/10 bg-violet-500/5 text-xs text-violet-300 flex items-center justify-between">
                              <div className="flex flex-col">
                                <span className="font-semibold">Selected OS Image:</span>
                                <span className="font-mono text-[10px] text-gray-400">{imageAlias}</span>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-violet-500/20 text-[10px] font-bold uppercase tracking-wider">
                                {imageType === 'container' ? 'Tblinc Container' : 'Virtual Machine'}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'iso' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs text-gray-400 font-semibold">Custom ISO URL</label>
                          <input
                            type="url"
                            required
                            placeholder="https://example.com/distro-server.iso"
                            value={isoUrl}
                            onChange={(e) => setIsoUrl(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-violet-500 transition-colors"
                          />
                          <p className="text-[10px] text-gray-500 mt-1">Provide a direct download link to the ISO image file.</p>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="public-iso"
                            checked={publicImage}
                            onChange={(e) => setPublicImage(e.target.checked)}
                            className="accent-violet-500"
                          />
                          <label htmlFor="public-iso" className="text-xs text-gray-300 select-none">Make ISO image public</label>
                        </div>
                      </div>
                    )}

                    {activeTab === 'file' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs text-gray-400 font-semibold">Upload Image File</label>
                          <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-app-border hover:border-violet-500/50 rounded-xl p-8 text-center cursor-pointer bg-app-card/30 hover:bg-app-card/50 transition-colors flex flex-col items-center justify-center gap-2"
                          >
                            <Upload className="w-8 h-8 text-gray-500 group-hover:text-violet-400" />
                            <span className="text-sm font-semibold text-app-text-h">
                              {selectedFile ? selectedFile.name : 'Select or drop image file (.iso, .img, .tar.gz)'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {selectedFile ? `${Math.round(selectedFile.size / (1024 * 1024))} MB` : 'Drag and drop files here'}
                            </span>
                            <input 
                              type="file"
                              ref={fileInputRef}
                              required
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  setSelectedFile(e.target.files[0]);
                                }
                              }}
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="public-file"
                            checked={publicImage}
                            onChange={(e) => setPublicImage(e.target.checked)}
                            className="accent-violet-500"
                          />
                          <label htmlFor="public-file" className="text-xs text-gray-300 select-none">Make uploaded image public</label>
                        </div>
                      </div>
                    )}

                    {activeTab === 'oci' && (
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-xs text-gray-400 font-semibold">Docker / OCI Registry Tag</label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. ubuntu:latest or alpine:3.21"
                            value={ociAlias}
                            onChange={(e) => setOciAlias(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-violet-500 transition-colors"
                          />
                          <p className="text-[10px] text-gray-500 mt-1">Docker image tag to pull.</p>
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs text-gray-400 font-semibold">Registry Server URL</label>
                          <input
                            type="url"
                            required
                            placeholder="https://registry-1.docker.io"
                            value={ociServer}
                            onChange={(e) => setOciServer(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-violet-500 transition-colors"
                          />
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-2.5 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition cursor-pointer text-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-app-text-h rounded-xl font-medium transition cursor-pointer text-center shadow-lg hover:shadow-violet-500/20"
                      >
                        {activeTab === 'file' ? 'Upload & Import' : 'Pull Image'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
