import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Terminal, 
  Cpu, 
  Network, 
  HardDrive, 
  ShieldAlert, 
  ArrowRight, 
  ChevronRight, 
  LogIn, 
  ArrowLeft,
  Menu
} from 'lucide-react';

interface DocsPageProps {
  theme: 'light' | 'dark' | 'blue';
  cycleTheme: () => void;
  themeConfig: any;
}

export default function DocsPage({ theme, cycleTheme, themeConfig }: DocsPageProps) {
  const [activeTopic, setActiveTopic] = useState<'quickstart' | 'incus' | 'ovn' | 'storage' | 'api' | 'tutorial' | 'tools'>('quickstart');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('django');

  React.useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#member') {
        setActiveTopic('quickstart');
      } else if (hash === '#incus') {
        setActiveTopic('incus');
      } else if (hash === '#ovn') {
        setActiveTopic('ovn');
      } else if (hash === '#storage') {
        setActiveTopic('storage');
      } else if (hash === '#api') {
        setActiveTopic('api');
      } else if (hash === '#tutorial') {
        setActiveTopic('tutorial');
      } else if (hash === '#tools') {
        setActiveTopic('tools');
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const topics = [
    { key: 'quickstart', label: 'Quick Start Guide', icon: <Terminal className="w-4 h-4 text-purple-400" /> },
    { key: 'incus', label: 'Incus Hypervisor', icon: <Cpu className="w-4 h-4 text-teal-400" /> },
    { key: 'ovn', label: 'OVN Network Safety', icon: <Network className="w-4 h-4 text-cyan-400" /> },
    { key: 'storage', label: 'Ceph Storage Pools', icon: <HardDrive className="w-4 h-4 text-pink-400" /> },
    { key: 'api', label: 'Ingress API Reference', icon: <BookOpen className="w-4 h-4 text-violet-400" /> },
    { key: 'tutorial', label: 'Sandbox Tutorial', icon: <BookOpen className="w-4 h-4 text-amber-500" /> },
    { key: 'tools', label: 'Deployment Tools', icon: <Terminal className="w-4 h-4 text-emerald-400" /> }
  ] as const;

  const renderContent = () => {
    switch (activeTopic) {
      case 'quickstart':
        return (
          <motion.div 
            key="quickstart"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-teal-400">Quick Start Guide</h2>
              <p className="text-gray-400 text-sm mt-2 font-medium">Get up and running with sandboxes in under 5 minutes.</p>
            </div>

            <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 shadow-[inset_0_0_20px_rgba(168,85,247,0.05)] text-sm text-purple-300 leading-relaxed backdrop-blur-sm">
              <span className="font-bold text-purple-400 flex items-center gap-2 mb-1">
                <ShieldAlert className="w-4 h-4" />
                Important Notice
              </span> 
              Make sure you register an account in the Member Portal to lease CPU/RAM/Disk limits. Adhere strictly to cluster namespace allocations.
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-app-text-h text-sm">1. Access Your Sandbox</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Log in to the <button onClick={() => window.location.hash = '#member'} className="text-purple-400 hover:underline font-semibold cursor-pointer">Member Portal</button>. Click on <strong>Marketplace</strong> in the sidebar. Choose from prebuilt Linux template boilerplates (like WordPress Stack, PostgreSQL, NodeJS, or Django).
              </p>

              <h3 className="font-bold text-app-text-h text-sm">2. Configure Computing Limits</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Before launching, allocate cores and memory constraints. Free workspaces can host up to 2 vCPUs and 4 GB RAM. If you need larger quotas, upgrade your subscription in the billing settings panel.
              </p>

              <h3 className="font-bold text-app-text-h text-sm">3. Deploy & Connect</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Click <strong>Launch Template</strong>. Our hypervisor automatically maps OVN subnets and creates ingress rules. You can interact with the container bash system via the direct <strong>Console</strong> terminal view.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-app-text-h text-sm">Basic Shell Commands</h3>
              <div className="p-5 rounded-2xl bg-app-card/60 backdrop-blur-sm border border-app-border/80 font-mono text-xs text-app-text-h space-y-3 select-text shadow-xl">
                <div className="flex flex-col"><span className="text-gray-500 mb-1"># Check virtual network mappings</span><span className="text-teal-400">ip addr show</span></div>
                <div className="flex flex-col"><span className="text-gray-500 mb-1"># Validate local database persistency checks</span><span className="text-purple-400">pg_isready -h localhost</span></div>
              </div>
            </div>
          </motion.div>
        );

      case 'incus':
        return (
          <motion.div 
            key="incus"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-2xl font-black text-app-text-h tracking-tight">Incus Virtualization Engine</h2>
              <p className="text-gray-400 text-xs mt-1">High-performance system virtualization utilizing LXD technology.</p>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
              TblInc Cloud is built upon <strong>Incus</strong>, a next-generation virtualization daemon. Unlike heavy virtual machines (KVM/QEMU) that require hardware emulation layers, Incus runs containers directly on top of the host Linux kernel inside isolated namespaces.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border border-app-border bg-app-card/30 space-y-2">
                <h4 className="font-bold text-app-text-h text-xs">Security Isolation</h4>
                <p className="text-[11px] text-gray-505 dark:text-gray-400 leading-relaxed">
                  Every sandbox container is mapped to unique kernel User Namespaces (subUIDs/subGIDs) to prevent privilege escalation attacks.
                </p>
              </div>
              <div className="p-5 rounded-2xl border border-app-border bg-app-card/30 space-y-2">
                <h4 className="font-bold text-app-text-h text-xs">Bare-Metal Speeds</h4>
                <p className="text-[11px] text-gray-505 dark:text-gray-400 leading-relaxed">
                  Containers execute CPU commands natively on physical hypervisor cores, achieving nearly 100% processing efficiency with zero overhead.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-bold text-app-text-h text-sm">Hypervisor Config Bounds</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Administrators can throttle containers dynamically by updating configurations. The hypervisor automatically schedules process shares based on `limits.cpu` settings.
              </p>
            </div>
          </motion.div>
        );

      case 'ovn':
        return (
          <motion.div key="ovn" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-app-text-h tracking-tight">OVN Network Isolation</h2>
              <p className="text-gray-400 text-xs mt-1">Software-defined networking guaranteeing namespace packet safety.</p>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
              <strong>Open Virtual Network (OVN)</strong> manages all container networking within TblInc Cloud. When a container is launched, OVN maps a private isolated subnet interface (e.g. `10.122.5.0/24`) bound to the container namespace.
            </p>

            <div className="space-y-3">
              <h3 className="font-bold text-app-text-h text-sm">Ingress & DNS Mapping</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Containers do not expose public ports directly. Instead, ingress reverse proxies map dedicated subdomains (like `subdomain.tblinc.com`) to the private container port. You can add or drop domain rules inside the <strong>DNS Domains</strong> tab in the Member Portal.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-teal-500/5 border border-teal-500/15 text-xs text-teal-400 leading-relaxed">
              <span className="font-bold">Info:</span> OVN networks are completely isolated between users. Your containers cannot communicate with or ping other users containers, ensuring sandbox packet safety.
            </div>
          </motion.div>
        );

      case 'storage':
        return (
          <motion.div key="storage" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-8">
            <div>
              <h2 className="text-2xl font-black text-app-text-h tracking-tight">Ceph Storage Pools</h2>
              <p className="text-gray-400 text-xs mt-1">Persistent block disk volumes mapping databases and images.</p>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
              TblInc Cloud uses clustered <strong>Ceph</strong> storage pools and high-speed local NVMe storage pools. Every sandbox container receives a dedicated block volume mapped directly to the container root path.
            </p>

            <div className="space-y-3">
              <h3 className="font-bold text-app-text-h text-sm">Data Persistence</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Root disk files and folder trees are retained during container restarts, reboots, or host allocations. If you configure databases (like PostgreSQL or MariaDB), data is written to a persistent directory mapped directly to the underlying block storage pool.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-pink-500/5 border border-pink-500/15 text-xs text-pink-400 leading-relaxed">
              <span className="font-bold">Disk Bounds:</span> Make sure you monitor your storage usage. If you cross 95% storage allocation limits, files will be set to read-only mode to prevent data corruption.
            </div>
          </motion.div>
        );

      case 'api':
        return (
          <motion.div 
            key="api"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-fuchsia-400">Ingress API Reference</h2>
              <p className="text-gray-400 text-sm mt-2 font-medium">REST API references for monitoring hypervisors and accounts.</p>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
              You can query cluster statistics or container statuses using TblInc REST APIs. Administrators can manage system stats via backend endpoints.
            </p>

            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-app-card/60 backdrop-blur-sm border border-app-border/80 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 rounded-lg bg-purple-500/15 border border-purple-500/30 text-[10px] font-black text-purple-400 tracking-widest uppercase">GET</span>
                  <span className="font-mono text-sm text-app-text-h font-bold">/api/admin-dashboard/</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Fetches aggregated cluster statistics (CPU load, active sandbox count, memory usage, storage pool statuses). Requires admin header auth.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-app-card/60 backdrop-blur-sm border border-app-border/80 shadow-lg">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-black text-emerald-400 tracking-widest uppercase">GET</span>
                  <span className="font-mono text-sm text-app-text-h font-bold">/api/instances/</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Lists active sandbox containers leased by the authenticated developer account. Returns container state, CPU load, and IP mappings.
                </p>
              </div>
            </div>
          </motion.div>
        );
      case 'tutorial':
        return (
          <motion.div 
            key="tutorial"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-2xl font-black text-app-text-h tracking-tight">Step-by-Step API Sandbox Tutorial</h2>
              <p className="text-gray-400 text-xs mt-1">Learn how to build and expose a python microservice container in under 3 minutes.</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-app-text-h text-sm">Step 1: Pick Python Image</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Go to the Member Portal's <strong>Marketplace</strong> and launch the <strong>Base OS image</strong> for Ubuntu or Python. Name your instance: <code className="font-mono bg-app-card px-1.5 py-0.5 border border-app-border rounded">flask-api-service</code>.
              </p>

              <h3 className="font-bold text-app-text-h text-sm">Step 2: Access Command Shell Console</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Once active, click on the instance to open the details view. Select the <strong>Console</strong> terminal and run updates:
              </p>
              <div className="p-4 rounded-xl bg-app-card border border-app-border font-mono text-xs text-app-text-h space-y-1 select-text">
                <div>apt-get update && apt-get install -y python3-pip python3-venv</div>
                <div>pip3 install flask gunicorn</div>
              </div>

              <h3 className="font-bold text-app-text-h text-sm">Step 3: Write Microservice Code</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Create a file `app.py` in the root directory:
              </p>
              <div className="p-4 rounded-xl bg-app-card border border-app-border font-mono text-xs text-app-text-h space-y-1 select-text">
                <div className="text-gray-550">from flask import Flask</div>
                <div>app = Flask(__name__)</div>
                <div className="text-purple-400">@app.route('/')</div>
                <div>def index():</div>
                <div>&nbsp;&nbsp;&nbsp;&nbsp;return &#123;"status": "online", "service": "Flask Sandbox API"&#125;</div>
              </div>

              <h3 className="font-bold text-app-text-h text-sm">Step 4: Launch Web Server & Map DNS Subdomain</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Start the backend server bound to local address port 5000:
              </p>
              <div className="p-4 rounded-xl bg-app-card border border-app-border font-mono text-xs text-app-text-h select-text">
                gunicorn -b 0.0.0.0:5000 app:app --daemon
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Navigate to the <strong>DNS Domains</strong> tab in your workspace. Register your subdomain mapping rules:
              </p>
              <ul className="list-disc pl-5 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <li><strong>Subdomain Prefix</strong>: <code className="font-mono">flask-ingress</code></li>
                <li><strong>Target Container</strong>: <code className="font-mono">flask-api-service</code></li>
                <li><strong>Port Mapping</strong>: <code className="font-mono">5000</code></li>
              </ul>

              <h3 className="font-bold text-app-text-h text-sm">Step 5: Query Live API</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                Your API is now live! Simply make a cURL query to verify operations:
              </p>
              <div className="p-4 rounded-xl bg-app-card border border-app-border font-mono text-xs text-app-text-h select-text">
                curl http://flask-ingress.tblinc.com/
              </div>
            </div>
          </motion.div>
        );

      case 'tools':
        return (
          <motion.div 
            key="tools"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            <div>
              <h2 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Deployment Tools</h2>
              <p className="text-gray-400 text-sm mt-2 font-medium">Automated deployment scripts for popular frameworks.</p>
            </div>

            <p className="text-gray-500 dark:text-gray-400 text-base leading-relaxed">
              To make deploying applications into your sandboxes as easy as possible, TblInc provides a suite of pre-built Bash deployment scripts located in the <strong>Marketplace</strong> (backed by our <code className="font-mono text-emerald-400">src/components/tools/deploy/</code> directory). These scripts automatically configure your web servers (Nginx), reverse proxies, and systemd daemons.
            </p>

            <div className="space-y-6">
              <h3 className="font-bold text-app-text-h text-xl pt-4">Interactive Framework Tutorials</h3>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {['django', 'flask', 'fastapi', 'nodejs', 'react', 'nextjs', 'vue', 'svelte', 'laravel', 'php', 'rails', 'go'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setSelectedTool(t)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize ${
                      selectedTool === t
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                        : 'bg-app-card hover:bg-app-border-dim border border-app-border text-gray-400 hover:text-gray-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTool}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 rounded-3xl bg-app-card/30 backdrop-blur-sm border border-app-border shadow-xl space-y-4"
                >
                  <h4 className="font-black text-lg text-app-text-h capitalize">{selectedTool} Deployment</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Deploy a production-ready <span className="capitalize text-emerald-400">{selectedTool}</span> application. The system will automatically download the necessary runtimes and map the internal ports to the OVN ingress proxy.
                  </p>
                  
                  <div className="p-5 rounded-2xl bg-gray-900 border border-gray-700 font-mono text-xs text-gray-300 space-y-3 shadow-inner">
                    <div className="flex flex-col"><span className="text-gray-500 mb-1"># 1. Download your {selectedTool} app code</span><span className="text-blue-300">git clone https://github.com/user/my-{selectedTool}-app /var/www/app</span></div>
                    <div className="flex flex-col"><span className="text-gray-500 mb-1"># 2. Execute the {selectedTool} deployment script</span><span className="text-emerald-400">curl -sL https://raw.githubusercontent.com/tblinc/cloud/main/src/components/tools/deploy/{selectedTool}.sh | bash</span></div>
                    <div className="flex flex-col"><span className="text-gray-500 mb-1"># 3. Check the background daemon status</span><span className="text-purple-400">systemctl status {selectedTool === 'nodejs' || selectedTool === 'react' || selectedTool === 'nextjs' || selectedTool === 'vue' || selectedTool === 'svelte' ? 'pm2-root' : (selectedTool === 'django' || selectedTool === 'flask' || selectedTool === 'fastapi' ? 'gunicorn' : (selectedTool === 'go' ? 'go-app' : (selectedTool === 'rails' ? 'puma' : 'nginx')))}</span></div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="space-y-4 pt-4">
              <h3 className="font-bold text-app-text-h text-xl">How to use them</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                When you deploy an application from the Marketplace, the corresponding script is pushed to your container and executed automatically as <code className="text-gray-300 bg-gray-800 px-1 rounded">root</code>. 
                If you wish to run them manually inside a custom sandbox:
              </p>
              
              <div className="p-5 rounded-2xl bg-gray-900 border border-gray-700 shadow-lg font-mono text-xs text-gray-300 space-y-3">
                <div className="flex flex-col"><span className="text-gray-500 mb-1"># 1. Download your app code into /var/www/app</span><span className="text-blue-300">git clone https://github.com/user/repo /var/www/app</span></div>
                <div className="flex flex-col"><span className="text-gray-500 mb-1"># 2. Run the deployment script (e.g. for Django)</span><span className="text-emerald-400">curl -sL https://raw.githubusercontent.com/.../django.sh | bash</span></div>
              </div>

              <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/15 text-xs text-purple-400 leading-relaxed">
                <span className="font-bold flex items-center gap-2 mb-1"><ShieldAlert className="w-4 h-4"/> Nginx Reverse Proxy</span>
                Every deploy script creates an Nginx server block listening on port 80 that reverse proxies to your application's internal port. Our external OVN Ingress gateway maps to this Nginx server automatically!
              </div>
            </div>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[150px] pointer-events-none z-0" />

      {/* Docs Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-app-border bg-app-header/80 backdrop-blur-xl z-20 shrink-0 sticky top-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.hash = ''}
            className="p-2 rounded-xl bg-app-bg hover:bg-app-border-dim border border-app-border text-gray-400 hover:text-app-text-h transition-all cursor-pointer mr-1"
            title="Back to Landing"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 rounded-xl bg-app-bg hover:bg-app-border-dim border border-app-border text-gray-400 hover:text-app-text-h transition-all cursor-pointer mr-1"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <Menu className="w-4.5 h-4.5" />
          </button>

          <span className="font-extrabold text-xl tracking-wider text-app-text-h">TblInc Docs</span>
        </div>

        <div className="flex items-center gap-4">
            <button
              onClick={() => window.location.hash = '#portal'}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 hover:from-purple-500/20 hover:to-pink-500/20 border border-purple-500/20 text-xs font-bold text-purple-400 hover:text-purple-300 transition-all cursor-pointer shadow-lg shadow-purple-500/5 active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span>Gateway</span>
            </button>
        </div>
      </header>

      {/* Docs Layout */}
      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Sidebar Nav */}
        <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r border-app-border bg-app-sidebar/60 backdrop-blur-md flex flex-col shrink-0 transition-all duration-300`}>
          <nav className="p-4 space-y-1">
            {topics.map(topic => (
              <button
                key={topic.key}
                onClick={() => setActiveTopic(topic.key)}
                className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl font-semibold transition-all cursor-pointer border text-xs ${
                  activeTopic === topic.key
                    ? 'bg-purple-600/15 border-purple-500/30 text-purple-650 dark:text-purple-300 font-bold'
                    : 'text-gray-400 hover:text-app-text-h hover:bg-app-border-dim border-transparent'
                }`}
              >
                {topic.icon}
                {!isSidebarCollapsed && <span>{topic.label}</span>}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-16 relative">
          <div className="max-w-4xl mx-auto pb-24">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}
