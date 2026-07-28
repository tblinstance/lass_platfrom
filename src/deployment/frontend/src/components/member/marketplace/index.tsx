import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, X } from 'lucide-react';

interface MemberMarketplaceProps {
  onLaunchTemplate: (name: string, template: string, tier: 'Free' | 'Pro' | 'Advance') => void;
}

export default function MemberMarketplaceView({ onLaunchTemplate }: MemberMarketplaceProps) {
  const templates = [
    { name: 'WordPress Stack', desc: 'Deploy a WordPress instance with connected MariaDB database.', logo: 'WP', price: '$10/mo' },
    { name: 'PostgreSQL Database', desc: 'Relational database engine with custom volume persistence.', logo: 'PG', price: '$15/mo' },
    { name: 'NodeJS Express API', desc: 'Node runtime environment setup bound with package registry.', logo: 'JS', price: 'Free' },
    { name: 'Django Boilerplate', desc: 'Python Gunicorn server pre-mapped with SQlite instance.', logo: 'PY', price: '$5/mo' },
    { name: 'Laravel Ingress API', desc: 'Composer config and PHP-FPM server mapping pre-loaded.', logo: 'PHP', price: '$5/mo' },
    { name: 'React SPA', desc: 'Vite-powered React boilerplate with automated build pipeline.', logo: 'RE', price: 'Free' },
    { name: 'Vue.js Dashboard', desc: 'Vue3 boilerplate for building rapid frontend dashboards.', logo: 'VU', price: 'Free' },
    { name: 'SvelteKit App', desc: 'Next-gen SvelteKit boilerplate with server-side rendering setup.', logo: 'SV', price: 'Free' },
    { name: 'FastAPI Backend', desc: 'High-performance ASGI server with automatic Swagger docs.', logo: 'FA', price: '$5/mo' },
    { name: 'Flask Microservice', desc: 'Lightweight WSGI Python server for minimal APIs.', logo: 'FL', price: 'Free' },
    { name: 'Next.js Fullstack', desc: 'Production-ready Next.js environment with PM2 management.', logo: 'NX', price: '$10/mo' },
    { name: 'Ruby on Rails', desc: 'Rails MVC framework setup with Puma and reverse proxy.', logo: 'RB', price: '$10/mo' },
    { name: 'Go Microservice', desc: 'Compiled Go binary environment running via systemd daemon.', logo: 'GO', price: 'Free' },
    { name: 'PHP Native Server', desc: 'Standard PHP-FPM pool configured for pure PHP rendering.', logo: 'PHP', price: 'Free' }
  ];

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [launchName, setLaunchName] = useState('');
  const [launchTier, setLaunchTier] = useState<'Free' | 'Pro' | 'Advance'>('Free');

  const handleLaunch = () => {
    if (!launchName || !selectedTemplate) return alert('Name is required');
    onLaunchTemplate(launchName, selectedTemplate, launchTier);
    setSelectedTemplate(null);
    setLaunchName('');
    setLaunchTier('Free');
  };

  return (
    <div className="space-y-6 text-left">
      <div>
        <h3 className="text-2xl font-bold text-app-text-h">App Marketplace</h3>
        <p className="text-gray-400 text-sm mt-1">Select from preset server configurations to launch immediately.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {templates.map(tpl => (
          <div
            key={tpl.name}
            className="p-6 rounded-2xl border border-app-border bg-app-card/40 hover:bg-app-card/80 transition flex flex-col justify-between h-[200px]"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center font-bold text-teal-400">
                  {tpl.logo}
                </div>
                <div className="flex justify-between items-center w-full">
                  <h4 className="font-bold text-app-text-h">{tpl.name}</h4>
                  <span className="text-xs font-bold text-teal-400 bg-teal-500/10 px-2 py-1 rounded-md">{tpl.price}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">{tpl.desc}</p>
            </div>
            <button
              onClick={() => setSelectedTemplate(tpl.name)}
              className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Configure Template
            </button>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {selectedTemplate && (
          <motion.div
            initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
            animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="w-full pt-4"
          >
            <div className="p-6 rounded-2xl border border-teal-500/30 bg-gradient-to-br from-teal-500/5 to-app-card/30 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-teal-400 flex items-center gap-2">
                  <Play className="w-5 h-5" /> Launch {selectedTemplate}
                </h3>
                <button onClick={() => setSelectedTemplate(null)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Container Name</label>
                  <input
                    type="text"
                    value={launchName}
                    onChange={e => setLaunchName(e.target.value)}
                    placeholder={`e.g. ${selectedTemplate.toLowerCase().replace(/\s+/g, '-')}-prod`}
                    className="w-full p-3 bg-app-card/50 border border-app-border rounded-xl text-app-text-h focus:border-teal-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-300">Compute Tier Profile</label>
                  <select
                    value={launchTier}
                    onChange={e => setLaunchTier(e.target.value as any)}
                    className="w-full p-3 bg-app-card/50 border border-app-border rounded-xl text-app-text-h focus:border-teal-500 focus:outline-none appearance-none"
                  >
                    <option value="Free">Free ($0/mo) - 1 vCPU, 512MB RAM</option>
                    <option value="Pro">Pro ($15/mo) - 2 vCPU, 2GB RAM</option>
                    <option value="Advance">Advance ($49/mo) - 4 vCPU, 8GB RAM</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleLaunch}
                  disabled={!launchName}
                  className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-black font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  Deploy via Incus Profile
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
