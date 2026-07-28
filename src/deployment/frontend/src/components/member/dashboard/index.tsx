import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Server, Cpu, HardDrive, Activity, Globe, LogOut, 
  CreditCard, LayoutDashboard, ShoppingBag, Network, User, Layers, Image, BarChart3, Code2, Menu, Settings, DollarSign
} from 'lucide-react';
import api from '../../../api/axios';

// Child components imported directly from their respective tsx files
import MemberBillingView from '../billing';
import MemberDnsView from '../dns';
import MemberImagesView from '../images';
import MemberInstancesView from '../instances';
import MemberMarketplaceView from '../marketplace';
import MemberNetworkView from '../network';
import MemberProfileView from '../profiles';
import MemberProjectView from '../project';
import MemberStorageView from '../storage';
import MemberUsageView from '../usage';
import MemberSettingsView from '../settings';

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
}

interface MemberDnsRule {
  id: string;
  subdomain: string;
  targetInstance: string;
  status: 'Active' | 'Pending';
}

interface MemberDashboardProps {
  user: { username: string; email: string; address?: string; balance?: string | number } | null;
  onLogout: () => void;
  theme: 'light' | 'dark' | 'blue';
  cycleTheme: () => void;
  themeConfig: any;
  refreshUser: () => Promise<void>;
}

export default function MemberDashboard({ user, onLogout, theme, cycleTheme, themeConfig, refreshUser }: MemberDashboardProps) {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'instances' | 'marketplace' | 'dns' | 'billing' | 'network' | 'storage' | 'quotas' | 'usage' | 'profile' | 'images' | 'projects' | 'settings'>('overview');
  const [tourStep, setTourStep] = useState<number>(0);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  const [instances, setInstances] = useState<MemberInstance[]>([]);
  const [dnsRules, setDnsRules] = useState<MemberDnsRule[]>([]);

  const fetchDnsRules = async () => {
    try {
      const project = user ? `member-${user.username}`.toLowerCase().replace(/_/g, '-').replace(/\./g, '-') : '';
      if (!project) return;
      const res = await api.get(`/api/dns-rules/?project=${project}`);
      // map backend camel_case to camelCase
      const mapped = res.data.map((rule: any) => ({
        id: rule.id.toString(),
        subdomain: rule.subdomain,
        targetInstance: rule.target_instance,
        status: rule.status
      }));
      setDnsRules(mapped);
    } catch (err) {
      console.error("Failed to fetch DNS rules", err);
    }
  };

  const fetchMemberInstances = async () => {
    try {
      const project = user ? `member-${user.username}`.toLowerCase().replace(/_/g, '-').replace(/\./g, '-') : '';
      const res = await api.get(`/api/instances/?project=${project}`);
      const mapped = res.data.map((inst: any) => {
        let tier: 'Free' | 'Pro' | 'Advance' = 'Free';
        if (inst.profiles?.includes('advance')) tier = 'Advance';
        else if (inst.profiles?.includes('pro')) tier = 'Pro';
        
        // Fallback for instances created before profile migration
        if (inst.config?.['limits.cpu']) {
          const cpuConfig = parseInt(inst.config['limits.cpu']);
          if (cpuConfig >= 4) tier = 'Advance';
          else if (cpuConfig >= 2) tier = 'Pro';
        }

        let cpu = 1;
        let ram = '512MB';
        let disk = '10GB';
        let price = '$0.00';

        if (tier === 'Advance') {
          cpu = 4;
          ram = '8GB';
          disk = '150GB';
          price = '$49.00';
        } else if (tier === 'Pro') {
          cpu = 2;
          ram = '2GB';
          disk = '40GB';
          price = '$15.00';
        }

        return {
          id: inst.name,
          name: inst.name,
          template: inst.type === 'virtual-machine' ? 'Virtual Machine' : 'Tblinc Container',
          status: inst.status === 'Running' ? 'Running' : 'Stopped',
          ipAddress: 'Loading...',
          cpu,
          ram,
          disk,
          uptime: 'N/A',
          tier,
          price,
          project: inst.project
        };
      });
      setInstances(mapped);

      // Async state fetch for IP addresses
      mapped.forEach(async (inst: any) => {
        try {
          const stateRes = await api.get(`/api/instances/${inst.name}/state/?project=${project}`);
          const stateData = stateRes.data;
          
          let ipAddress = 'N/A';
          let ipv4: string | undefined = undefined;
          let ipv6: string | undefined = undefined;
          if (stateData.network) {
            for (const [ifaceName, iface] of Object.entries<any>(stateData.network)) {
              if (ifaceName !== 'lo' && iface.addresses) {
                const inetAddr = iface.addresses.find((addr: any) => addr.family === 'inet');
                if (inetAddr) {
                  ipAddress = inetAddr.address;
                  ipv4 = inetAddr.address;
                }
                const inet6Addr = iface.addresses.find((addr: any) => addr.family === 'inet6');
                if (inet6Addr) {
                  ipv6 = inet6Addr.address;
                }
              }
            }
          }

          setInstances(prev => prev.map(p => {
            if (p.id === inst.id) {
              return {
                ...p,
                ipAddress,
                ipv4,
                ipv6,
                status: stateData.status === 'Running' ? 'Running' : 'Stopped',
                uptime: stateData.started_at ? 'Running' : 'Stopped'
              };
            }
            return p;
          }));
        } catch (err) {
          console.error(err);
        }
      });
    } catch (err) {
      console.error("Failed to load instances in member view", err);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const res = await api.get('/api/member-dashboard/');
      setDashboardStats(res.data);
    } catch (err) {
      console.error("Failed to fetch member dashboard stats", err);
    }
  };

  useEffect(() => {
    fetchMemberInstances();
    fetchDashboardStats();
    fetchDnsRules();
  }, []);

  const handleLaunchInstance = async (
    name: string, 
    template: string, 
    tier: 'Free' | 'Pro' | 'Advance' | 'Custom',
    customSpecs?: { cpu: number, ram: string, storage: string },
    instanceType?: string,
    network?: string
  ) => {
    try {
      let source: any = { type: 'image' };
      const marketplaceMap: Record<string, string> = {
        'WordPress Stack': 'ubuntu/24.04',
        'PostgreSQL Database': 'ubuntu/24.04',
        'NodeJS Express API': 'ubuntu/24.04',
        'Django Boilerplate': 'ubuntu/24.04',
        'Laravel Ingress API': 'ubuntu/24.04'
      };

      if (marketplaceMap[template] || !/^[0-9a-f]{64}$/.test(template)) {
        source = {
          type: 'image',
          alias: marketplaceMap[template] || template,
          server: 'https://images.linuxcontainers.org',
          protocol: 'simplestreams'
        };
      } else {
        source = {
          type: 'image',
          fingerprint: template
        };
      }

      const payload: any = {
        name: name.toLowerCase().replace(/\s+/g, '-'),
        type: instanceType || 'container',
        source: source,
        profiles: ['default']
      };

      if (network) {
        payload.devices = {
          eth0: {
            name: 'eth0',
            network: network,
            type: 'nic'
          }
        };
      }

      if (tier === 'Free') {
        payload.config = {
          'limits.cpu': '1',
          'limits.memory': '512MB'
        };
      } else if (tier === 'Pro') {
        payload.config = {
          'limits.cpu': '2',
          'limits.memory': '2GB'
        };
      } else if (tier === 'Advance') {
        payload.config = {
          'limits.cpu': '4',
          'limits.memory': '8GB'
        };
      } else if (tier === 'Custom' && customSpecs) {
        payload.config = {
          'limits.cpu': customSpecs.cpu.toString(),
          'limits.memory': customSpecs.ram
        };
        payload.devices = {
          ...(payload.devices || {}),
          root: {
            path: '/',
            pool: 'default',
            type: 'disk',
            size: customSpecs.storage
          }
        };
      }

      const project = user ? `member-${user.username}`.toLowerCase().replace(/_/g, '-').replace(/\./g, '-') : '';
      await api.post(`/api/instances/?project=${project}`, payload);
      fetchMemberInstances();

      // Auto-create DNS subdomain mapping: {instancename}.{username}.tblinc.com
      try {
        const sanitizedName = name.toLowerCase().replace(/\s+/g, '-');
        const username = user?.username?.toLowerCase().replace(/_/g, '-').replace(/\./g, '-') || 'member';
        const autoSubdomain = `${sanitizedName}.${username}.tblinc.com`;
        await api.post(`/api/dns-rules/?project=${project}`, {
          subdomain: autoSubdomain,
          target_instance: sanitizedName,
          project: project,
          status: 'Active'
        });
        fetchDnsRules();
        fetchDashboardStats();
      } catch (dnsErr) {
        console.warn('Auto DNS creation skipped:', dnsErr);
      }
    } catch (err: any) {
      console.error("Failed to launch member instance", err);
      alert(`Failed to launch instance: ${err.response?.data?.error || "Ensure the name is unique."}`);
    }
  };

  const handleInstanceAction = async (id: string, action: 'start' | 'stop' | 'restart') => {
    try {
      const project = user ? `member-${user.username}`.toLowerCase().replace(/_/g, '-').replace(/\./g, '-') : '';
      await api.post(`/api/instances/${id}/action/?project=${project}`, { action });
      fetchMemberInstances();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDestroyInstance = async (id: string) => {
    const inst = instances.find(i => i.id === id);
    if (!inst) return;
    
    const isRunning = inst.status === 'Running';
    const message = isRunning
      ? `Instance ${id} is currently running. We will stop it first, then destroy it. Proceed?`
      : `Are you sure you want to delete instance ${id}? This action cannot be undone. Proceed?`;

    if (!window.confirm(message)) {
      return;
    }

    try {
      const project = user ? `member-${user.username}`.toLowerCase().replace(/_/g, '-').replace(/\./g, '-') : '';
      if (isRunning) {
        await api.post(`/api/instances/${id}/action/?project=${project}`, { action: 'stop', force: true });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      await api.delete(`/api/instances/${id}/?project=${project}`);
      fetchMemberInstances();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddDns = async (subdomain: string, targetInstance: string) => {
    const fullDomain = subdomain.includes('.') ? subdomain : `${subdomain}.tblinc.com`;
    try {
      const project = user ? `member-${user.username}`.toLowerCase().replace(/_/g, '-').replace(/\./g, '-') : '';
      await api.post(`/api/dns-rules/?project=${project}`, {
        subdomain: fullDomain,
        target_instance: targetInstance,
        project: project,
        status: 'Active'
      });
      fetchDnsRules();
      fetchDashboardStats(); // update count
    } catch (err) {
      console.error("Failed to add DNS rule", err);
      alert("Failed to create DNS mapping. Ensure subdomain is unique.");
    }
  };

  const handleDeleteDns = async (id: string) => {
    try {
      await api.delete(`/api/dns-rules/${id}/`);
      fetchDnsRules();
      fetchDashboardStats(); // update count
    } catch (err) {
      console.error("Failed to delete DNS rule", err);
    }
  };

  const menuItems = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" />, section: 'My Workspace' },
    { key: 'instances', label: 'My Instances', icon: <Server className="w-5 h-5" />, section: 'My Workspace' },
    { key: 'projects', label: 'Projects', icon: <Layers className="w-5 h-5" />, section: 'My Workspace' },
    { key: 'marketplace', label: 'Marketplace', icon: <ShoppingBag className="w-5 h-5" />, section: 'My Workspace' },
    { key: 'dns', label: 'DNS Domains', icon: <Globe className="w-5 h-5" />, section: 'My Workspace' },
    
    { key: 'network', label: 'Networks', icon: <Network className="w-5 h-5" />, section: 'Services' },
    { key: 'storage', label: 'Storage', icon: <HardDrive className="w-5 h-5" />, section: 'Services' },
    { key: 'images', label: 'Base OS Images', icon: <Image className="w-5 h-5" />, section: 'Services' },
    { key: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" />, section: 'Account' }
  ] as const;

  const renderActiveSubView = () => {
    switch (activeSubTab) {
      case 'overview':
        return (
          <div className="space-y-6 text-left animate-none">
            <div>
              <h3 className="text-2xl font-bold text-app-text-h">Welcome back, {user?.username || 'Member'}!</h3>
              <p className="text-gray-400 text-sm mt-1">Here is a quick overview of your container resources.</p>
            </div>

            {/* Quick Start Tour CTA (overview only) */}
            {tourStep === 0 && (
              <div className="p-5 rounded-2xl border border-app-border bg-app-card/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-left">
                <div className="space-y-1">
                  <h4 className="font-bold text-app-text-h text-sm">✨ Member Quick Start Tour</h4>
                  <p className="text-xs text-gray-400 font-medium">Run the step-by-step tour to see the full login, compute launch, and DNS deployment flow.</p>
                </div>
                <button
                  onClick={() => setTourStep(1)}
                  className="px-4 py-2.5 bg-teal-600/10 hover:bg-teal-600/25 border border-teal-500/30 hover:border-teal-500/50 text-teal-300 font-bold rounded-xl text-[10px] transition cursor-pointer whitespace-nowrap"
                >
                  Start Tour
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl border border-app-border bg-app-card/40 space-y-2">
                <div className="text-xs text-gray-400 uppercase font-semibold">Active Apps</div>
                <div className="text-2xl font-extrabold text-app-text-h">
                  {dashboardStats?.instances?.total ?? instances.length}
                </div>
              </div>
              <div className="p-5 rounded-2xl border border-app-border bg-app-card/40 space-y-2">
                <div className="text-xs text-gray-400 uppercase font-semibold">Allocated CPU</div>
                <div className="text-2xl font-extrabold text-app-text-h">
                  {dashboardStats?.instances?.cpu_allocated ?? instances.reduce((acc, curr) => acc + curr.cpu, 0)} vCPU
                </div>
              </div>
              <div className="p-5 rounded-2xl border border-app-border bg-app-card/40 space-y-2">
                <div className="text-xs text-gray-400 uppercase font-semibold">DNS Domains</div>
                <div className="text-2xl font-extrabold text-app-text-h">
                  {dashboardStats?.dns_rules_count ?? dnsRules.length} Mapping
                </div>
              </div>
              <div className="p-5 rounded-2xl border border-app-border bg-app-card/40 space-y-2">
                <div className="text-xs text-gray-400 uppercase font-semibold">Plan Status</div>
                <div className="text-2xl font-extrabold text-teal-400">
                  {(() => {
                    if (!dashboardStats) return "Pro Tier";
                    const cpu = dashboardStats.instances.cpu_allocated;
                    const mem = dashboardStats.instances.memory_allocated_mb;
                    if (mem > 4096 || cpu > 2) return "Advanced Tier";
                    if (mem > 1024 || cpu > 1) return "Pro Tier";
                    return "Free Tier";
                  })()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 p-6 rounded-2xl border border-app-border bg-app-card/30 space-y-4">
                <h4 className="font-bold text-app-text-h text-sm uppercase text-gray-400 tracking-wider">
                  Virtual Resource Allocation Quotas
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-400">Memory Allocation</span>
                      <span className="text-app-text-h">
                        {((dashboardStats?.instances?.memory_allocated_mb ?? 2560) / 1024).toFixed(1)} GB / 8 GB
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, Math.round(((dashboardStats?.instances?.memory_allocated_mb ?? 2560) / 8192) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-400">Disk Volumes Leased</span>
                      <span className="text-app-text-h">
                        {dashboardStats?.storage_volumes_count ?? 2} / 10 Volumes
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (dashboardStats?.storage_volumes_count ?? 2) * 10)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1 p-6 rounded-2xl border border-app-border bg-app-card/30 flex flex-col justify-between">
                <div className="space-y-2">
                  <h4 className="font-bold text-app-text-h text-sm">Need more power?</h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Upgrade to the Advanced compute cluster for higher CPU cores limits, auto backup policies, and custom dedicated SSL domain addresses.
                  </p>
                </div>
                <button
                  onClick={() => setActiveSubTab('billing')}
                  className="w-full mt-4 py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-600 hover:to-indigo-700 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Explore Advanced Plans
                </button>
              </div>
            </div>
          </div>
        );
      case 'instances':
        return (
          <MemberInstancesView
            instances={instances}
            user={user}
            onLaunch={handleLaunchInstance}
            onAction={handleInstanceAction}
            onDestroy={handleDestroyInstance}
          />
        );
      case 'marketplace':
        return (
          <MemberMarketplaceView
            onLaunchTemplate={(name, template, tier) => {
              handleLaunchInstance(name, template, tier);
              setActiveSubTab('instances');
            }}
          />
        );
      case 'dns':
        return (
          <MemberDnsView
            instances={instances}
            dnsRules={dnsRules}
            onAddDns={handleAddDns}
            onDeleteDns={handleDeleteDns}
          />
        );
      case 'network':
        return <MemberNetworkView user={user} />;
      case 'storage':
        return <MemberStorageView />;
      case 'projects':
        return <MemberProjectView instancesCount={instances.length} />;
      case 'images':
        return <MemberImagesView />;
      case 'billing':
        return <MemberBillingView instances={instances} refreshUser={refreshUser} />;
      case 'settings':
        return <MemberSettingsView user={user} refreshUser={refreshUser} instancesCount={instances.length} />;
      default:
        return <div className="text-left text-sm text-gray-400">View not found.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex">
      {/* Sidebar Navigation */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r border-app-border bg-app-sidebar flex flex-col justify-between shrink-0 transition-all duration-300`}>
        <div className={isSidebarCollapsed ? 'p-4' : 'p-6'}>
          <button
            onClick={() => {
              window.location.hash = '#portal';
            }}
            title="Go to Gateway"
            className={`flex items-center gap-3 mb-8 ${isSidebarCollapsed ? 'justify-center font-bold' : ''} text-left border-transparent bg-transparent hover:opacity-85 transition cursor-pointer w-fit p-0`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/25 shrink-0">
              <Server className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <span className="font-extrabold text-xl tracking-wider text-app-text-h whitespace-nowrap">Member Cloud</span>
            )}
          </button>

          <nav className="space-y-1.5 text-left select-none overflow-y-auto max-h-[70vh] scrollbar-thin">
            {menuItems.map((item, index) => {
              const showHeader = index === 0 || menuItems[index - 1].section !== item.section;
              return (
                <React.Fragment key={item.key}>
                  {showHeader && (
                    !isSidebarCollapsed ? (
                      <div className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2 ${index > 0 ? 'pt-4' : ''}`}>
                        {item.section}
                      </div>
                    ) : (
                      index > 0 && <div className="h-px bg-app-border-dim my-3 mx-2" />
                    )
                  )}
                  <button
                    onClick={() => setActiveSubTab(item.key as any)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2 rounded-xl font-semibold transition-all cursor-pointer border text-xs ${
                      activeSubTab === item.key
                        ? 'bg-teal-600/15 border-teal-500/30 text-teal-300 font-bold'
                        : 'text-gray-400 hover:text-app-text-h hover:bg-app-border-dim border-transparent'
                    }`}
                  >
                    {item.icon}
                    {!isSidebarCollapsed && <span>{item.label}</span>}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="p-4 border-t border-app-border bg-app-bg/5 text-left space-y-3">
          <button
            onClick={() => {
              window.location.hash = '';
            }}
            title="Return to Public Home Page"
            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-2 px-2'} py-1.5 rounded-xl text-[10px] font-bold bg-app-card hover:bg-app-border-dim border border-app-border text-app-text transition-all cursor-pointer`}
          >
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            {!isSidebarCollapsed && <span>Public Home Page</span>}
          </button>

          {isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-4">
              <button
                onClick={() => setActiveSubTab('profile')}
                className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 font-bold flex items-center justify-center text-sm shrink-0 border border-teal-500/30 hover:bg-teal-500/30 transition-all cursor-pointer"
                title={user?.username || 'user'}
              >
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'ME'}
              </button>
              <button
                onClick={onLogout}
                title="Logout"
                className="p-2 rounded-lg text-gray-400 hover:text-rose-455 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 max-w-[80%]">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/15 text-teal-400 font-bold flex items-center justify-center text-sm shrink-0 border border-teal-500/30">
                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'ME'}
                  </div>
                  <div className="truncate text-xs font-semibold text-app-text-h">
                    {user?.username || 'member_user'}
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  title="Logout"
                  className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer animate-none"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>
              <div className="text-[9px] text-gray-500 font-mono text-center mt-2 truncate max-w-full px-2" title={dashboardStats?.project_name}>
                Workspace: {dashboardStats?.project_name || 'member-sandbox'}
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden max-h-screen">
        {/* Top Header */}
        <header className="h-16 border-b border-app-border bg-app-header backdrop-blur-xl px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              className="p-2 rounded-lg bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer mr-2"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-app-bg border border-app-border shadow-inner text-teal-400">
                <LayoutDashboard className="w-5 h-5" />
              </span>
              <span className="text-gray-500 text-xs font-semibold">/</span>
              <span className="text-app-text-h font-extrabold text-sm tracking-wider uppercase">Member Workspace</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/5 border border-blue-500/25 text-xs font-bold text-blue-600 dark:text-blue-400">
              <DollarSign className="w-3.5 h-3.5" />
              <span>Balance: ${user?.balance !== undefined ? Number(user.balance).toFixed(2) : '0.00'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/5 border border-teal-500/25 text-xs font-bold text-teal-400">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse shadow-[0_0_8px_#14b8a6]" />
              Active Subscriptions
            </div>
            {/* Theme Toggle Button */}
            <button
              onClick={cycleTheme}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-app-bg hover:bg-app-border-dim border border-app-border text-app-text transition-all cursor-pointer text-xs font-bold"
              title={`Theme: ${themeConfig[theme].label} → click for ${themeConfig[theme].next}`}
            >
              {themeConfig[theme].icon}
              <span className="hidden sm:inline text-app-text-h">{themeConfig[theme].label}</span>
            </button>

            <button
              onClick={() => setActiveSubTab('billing')}
              className="p-2 rounded-xl bg-app-bg hover:bg-app-border-dim border border-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer"
              title="Billing"
            >
              <CreditCard className="w-4.5 h-4.5" />
            </button>
          </div>
        </header>

        {/* Scrollable View Area */}
        <div className="flex-1 flex flex-col overflow-hidden max-h-[calc(100vh-4rem)]">
          {/* Persistent Tour Overlay Banner */}
          <AnimatePresence>
            {tourStep > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="shrink-0 mx-8 mt-6 p-4 rounded-2xl border border-teal-500/40 bg-gradient-to-r from-teal-500/10 to-indigo-500/10 backdrop-blur-sm"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping shrink-0 mt-1" />
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-extrabold text-[10px] text-teal-300 uppercase tracking-widest">
                          Workspace Tour — Step {tourStep} of 4
                        </h4>
                        <div className="flex gap-1">
                          {[1,2,3,4].map(s => (
                            <div key={s} className={`h-1 w-6 rounded-full transition-colors ${s <= tourStep ? 'bg-teal-400' : 'bg-white/10'}`} />
                          ))}
                        </div>
                      </div>

                      {tourStep === 1 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div>
                            <p className="text-sm text-app-text-h font-bold">Step 1: Member Authentication</p>
                            <p className="text-xs text-gray-400">Your session creates isolated databases & private networks so your apps don't overlap with other tenants.</p>
                          </div>
                          <button
                            onClick={() => {
                              const demoInst: MemberInstance = {
                                id: 'demo-app-host', name: 'demo-app-host',
                                template: 'Ubuntu Base OS', status: 'Running',
                                ipAddress: '10.123.4.99', cpu: 2, ram: '2GB',
                                disk: '40GB', uptime: 'Just created via tour', tier: 'Pro'
                              };
                              setInstances(prev => [...prev, demoInst]);
                              setActiveSubTab('instances');
                              setTourStep(2);
                            }}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-[10px] transition cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Next →
                          </button>
                        </div>
                      )}

                      {tourStep === 2 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div>
                            <p className="text-sm text-app-text-h font-bold">Step 2: Provision Compute Host</p>
                            <p className="text-xs text-gray-400">A demo container <span className="text-teal-400 font-mono">demo-app-host</span> was added to your Instances. Navigate to <strong className="text-white">Instances</strong> to see it running.</p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveSubTab('projects');
                              setTourStep(3);
                            }}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-[10px] transition cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Next →
                          </button>
                        </div>
                      )}

                      {tourStep === 3 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div>
                            <p className="text-sm text-app-text-h font-bold">Step 3: Deploy Git Project</p>
                            <p className="text-xs text-gray-400">Link a public repository and select <span className="text-teal-400 font-mono">demo-app-host</span> as the target. Check the <strong className="text-white">Projects</strong> tab.</p>
                          </div>
                          <button
                            onClick={() => {
                              const demoDns: MemberDnsRule = {
                                id: 'dns-demo-tour',
                                subdomain: 'demo-portfolio.tblinc.com',
                                targetInstance: 'demo-app-host',
                                status: 'Active'
                              };
                              setDnsRules(prev => [...prev, demoDns]);
                              setActiveSubTab('dns');
                              setTourStep(4);
                            }}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-[10px] transition cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Next →
                          </button>
                        </div>
                      )}

                      {tourStep === 4 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div>
                            <p className="text-sm text-app-text-h font-bold">Step 4: Ingress & DNS Routing ✅</p>
                            <p className="text-xs text-gray-400"><span className="text-teal-400 font-mono">demo-portfolio.tblinc.com</span> is now routed to <span className="text-teal-400 font-mono">demo-app-host</span>. Check the <strong className="text-white">DNS</strong> tab!</p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveSubTab('network');
                              setTourStep(5);
                            }}
                            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-[10px] transition cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Next →
                          </button>
                        </div>
                      )}

                      {tourStep === 5 && (
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                          <div>
                            <p className="text-sm text-app-text-h font-bold">Step 5: Member Network ✅</p>
                            <p className="text-xs text-gray-400">Your instance is deployed in a secure, isolated OVN virtual network. Check the <strong className="text-white">Networks</strong> tab to view your subnets.</p>
                          </div>
                          <button
                            onClick={() => {
                              setActiveSubTab('overview');
                              setTourStep(0);
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[10px] transition cursor-pointer whitespace-nowrap shrink-0"
                          >
                            Finish 🎉
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setTourStep(0)}
                    className="text-[10px] text-gray-500 hover:text-white cursor-pointer hover:underline shrink-0"
                  >
                    Skip
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 p-8 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSubTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="h-full"
              >
                {renderActiveSubView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
