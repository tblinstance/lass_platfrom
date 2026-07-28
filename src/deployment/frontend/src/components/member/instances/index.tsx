import React, { useState } from 'react';
import { Server, Plus, Play, Square, Trash2, Globe, Loader2, Cpu, Activity, HardDrive, X, Terminal, LayoutGrid, List, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../../../api/axios';

interface MemberInstance {
  id: string;
  name: string;
  template: string;
  status: 'Running' | 'Stopped' | 'Provisioning';
  ipAddress: string;
  cpu: number;
  ram: string;
  disk: string;
  uptime: string;
  tier: 'Free' | 'Pro' | 'Advance';
  domain?: string;
  project?: string;
  ipv4?: string;
  ipv6?: string;
  price?: string;
}

interface MemberInstancesProps {
  instances: MemberInstance[];
  user?: any;
  onLaunch: (name: string, template: string, tier: 'Free' | 'Pro' | 'Advance' | 'Custom', customSpecs?: any, instanceType?: string, network?: string) => void;
  onAction: (id: string, action: 'start' | 'stop' | 'restart') => void;
  onDestroy: (id: string) => void;
}

export default function MemberInstancesView({ instances, user, onLaunch, onAction, onDestroy }: MemberInstancesProps) {
  // Terminal Console Modal state
  const [terminalInstance, setTerminalInstance] = useState<string | null>(null);
  const [terminalCommand, setTerminalCommand] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<{ command: string; stdout: string; stderr: string; exitCode: number }[]>([]);
  const [terminalLoading, setTerminalLoading] = useState(false);
  const terminalEndRef = React.useRef<HTMLDivElement>(null);

  // View state
  const [activeTab, setActiveTab] = useState<'instances' | 'launch'>('instances');

  // Launch Card State
  const [launchStep, setLaunchStep] = useState(1);
  const [launchName, setLaunchName] = useState('');
  const [launchTemplate, setLaunchTemplate] = useState('ubuntu/24.04');
  const [launchTier, setLaunchTier] = useState<'Free' | 'Pro' | 'Advance' | 'Custom'>('Free');

  // Custom Launch State
  const [customCpu, setCustomCpu] = useState(2);
  const [customRam, setCustomRam] = useState('4GB');
  const [customStorage, setCustomStorage] = useState('20GB');

  const [availableTemplates, setAvailableTemplates] = React.useState<{label: string, value: string, type: string}[]>([]);
  const [availableNetworks, setAvailableNetworks] = React.useState<{id: string, name: string}[]>([]);
  const [launchNetwork, setLaunchNetwork] = useState('');

  React.useEffect(() => {
    const fetchImages = async () => {
      try {
        const res = await api.get('/api/images/');
        if (Array.isArray(res.data)) {
          const templates = res.data.map((img: any) => {
            const alias = img.update_source?.alias || img.aliases?.[0]?.name || img.fingerprint;
            const desc = img.properties?.description || img.properties?.os || alias;
            return { label: desc, value: alias, type: img.type || 'container', fingerprint: img.fingerprint };
          });
          setAvailableTemplates(templates);
          if (templates.length > 0) {
            setLaunchTemplate(templates[0].value);
          }
        }
      } catch (err) {
        console.error("Failed to fetch backend images", err);
      }
    };

    const fetchNets = async () => {
      try {
        const project = user ? `member-${user.username}`.toLowerCase().replace(/_/g, '-').replace(/\./g, '-') : '';
        const res = await api.get(`/api/networks/?project=${project}`);
        if (Array.isArray(res.data)) {
          const nets = res.data.map((net: any) => ({
            id: `${net.name}-${net.project || 'default'}`,
            name: net.name
          }));
          setAvailableNetworks(nets);
          if (nets.length > 0) {
            setLaunchNetwork(nets[0].name);
          }
        }
      } catch (err) {
        console.error("Failed to fetch backend networks", err);
      }
    };
    fetchImages();
    fetchNets();
  }, []);

  const handleLaunch = () => {
    if (!launchName) return alert('Name is required');
    
    const selectedTemplate = availableTemplates.find(t => t.value === launchTemplate);
    const instanceType = selectedTemplate ? selectedTemplate.type : 'container';

    if (launchTier === 'Custom') {
      onLaunch(launchName, launchTemplate, 'Custom', { cpu: customCpu, ram: customRam, storage: customStorage }, instanceType, launchNetwork);
    } else {
      onLaunch(launchName, launchTemplate, launchTier, undefined, instanceType, launchNetwork);
    }
    setActiveTab('instances');
    setLaunchStep(1);
    setLaunchName('');
    if (availableTemplates.length > 0) {
      setLaunchTemplate(availableTemplates[0].value);
    } else {
      setLaunchTemplate('');
    }
    setLaunchTier('Free');
    setCustomCpu(2);
    setCustomRam('4GB');
    setCustomStorage('20GB');
  };

  const handleExecuteCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalCommand || !terminalInstance) return;

    const cmd = terminalCommand;
    setTerminalCommand('');
    setTerminalLoading(true);

    try {
      const inst = instances.find(i => i.name === terminalInstance);
      const projParam = inst?.project ? `?project=${inst.project}` : '';
      const res = await api.post(`/api/instances/${terminalInstance}/exec/${projParam}`, { command: cmd });
      setTerminalHistory(prev => [...prev, {
        command: cmd,
        stdout: res.data.stdout,
        stderr: res.data.stderr,
        exitCode: res.data.exit_code
      }]);
    } catch (err: any) {
      console.error(err);
      setTerminalHistory(prev => [...prev, {
        command: cmd,
        stdout: '',
        stderr: err.response?.data?.error || 'Failed to execute command.',
        exitCode: -1
      }]);
    } finally {
      setTerminalLoading(false);
      setTimeout(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
            <Server className="text-teal-400 w-8 h-8" />
            My App Instances
          </h2>
          <p className="text-gray-400 text-sm mt-1">Manage WordPress databases, Node APIs, or Git repositories.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-2">
          <button
            onClick={() => { setActiveTab('launch'); setLaunchStep(1); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition cursor-pointer text-sm ${
              activeTab === 'launch'
                ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300'
                : 'text-gray-400 hover:text-app-text-h hover:bg-app-card border border-transparent'
            }`}
          >
            <Play className="w-4.5 h-4.5" />
            Launch New Instance
          </button>

          <button
            onClick={() => { setActiveTab('instances'); setLaunchStep(1); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition cursor-pointer text-sm ${
              activeTab === 'instances'
                ? 'bg-teal-500/10 border border-teal-500/30 text-teal-300'
                : 'text-gray-400 hover:text-app-text-h hover:bg-app-card border border-transparent'
            }`}
          >
            <Server className="w-4.5 h-4.5" />
            My Instances
          </button>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'instances' ? (
            <div className="w-full overflow-x-auto rounded-2xl border border-app-border bg-app-card/30">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-app-card/50 text-xs uppercase text-gray-400 border-b border-app-border">
              <tr>
                <th className="px-6 py-4 font-semibold tracking-wider">Hostname & Project</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Status & Tier</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Specs (CPU / RAM / Disk)</th>
                <th className="px-6 py-4 font-semibold tracking-wider">IP (v4 / v6)</th>
                <th className="px-6 py-4 font-semibold tracking-wider">Price/mo</th>
                <th className="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-app-border-dim">
              {instances.map(inst => (
                <tr key={inst.id} className="hover:bg-app-card/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Server className="w-5 h-5 text-teal-400" />
                      <div>
                        <div className="font-bold text-app-text-h text-sm flex items-center gap-2">
                          {inst.name}
                          {inst.project && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold uppercase tracking-wider">
                              {inst.project}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{inst.template}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col items-start gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                        inst.status === 'Running'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                          : inst.status === 'Stopped'
                          ? 'bg-zinc-500/10 border-zinc-500/20 text-gray-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          inst.status === 'Running' 
                            ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' 
                            : inst.status === 'Stopped'
                            ? 'bg-zinc-400'
                            : 'bg-amber-400'
                        }`} />
                        {inst.status}
                      </span>
                      <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/25 px-2 py-0.2 rounded font-extrabold uppercase">
                        {inst.tier}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">
                    <div>CPU: {inst.cpu} cores</div>
                    <div>RAM: {inst.ram}</div>
                    <div>Disk: {inst.disk}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-400 space-y-1">
                    {inst.ipv4 ? (
                      <div>IPv4: <span className="text-emerald-400">{inst.ipv4}</span></div>
                    ) : (
                      <div className="text-zinc-600">No IPv4</div>
                    )}
                    {inst.ipv6 ? (
                      <div>IPv6: <span className="text-emerald-400">{inst.ipv6}</span></div>
                    ) : (
                      <div className="text-zinc-600">No IPv6</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">
                    <div>{inst.uptime}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTerminalInstance(inst.name)}
                        className="p-2 bg-violet-600/15 hover:bg-violet-600/30 text-violet-400 rounded-lg text-xs font-semibold transition cursor-pointer"
                        title="Console"
                      >
                        <Terminal className="w-4 h-4" />
                      </button>

                      {inst.status === 'Running' ? (
                        <button
                          onClick={() => onAction(inst.id, 'stop')}
                          className="p-2 bg-amber-500/15 hover:bg-amber-500/30 text-amber-500 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Stop"
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onAction(inst.id, 'start')}
                          className="p-2 bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-500 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Start"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => onDestroy(inst.id)}
                        className="p-2 bg-rose-600/15 hover:bg-rose-600/30 text-rose-400 rounded-lg text-xs font-semibold transition cursor-pointer"
                        title="Destroy"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {instances.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500">
                    No instances running.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
          ) : (
            <div className="w-full flex flex-col">
              <div className="w-full flex flex-col">
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-2xl font-extrabold text-app-text-h flex items-center gap-3">
                    <Play className="w-6 h-6 text-teal-500 fill-teal-500" /> Launch Wizard
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2 hidden sm:flex">
                      {[1, 2, 3, 4, 5, 6].map(step => (
                        <div key={step} className={`h-2 w-6 rounded-full ${launchStep >= step ? 'bg-teal-500' : 'bg-app-border'}`} />
                      ))}
                    </div>
                    <span className="text-gray-400 font-bold ml-4 text-sm">Step {launchStep} of 6</span>
                  </div>
                </div>
                
                <div className="w-full bg-app-card/30 border border-app-border rounded-3xl p-6 mb-6 overflow-hidden">
                  <AnimatePresence mode="wait">
                    {launchStep === 1 && (
                      <motion.div 
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 max-w-lg mx-auto mt-4"
                      >
                        <h4 className="text-lg font-bold text-app-text-h text-center mb-6">1. Identity & Name</h4>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-400">Instance Name</label>
                        <input
                          type="text"
                          value={launchName}
                          onChange={e => setLaunchName(e.target.value)}
                          placeholder="e.g. prod-api-server"
                          className="w-full px-4 py-3 rounded-xl border border-app-border bg-[#efefef] placeholder-gray-500 text-sm font-semibold text-black focus:outline-none focus:border-teal-500 transition-colors shadow-inner"
                          autoFocus
                        />
                        <p className="text-xs text-gray-500 ml-1">Must be unique, lowercase alphanumeric and hyphens.</p>
                      </div>
                      </motion.div>
                    )}

                    {launchStep === 2 && (
                      <motion.div 
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 mt-2"
                      >
                        <h4 className="text-lg font-bold text-app-text-h text-center mb-6">2. Marketplace Image</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {availableTemplates.map(t => {
                          const isUbuntu = t.label.toLowerCase().includes('ubuntu');
                          const isDebian = t.label.toLowerCase().includes('debian');
                          const isAlpine = t.label.toLowerCase().includes('alpine');
                          const isCentos = t.label.toLowerCase().includes('centos');
                          
                          return (
                            <button
                              key={t.value}
                              onClick={() => setLaunchTemplate(t.value)}
                              className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all cursor-pointer text-center ${
                                launchTemplate === t.value 
                                  ? 'border-teal-500 bg-teal-500/10 scale-105 shadow-xl shadow-teal-500/20' 
                                  : 'border-app-border bg-app-card/30 hover:border-gray-500 hover:bg-app-card/60'
                              }`}
                            >
                              <div className={`w-14 h-14 mb-3 rounded-2xl flex items-center justify-center bg-gradient-to-br ${
                                isUbuntu ? 'from-orange-500 to-red-500' :
                                isDebian ? 'from-rose-500 to-pink-600' :
                                isAlpine ? 'from-blue-500 to-cyan-500' :
                                isCentos ? 'from-purple-500 to-indigo-500' :
                                'from-gray-600 to-gray-800'
                              } shadow-md shadow-black/30`}>
                                {isUbuntu ? <Globe className="w-6 h-6 text-white" /> :
                                 isDebian ? <Server className="w-6 h-6 text-white" /> :
                                 isAlpine ? <Activity className="w-6 h-6 text-white" /> :
                                 <HardDrive className="w-6 h-6 text-white" />}
                              </div>
                              <span className="font-bold text-app-text-h text-sm">{t.label}</span>
                              <span className="text-[9px] font-bold text-gray-400 mt-2 bg-black/60 px-2.5 py-1 rounded-full uppercase tracking-widest">{t.type}</span>
                            </button>
                          );
                        })}
                      </div>
                      </motion.div>
                    )}

                    {launchStep === 3 && (
                      <motion.div 
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 max-w-4xl mx-auto mt-2"
                      >
                        <h4 className="text-lg font-bold text-app-text-h text-center mb-6">3. Compute Resources</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { id: 'Free', name: 'Free Tier', price: '$0/mo', cpu: '1 vCPU', ram: '512MB RAM', icon: <Play className="w-5 h-5" /> },
                          { id: 'Pro', name: 'Pro Tier', price: '$15/mo', cpu: '2 vCPU', ram: '2GB RAM', icon: <Activity className="w-5 h-5" /> },
                          { id: 'Advance', name: 'Advance Tier', price: '$49/mo', cpu: '4 vCPU', ram: '8GB RAM', icon: <Cpu className="w-5 h-5" /> },
                          { id: 'Custom', name: 'Custom Setup', price: 'Variable', cpu: 'Configure CPU', ram: 'Configure RAM', icon: <LayoutGrid className="w-5 h-5" /> }
                        ].map(tier => (
                          <button
                            key={tier.id}
                            onClick={() => setLaunchTier(tier.id as any)}
                            className={`flex flex-col items-start p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                              launchTier === tier.id 
                                ? 'border-teal-500 bg-teal-500/10 scale-105 shadow-md shadow-teal-500/20' 
                                : 'border-app-border bg-app-card/30 hover:border-gray-500 hover:bg-app-card/60'
                            }`}
                          >
                            <div className={`p-3 rounded-xl mb-4 bg-gradient-to-br ${
                              launchTier === tier.id ? 'from-teal-500 to-emerald-500 text-white shadow-md shadow-teal-500/30' : 'from-app-card to-app-card text-gray-400 border border-app-border'
                            }`}>
                              {tier.icon}
                            </div>
                            <span className="font-bold text-app-text-h text-sm">{tier.name}</span>
                            <span className="text-teal-400 font-bold mt-1 text-xs">{tier.price}</span>
                            <div className="mt-4 space-y-1.5 text-[10px] text-gray-400 w-full font-mono">
                              <div className="flex justify-between border-b border-app-border-dim pb-1.5"><span>CPU</span> <span className="text-gray-200">{tier.cpu}</span></div>
                              <div className="flex justify-between pt-1"><span>RAM</span> <span className="text-gray-200">{tier.ram}</span></div>
                            </div>
                          </button>
                        ))}
                      </div>

                      {launchTier === 'Custom' && (
                        <div className="grid grid-cols-2 gap-4 pt-6 border-t border-app-border mt-6">
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400">vCPU Cores</label>
                            <input
                              type="number" min={1} max={64}
                              value={customCpu} onChange={e => setCustomCpu(Number(e.target.value))}
                              className="w-full px-4 py-3 rounded-xl border border-app-border bg-[#0a0810] text-sm font-bold text-app-text-h focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-semibold text-gray-400">RAM Allocation</label>
                            <input
                              type="text"
                              value={customRam} onChange={e => setCustomRam(e.target.value)}
                              className="w-full px-4 py-3 rounded-xl border border-app-border bg-[#0a0810] text-sm font-bold text-app-text-h focus:outline-none focus:border-teal-500"
                            />
                          </div>
                        </div>
                      )}
                      </motion.div>
                    )}

                    {launchStep === 4 && (
                      <motion.div 
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 max-w-lg mx-auto mt-4"
                      >
                        <h4 className="text-lg font-bold text-app-text-h text-center mb-6">4. Primary Storage</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-center p-6 bg-app-card/40 border border-teal-500/50 rounded-2xl relative overflow-hidden group">
                           <div className="absolute inset-0 bg-teal-500/5 w-full h-full" />
                           <HardDrive className="w-16 h-16 text-teal-400/20 absolute right-6 group-hover:text-teal-400/40 transition-colors" />
                           <div className="relative z-10 w-full text-center">
                             <label className="block text-xs font-bold text-teal-500 mb-2 uppercase tracking-widest">Root Volume Size</label>
                             <input
                               type="text"
                               value={customStorage}
                               onChange={e => setCustomStorage(e.target.value)}
                               className="w-full bg-transparent border-b-2 border-teal-500/30 text-3xl font-black text-app-text-h pb-1 focus:outline-none focus:border-teal-400 text-center"
                             />
                           </div>
                        </div>
                        <p className="text-center text-gray-500 text-xs font-semibold">You can specify units like GB, MB, or TB (e.g. 50GB).</p>
                      </div>
                      </motion.div>
                    )}

                    {launchStep === 5 && (
                      <motion.div 
                        key="step5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 max-w-2xl mx-auto mt-4"
                      >
                        <h4 className="text-lg font-bold text-app-text-h text-center mb-6">5. Network Attachment</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {availableNetworks.map(net => (
                          <button
                            key={net.id}
                            onClick={() => setLaunchNetwork(net.name)}
                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer text-left ${
                              launchNetwork === net.name 
                                ? 'border-teal-500 bg-teal-500/10 scale-105 shadow-md shadow-teal-500/20' 
                                : 'border-app-border bg-app-card/30 hover:border-gray-500 hover:bg-app-card/60'
                            }`}
                          >
                            <div className={`p-3 rounded-xl ${launchNetwork === net.name ? 'bg-teal-500/20 text-teal-400' : 'bg-app-card border border-app-border text-gray-400'}`}>
                              <Globe className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="font-bold text-app-text-h text-sm">{net.name}</div>
                              <div className="text-[9px] text-gray-400 mt-1 uppercase tracking-widest font-bold">{net.id.split('-').slice(1).join('-')} Project</div>
                            </div>
                          </button>
                        ))}
                        {availableNetworks.length === 0 && (
                          <div className="col-span-2 text-center text-xs text-gray-500 py-8 border border-dashed border-app-border rounded-xl">No networks found. A default network will be attached if available.</div>
                        )}
                      </div>
                      </motion.div>
                    )}

                    {launchStep === 6 && (
                      <motion.div 
                        key="step6"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4 max-w-2xl mx-auto mt-4"
                      >
                        <h4 className="text-lg font-bold text-app-text-h text-center mb-6">6. Review & Deploy</h4>
                      <div className="p-6 rounded-2xl bg-app-card/40 border border-app-border space-y-4 text-sm">
                        <div className="flex justify-between items-center border-b border-app-border-dim pb-3">
                          <span className="text-gray-400 flex items-center gap-2"><Server className="w-4 h-4 text-teal-500"/> Instance Name</span>
                          <span className="font-bold text-app-text-h">{launchName || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-app-border-dim pb-3">
                          <span className="text-gray-400 flex items-center gap-2"><HardDrive className="w-4 h-4 text-purple-500"/> Selected Image</span>
                          <span className="font-bold text-teal-400 text-xs">{availableTemplates.find(t => t.value === launchTemplate)?.label || launchTemplate}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-app-border-dim pb-3">
                          <span className="text-gray-400 flex items-center gap-2"><Cpu className="w-4 h-4 text-rose-500"/> Compute Profile</span>
                          <span className="font-bold text-app-text-h text-xs bg-app-card border border-app-border px-2 py-0.5 rounded">{launchTier}</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-app-border-dim pb-3">
                          <span className="text-gray-400 flex items-center gap-2"><Activity className="w-4 h-4 text-orange-500"/> Specs</span>
                          <span className="font-bold text-app-text-h text-right font-mono text-xs">
                            {launchTier === 'Custom' ? `${customCpu} vCPU, ${customRam} RAM` : 'Inherited from Tier'} <br/>
                            {customStorage} Disk
                          </span>
                        </div>
                        <div className="flex justify-between items-center pb-1">
                          <span className="text-gray-400 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-500"/> Network Uplink</span>
                          <span className="font-bold text-app-text-h font-mono text-xs bg-app-card border border-app-border px-2 py-0.5 rounded">{launchNetwork || 'System Default'}</span>
                        </div>
                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex justify-between items-center shrink-0 w-full mt-2">
                  <button
                    onClick={() => setLaunchStep(prev => Math.max(1, prev - 1))}
                    disabled={launchStep === 1}
                    className="px-6 py-3 bg-app-card hover:bg-app-card/80 text-white rounded-xl font-bold transition disabled:opacity-30 disabled:cursor-not-allowed border border-app-border hover:border-gray-500 cursor-pointer text-sm"
                  >
                    Previous Step
                  </button>
                  {launchStep < 6 ? (
                    <button
                      onClick={() => {
                        if (launchStep === 1 && !launchName) return alert('Please enter a name first');
                        setLaunchStep(prev => Math.min(6, prev + 1));
                      }}
                      className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-bold shadow-lg shadow-teal-600/20 transition text-sm cursor-pointer"
                    >
                      Continue
                    </button>
                  ) : (
                    <button
                      onClick={handleLaunch}
                      className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white rounded-xl font-bold shadow-lg shadow-teal-500/40 transition hover:scale-105 active:scale-100 text-sm cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" /> Deploy Instance Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Terminal Console Modal */}
      <AnimatePresence>
        {terminalInstance && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setTerminalInstance(null);
                setTerminalHistory([]);
              }}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-[#09070f] border border-app-border rounded-2xl overflow-hidden shadow-2xl z-50 text-left flex flex-col h-[500px]"
            >
              {/* Header */}
              <div className="flex justify-between items-center bg-[#110e19] px-6 py-4 border-b border-app-border-dim shrink-0">
                <div className="flex items-center gap-2.5">
                  <Terminal className="text-violet-400 w-5 h-5" />
                  <span className="font-mono text-sm font-semibold text-app-text-h">
                    Interactive Console — {terminalInstance}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setTerminalInstance(null);
                    setTerminalHistory([]);
                  }}
                  className="p-1.5 rounded-lg bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Terminal Screen Body */}
              <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-emerald-400 space-y-4 bg-[#050408] scrollbar-thin">
                <div className="text-gray-500 pb-2 border-b border-zinc-900">
                  Welcome to Tblinc Instance Console!
                  <br />
                  Connected to container root shell via /bin/sh.
                </div>

                {terminalHistory.map((h, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center gap-1.5 text-zinc-500">
                      <span>root@{terminalInstance}:~#</span>
                      <span className="text-white font-medium">{h.command}</span>
                    </div>
                    {h.stdout && (
                      <pre className="whitespace-pre-wrap text-emerald-400 pl-4">{h.stdout}</pre>
                    )}
                    {h.stderr && (
                      <pre className="whitespace-pre-wrap text-rose-400 pl-4">{h.stderr}</pre>
                    )}
                    {h.exitCode !== 0 && (
                      <div className="text-[10px] text-zinc-600 pl-4">
                        Process exited with code {h.exitCode}
                      </div>
                    )}
                  </div>
                ))}

                {terminalLoading && (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <Activity className="w-3.5 h-3.5 animate-spin" />
                    <span>Executing command...</span>
                  </div>
                )}
                
                <div ref={terminalEndRef} />
              </div>

              {/* Command Input Bar */}
              <form onSubmit={handleExecuteCommand} className="bg-[#110e19] p-4 border-t border-app-border-dim flex gap-3 shrink-0 items-center">
                <span className="font-mono text-xs text-zinc-500 shrink-0 select-none pl-2">
                  root@{terminalInstance}:~#
                </span>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Type a shell command (e.g. ls -la, uname -a, ip a)..."
                  value={terminalCommand}
                  onChange={(e) => setTerminalCommand(e.target.value)}
                  className="flex-1 bg-black/50 border border-app-border-dim rounded-xl px-4 py-2.5 font-mono text-xs text-white focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={terminalLoading}
                  className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-800/40 text-white rounded-xl text-xs font-semibold shadow-lg transition active:scale-95 cursor-pointer flex-shrink-0"
                >
                  Run
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
