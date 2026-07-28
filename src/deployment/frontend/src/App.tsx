import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from './store/auth';
import InstancesView from './view/instances';
import StorageView from './view/storage';
import ProjectsView from './view/projects';
import ProfileView from './view/profile';
import ImagesView from './view/images';
import NetworkingView from './view/networking';
import OperationsView from './view/operations';
import ServerView from './view/server';
import ConfigurationView from './view/configuration';
import UsageView from './view/usage';
import WarningsView from './view/warnings';
import MembersAdminView from './view/members';
import TransactionsView from './view/transactions';
import MemberDashboard from './components/member/dashboard';
import AdminDashboardView from './components/admin/dashboard';
import MemberMarketplaceView from './components/member/marketplace';
import LandingPage from './landing';
import DocsPage from './components/docs';
import { AuthScreen } from './components/AuthScreen';
import { Server, HardDrive, Layers, User, Users, LogOut, Terminal, Shield, LogIn, Lock, Mail, Activity, Image, Network, CheckCircle2, Monitor, Settings, BarChart3, Bell, Menu, Sun, Moon, Palette, ArrowRight, LayoutDashboard, ShoppingBag, Globe, X, CreditCard } from 'lucide-react';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

export default function App() {
  const { user, loading, isAuthenticated, login, register, logout, refreshUser, completeGithubLogin } = useAuth();
  const resolvePortal = () => {
    const path = window.location.pathname.replace(/\/$/, '');
    if (path === '/docs' || path.startsWith('/docs/')) return 'docs';
    if (path === '/admin' || path.startsWith('/admin/')) return 'admin';
    if (path === '/member' || path.startsWith('/member/')) return 'member';
    if (path === '/portal' || path.startsWith('/portal/')) return 'main';

    const hash = window.location.hash;
    if (hash === '#admin' || hash === '#admin/') return 'admin';
    if (hash === '#member' || hash === '#member/') return 'member';
    if (hash === '#portal' || hash === '#portal/') return 'main';
    if (hash === '#docs' || hash === '#docs/') return 'docs';
    if (hash === '#login' || hash === '#login/') return 'auth';
    
    return 'landing';
  };

  const [portal, setPortal] = useState<'landing' | 'main' | 'admin' | 'member' | 'docs' | 'auth'>(resolvePortal);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'instances' | 'storage' | 'projects' | 'profile' | 'images' | 'networking' | 'operations' | 'server' | 'configuration' | 'usage' | 'warnings' | 'members' | 'transactions'>('dashboard');
  const [gatewayTab, setGatewayTab] = useState<'overview' | 'marketplace' | 'member' | 'admin'>('overview');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'blue'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark' || saved === 'blue') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark', 'blue');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  React.useEffect(() => {
    const handleNavigation = () => {
      setPortal(resolvePortal());
    };
    handleNavigation();
    window.addEventListener('hashchange', handleNavigation);
    window.addEventListener('popstate', handleNavigation);
    return () => {
      window.removeEventListener('hashchange', handleNavigation);
      window.removeEventListener('popstate', handleNavigation);
    };
  }, []);


  React.useEffect(() => {
    if (portal === 'admin') {
      if (window.location.hash !== '#admin/') {
        window.location.hash = '#admin/';
      }
    } else if (portal === 'member') {
      if (window.location.hash !== '#member') {
        window.location.hash = '#member';
      }
    } else if (portal === 'main') {
      if (window.location.hash !== '#portal' && window.location.hash !== '#portal/') {
        window.location.hash = '#portal';
      }
    } else if (portal === 'auth') {
      if (window.location.hash !== '#login') {
        window.location.hash = '#login';
      }
    } else if (portal === 'landing') {
      if (window.location.hash !== '' && window.location.hash !== '#') {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [portal]);

  // Route Guard: Prevent non-admin users from accessing the admin console
  React.useEffect(() => {
    if (isAuthenticated && user) {
      const isAdmin = !!(user.is_staff || user.is_superuser);
      if (portal === 'admin' && !isAdmin) {
        setPortal('member');
        window.location.hash = '#member';
      }
    }
  }, [user, portal, isAuthenticated]);

  // Handle OAuth callback (e.g. GitHub)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get('state');
    const code = params.get('code');
    
    if (state && code && completeGithubLogin) {
      window.history.replaceState({}, document.title, window.location.pathname);
      completeGithubLogin(state, code).then(res => {
        if (res.success) {
          const isAdmin = !!(res.user?.is_superuser || res.user?.is_staff);
          const hash = isAdmin ? '#admin' : '#member';
          window.location.hash = hash;
          // Force reload so token is fully propagated or just let hashchange do it
          window.location.reload();
        } else {
          console.error("GitHub Login Error:", res.error);
          alert("GitHub login failed: " + res.error);
        }
      });
    }
  }, []);

  const cycleTheme = () => {
    setTheme(t => t === 'dark' ? 'light' : t === 'light' ? 'blue' : 'dark');
  };

  const themeConfig = {
    dark:  { label: 'Dark',  icon: <Moon  className="w-4 h-4 text-indigo-400" />,  next: 'Light' },
    light: { label: 'Light', icon: <Sun   className="w-4 h-4 text-amber-500" />,   next: 'Blue'  },
    blue:  { label: 'Blue',  icon: <Palette className="w-4 h-4 text-blue-400" />,  next: 'Dark'  },
  } as const;
  
  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboardView onNavigate={setActiveTab as any} />;
      case 'instances':
        return <InstancesView />;
      case 'storage':
        return <StorageView />;
      case 'projects':
        return <ProjectsView isAdmin={true} />;
      case 'profile':
        return <ProfileView user={user} refreshUser={refreshUser} />;
      case 'members':
        return <MembersAdminView />;
      case 'images':
        return <ImagesView />;
      case 'networking':
        return <NetworkingView />;
      case 'operations':
        return <OperationsView />;
      case 'server':
        return <ServerView />;
      case 'configuration':
        return <ConfigurationView />;
      case 'usage':
        return <UsageView />;
      case 'warnings':
        return <WarningsView />;
      case 'transactions':
        return <TransactionsView />;
      default:
        return <AdminDashboardView onNavigate={setActiveTab as any} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08060d] text-white flex flex-col items-center justify-center gap-4">
        <Activity className="w-12 h-12 text-purple-500 animate-spin" />
        <p className="text-gray-400 font-medium">Loading credentials...</p>
      </div>
    );
  }

    const renderPortal = () => {
// Render Public Landing Page
  if (portal === 'landing') {
    return (
      <motion.div key="landing" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="w-full min-h-screen absolute top-0 left-0">
        <LandingPage theme={theme} cycleTheme={cycleTheme} themeConfig={themeConfig} />
      </motion.div>
    );
  }

  // Render Documentation Portal
  if (portal === 'docs') {
    return (
      <motion.div key="docs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="w-full min-h-screen absolute top-0 left-0">
        <DocsPage theme={theme} cycleTheme={cycleTheme} themeConfig={themeConfig} />
      </motion.div>
    );
  }

  // Render Main Gateway/Dashboard if portal is 'main'
  if (portal === 'main') {
    const mainMenuItems = [
      { key: 'overview', label: 'Portal Gateway', icon: <LayoutDashboard className="w-5 h-5 shrink-0" />, active: gatewayTab === 'overview' },
      { key: 'marketplace', label: 'App Marketplace', icon: <ShoppingBag className="w-5 h-5 shrink-0" />, active: gatewayTab === 'marketplace' },
      { key: 'member', label: 'Member Sandbox', icon: <User className="w-5 h-5 shrink-0" />, active: false },
    ];

    const handleMainMenuItemClick = (key: string) => {
      if (key === 'member') {
        window.location.hash = '#member';
        setPortal('member');
      } else if (key === 'marketplace') {
        setGatewayTab('marketplace');
      } else {
        window.location.hash = '#portal';
        setPortal('main');
        setGatewayTab('overview');
      }
    };

    return (
      <motion.div key="main" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="w-full min-h-screen absolute top-0 left-0">
      <div className="min-h-screen bg-app-bg text-app-text flex w-full">
        {/* Background gradient rings */}
        <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-purple-500/5 dark:bg-purple-950/15 blur-[180px] pointer-events-none z-0" />
        <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-teal-500/5 dark:bg-teal-950/10 blur-[180px] pointer-events-none z-0" />

        {/* Sidebar navigation */}
        <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r border-app-border bg-app-sidebar flex flex-col justify-between shrink-0 transition-all duration-300 z-10`}>
          <div className={isSidebarCollapsed ? 'p-4' : 'p-6'}>
            <button
              onClick={() => handleMainMenuItemClick('overview')}
              title="Portal Gateway"
              className={`flex items-center gap-3 mb-8 ${isSidebarCollapsed ? 'justify-center font-bold' : ''} text-left border-transparent bg-transparent hover:opacity-85 transition cursor-pointer w-fit p-0`}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
                <Terminal className="w-5 h-5 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <span className="font-extrabold text-xl tracking-wider text-app-text-h whitespace-nowrap">TblInc Cloud</span>
              )}
            </button>

            <nav className="space-y-1.5 text-left">
              {!isSidebarCollapsed && (
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2">
                  Portals
                </div>
              )}
              
              {mainMenuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => handleMainMenuItemClick(item.key)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl font-semibold transition-all cursor-pointer border ${
                    item.active
                      ? 'bg-purple-600/15 border-purple-500/30 text-purple-600 dark:text-purple-300'
                      : 'text-gray-400 hover:text-app-text-h hover:bg-app-border-dim border-transparent'
                  }`}
                >
                  {item.icon}
                  {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Sidebar Footer info */}
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

            {!isSidebarCollapsed ? (
              <>
                <div className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider text-center">
                  Gateway Portal
                </div>
                <div className="text-[9px] text-gray-500 text-center font-mono mt-1">
                  Version 1.0.0 (Old Kingdom)
                </div>
              </>
            ) : (
              <div className="text-center font-bold text-gray-500 text-xs">G</div>
            )}
          </div>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden max-h-screen z-10 w-full">
          {/* Top Navbar */}
          <header className="h-16 border-b border-app-border bg-app-header backdrop-blur-xl px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
            <div className="flex items-center gap-4">
              {/* Sidebar toggle button */}
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 rounded-xl bg-app-bg hover:bg-app-border-dim border border-app-border text-gray-400 hover:text-app-text-h transition-all cursor-pointer mr-1"
                title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                <Menu className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl bg-app-bg border border-app-border shadow-inner text-purple-600 dark:text-purple-300">
                  <Terminal className="w-4 h-4" />
                </span>
                <span className="text-gray-500 text-xs font-semibold">/</span>
                <span className="text-app-text-h font-extrabold text-sm tracking-wider uppercase">Portal Gateway</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Status Indicator */}
              <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/25 text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-450 animate-pulse" />
                Services Online
              </div>

              {/* Login / Sign up */}
              <button
                onClick={() => { window.location.hash = '#login'; }}
                className="text-xs font-bold text-gray-400 hover:text-app-text-h transition cursor-pointer"
              >
                Log in
              </button>

              <button
                onClick={() => { window.location.hash = '#login'; }}
                className="px-4 py-1.5 text-xs font-bold bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all shadow-lg shadow-purple-500/20 cursor-pointer"
              >
                Sign up
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={cycleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-app-card hover:bg-app-border-dim border border-app-border text-app-text transition-all cursor-pointer text-xs font-bold"
                title={`Theme: ${themeConfig[theme].label} → click for ${themeConfig[theme].next}`}
              >
                {themeConfig[theme].icon}
                <span className="hidden sm:inline text-app-text-h">{themeConfig[theme].label}</span>
              </button>

              {/* Logout button if logged in */}
              {isAuthenticated && (
                <button 
                  onClick={logout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-app-card hover:bg-rose-500/10 hover:text-rose-550 border border-app-border rounded-xl font-bold transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span className="hidden sm:inline text-rose-500">Logout</span>
                </button>
              )}
            </div>
          </header>

          {/* Scrollable Content Area */}
          <div className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
            {gatewayTab === 'marketplace' ? (
              <div className="max-w-5xl mx-auto w-full animate-none">
                <MemberMarketplaceView 
                  onLaunchTemplate={(template) => {
                    window.location.hash = '#member';
                    setPortal('member');
                  }} 
                />
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center py-6 max-w-5xl mx-auto w-full text-center space-y-16">
                
                {/* Announcement Badge */}
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setGatewayTab('marketplace')}
                  className="mx-auto w-fit flex items-center gap-2.5 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/15 text-xs font-bold text-purple-600 dark:text-purple-300 tracking-wide cursor-pointer transition active:scale-[0.98] shadow-lg shadow-purple-500/5 hover:border-purple-500/30"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>[New] Explore preset templates in the App Marketplace &rarr;</span>
                </motion.div>

                {/* Hero Section */}
                <div className="space-y-4 max-w-2xl text-center">
                  <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-app-text-h m-0 leading-tight">
                    Next-Gen <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-teal-400 bg-clip-text text-transparent">Sandbox Cloud</span>
                  </h1>
                  <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">
                    Deploy sandboxes, launch custom containers, and manage virtual machines in a secure, isolated container ecosystem powered by Incus technology.
                  </p>
                </div>

                {/* Portals Selector Grid */}
                <div className="grid grid-cols-1 max-w-xl mx-auto gap-8 w-full">
                  {/* Member Portal Card */}
                  <motion.div
                    whileHover={{ y: -6, scale: 1.01 }}
                    className="p-8 rounded-3xl border border-app-border bg-app-card/40 backdrop-blur-xl shadow-xl flex flex-col justify-between text-left h-80 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-teal-500/10 transition-colors" />
                    
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-teal-500/10">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-extrabold text-app-text-h">Member Portal</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-2 leading-relaxed">
                          Deploy your sandboxes, launch custom containers, manage storage volumes, map private OVN subnets, and scale resources inside isolated user namespaces.
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        window.location.hash = '#member';
                        setPortal('member');
                      }}
                      className="w-fit mt-6 px-6 py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-700 hover:to-indigo-700 text-white flex items-center gap-2 group-hover:gap-3 transition-all cursor-pointer shadow-lg shadow-teal-500/10"
                    >
                      Enter Member Sandbox
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                </div>

                {/* System status dashboard mock console */}
                <div className="p-6 rounded-3xl border border-app-border bg-app-card/30 w-full text-left space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-app-text-h text-lg">Cluster Status Dashboard</h3>
                      <p className="text-gray-400 text-xs mt-0.5">Real-time status parameters of physical cluster pools.</p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/25 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Hypervisor: Active
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Hypervisor Load', value: '14.2%', sub: 'Avg 8 cores load', icon: <Activity className="w-4 h-4 text-purple-400" /> },
                      { label: 'Cluster Nodes', value: '4 / 4 Online', sub: 'Oregon Region Pool', icon: <Layers className="w-4 h-4 text-teal-400" /> },
                      { label: 'Isolated Nets', value: '18 Active OVN', sub: 'DHCP Pool leased', icon: <Network className="w-4 h-4 text-cyan-400" /> },
                      { label: 'Cluster Memory', value: '4.8 / 16.0 GB', sub: '30.0% Allocation', icon: <HardDrive className="w-4 h-4 text-pink-400" /> }
                    ].map((metric, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-app-border bg-app-bg/5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-app-border-dim flex items-center justify-center">
                          {metric.icon}
                        </div>
                        <div>
                          <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{metric.label}</div>
                          <div className="text-sm font-bold text-app-text-h mt-0.5">{metric.value}</div>
                          <div className="text-[10px] text-gray-400 mt-0.5">{metric.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Features Highlights Matrix */}
                <div className="space-y-6 w-full text-left">
                  <div className="text-center md:text-left">
                    <h3 className="font-extrabold text-app-text-h text-2xl tracking-tight">Ecosystem Architecture</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Engineered for bare-metal speed and absolute security isolation.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                    {[
                      {
                        title: 'Bare-Metal Hypervisors',
                        desc: 'LXD-derived container virtualization delivering native bare-metal execution speeds without traditional VM hypervisor overhead.',
                        icon: <Server className="w-5 h-5 text-purple-400" />
                      },
                      {
                        title: 'Software-Defined OVN',
                        desc: 'Private isolated subnets dynamically provisioned inside isolated namespaces to guarantee packet filtering integrity.',
                        icon: <Network className="w-5 h-5 text-teal-400" />
                      },
                      {
                        title: 'Ceph Storage Pool',
                        desc: 'Persistent, clustered block volumes automatically scaling storage limits for containers, folders, or base images.',
                        icon: <HardDrive className="w-5 h-5 text-pink-400" />
                      },
                      {
                        title: 'Resource Throttling',
                        desc: 'Dynamic control limits configuring custom vCPU shares, memory bounds, and bandwidth pools per container namespace.',
                        icon: <Layers className="w-5 h-5 text-indigo-400" />
                      },
                      {
                        title: 'Alert Monitoring',
                        desc: 'Global monitoring tools compiling threshold warnings, CPU spikes, and warning logs to keep clusters running smoothly.',
                        icon: <Bell className="w-5 h-5 text-rose-400" />
                      },
                      {
                        title: 'Template Catalog',
                        desc: 'Ready-to-launch presets for Django, NodeJS, WordPress, Laravel, or databases to spin up sandboxes in 3 seconds.',
                        icon: <ShoppingBag className="w-5 h-5 text-violet-400" />
                      }
                    ].map((feat, i) => (
                      <div key={i} className="p-6 rounded-2xl border border-app-border bg-app-card/20 space-y-3 hover:bg-app-card/35 transition duration-300">
                        <div className="w-9 h-9 rounded-xl bg-app-border-dim flex items-center justify-center">
                          {feat.icon}
                        </div>
                        <h4 className="font-extrabold text-app-text-h text-sm">{feat.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <footer className="text-center text-[10px] text-gray-500 mt-12 font-mono py-6 border-t border-app-border">
              Powered by Incus Hypervisor Cluster • Version 1.0.0 (Old Kingdom)
            </footer>
          </div>
        </main>
      </div>
    );
      </motion.div>
    );
  }

  // Show Auth Screen when navigating to #login OR when not logged in (on a protected route)
  if (portal === 'auth' || (!isAuthenticated && (portal === 'main' || portal === 'member' || portal === 'admin'))) {
    const authPortal: 'admin' | 'member' | 'gateway' =
      portal === 'admin' ? 'admin' : portal === 'member' ? 'member' : 'gateway';
    return (
      <motion.div key="auth" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="w-full min-h-screen absolute top-0 left-0">
        <AuthScreen 
          portal={authPortal}
          theme={theme} 
          cycleTheme={cycleTheme} 
          themeConfig={themeConfig} 
          onBackToGateway={() => window.location.hash = '#portal'} 
        />
      </motion.div>
    );
  }

  // Render Member Dashboard if in Member Portal
  if (portal === 'member') {
    return (
      <motion.div key="member" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="w-full min-h-screen absolute top-0 left-0">
        <MemberDashboard 
          user={user} 
          onLogout={logout} 
          theme={theme} 
          cycleTheme={cycleTheme} 
          themeConfig={themeConfig} 
          refreshUser={refreshUser}
        />
      </motion.div>
    );
  }

  const tabConfig = {
    dashboard: { label: 'Overview', icon: <Shield className="w-5.5 h-5.5 text-purple-400" /> },
    instances: { label: 'Instances', icon: <Server className="w-5.5 h-5.5 text-purple-400" /> },
    storage: { label: 'Storage', icon: <HardDrive className="w-5.5 h-5.5 text-pink-400" /> },
    projects: { label: 'Projects', icon: <Layers className="w-5.5 h-5.5 text-teal-400" /> },
    images: { label: 'Images', icon: <Image className="w-5.5 h-5.5 text-violet-400" /> },
    networking: { label: 'Networking', icon: <Network className="w-5.5 h-5.5 text-cyan-400" /> },
    operations: { label: 'Operations', icon: <Activity className="w-5.5 h-5.5 text-amber-400" /> },
    server: { label: 'Server Info', icon: <Monitor className="w-5.5 h-5.5 text-indigo-400" /> },
    usage: { label: 'Resource Usage', icon: <BarChart3 className="w-5.5 h-5.5 text-orange-400" /> },
    warnings: { label: 'System Warnings', icon: <Bell className="w-5.5 h-5.5 text-rose-400" /> },
    configuration: { label: 'Configuration', icon: <Settings className="w-5.5 h-5.5 text-slate-400" /> },
    profile: { label: 'User Profile', icon: <User className="w-5.5 h-5.5 text-purple-400" /> },
    members: { label: 'Members', icon: <Users className="w-5.5 h-5.5 text-indigo-400" /> },
    transactions: { label: 'Transactions', icon: <CreditCard className="w-5.5 h-5.5 text-blue-400" /> },
  };

  const menuItems = [
    { section: 'Infrastructures', key: 'dashboard', label: 'Overview', icon: <Shield className="w-5 h-5 shrink-0" />, activeClass: 'bg-purple-600/15 border-purple-500/30 text-purple-600 dark:text-purple-300' },
    { section: 'Infrastructures', key: 'instances', label: 'Instances', icon: <Server className="w-5 h-5 shrink-0" />, activeClass: 'bg-purple-600/15 border-purple-500/30 text-purple-600 dark:text-purple-300' },
    { section: 'Infrastructures', key: 'storage', label: 'Storage', icon: <HardDrive className="w-5 h-5 shrink-0" />, activeClass: 'bg-pink-600/15 border-pink-500/30 text-pink-600 dark:text-pink-300' },
    { section: 'Infrastructures', key: 'projects', label: 'Projects', icon: <Layers className="w-5 h-5 shrink-0" />, activeClass: 'bg-teal-600/15 border-teal-500/30 text-teal-600 dark:text-teal-300' },
    { section: 'Infrastructures', key: 'images', label: 'Images', icon: <Image className="w-5 h-5 shrink-0" />, activeClass: 'bg-violet-600/15 border-violet-500/30 text-violet-600 dark:text-violet-300' },
    { section: 'Infrastructures', key: 'networking', label: 'Networking', icon: <Network className="w-5 h-5 shrink-0" />, activeClass: 'bg-cyan-600/15 border-cyan-500/30 text-cyan-600 dark:text-cyan-300' },
    { section: 'Infrastructures', key: 'operations', label: 'Operations', icon: <Activity className="w-5 h-5 shrink-0" />, activeClass: 'bg-amber-600/15 border-amber-500/30 text-amber-600 dark:text-amber-300' },
    
    { section: 'System', key: 'server', label: 'Server', icon: <Monitor className="w-5 h-5 shrink-0" />, activeClass: 'bg-indigo-600/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-300' },
    { section: 'System', key: 'usage', label: 'Usage', icon: <BarChart3 className="w-5 h-5 shrink-0" />, activeClass: 'bg-orange-600/15 border-orange-500/30 text-orange-600 dark:text-orange-300' },
    { section: 'System', key: 'warnings', label: 'Warnings', icon: <Bell className="w-5 h-5 shrink-0" />, activeClass: 'bg-rose-600/15 border-rose-500/30 text-rose-600 dark:text-rose-300' },
    { section: 'System', key: 'configuration', label: 'Configuration', icon: <Settings className="w-5 h-5 shrink-0" />, activeClass: 'bg-slate-600/15 border-slate-500/30 text-slate-600 dark:text-slate-300' },
    
    { section: 'Account', key: 'profile', label: 'User Profile', icon: <User className="w-5 h-5 shrink-0" />, activeClass: 'bg-purple-600/15 border-purple-500/30 text-purple-600 dark:text-purple-300' },
    { section: 'Account', key: 'members', label: 'Members', icon: <Users className="w-5 h-5 shrink-0" />, activeClass: 'bg-indigo-600/15 border-indigo-500/30 text-indigo-600 dark:text-indigo-300' },
    { section: 'Account', key: 'transactions', label: 'Transactions', icon: <CreditCard className="w-5 h-5 shrink-0" />, activeClass: 'bg-blue-600/15 border-blue-500/30 text-blue-600 dark:text-blue-300' }
  ];

  // Logged In - Dashboard Layout
  return (
    <motion.div key="admin" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }} className="w-full min-h-screen absolute top-0 left-0">
    <div className="min-h-screen bg-app-bg text-app-text flex">
      {/* Sidebar navigation */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} border-r border-app-border bg-app-sidebar flex flex-col justify-between shrink-0 transition-all duration-300`}>
        <div className={isSidebarCollapsed ? 'p-4' : 'p-6'}>
          <button
            onClick={() => {
              window.location.hash = '#portal';
            }}
            title="Go to Gateway"
            className={`flex items-center gap-3 mb-8 ${isSidebarCollapsed ? 'justify-center font-bold' : ''} text-left border-transparent bg-transparent hover:opacity-85 transition cursor-pointer w-fit p-0`}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25 shrink-0">
              <Terminal className="w-5 h-5 text-white" />
            </div>
            {!isSidebarCollapsed && (
              <span className="font-extrabold text-xl tracking-wider text-app-text-h whitespace-nowrap">TblInc Cloud</span>
            )}
          </button>

          <nav className="space-y-1.5 text-left">
            {menuItems.map((item, index) => {
              const showHeader = index === 0 || menuItems[index - 1].section !== item.section;
              return (
                <React.Fragment key={item.key}>
                  {showHeader && (
                    !isSidebarCollapsed ? (
                      <div className={`text-[10px] font-bold text-gray-500 uppercase tracking-widest px-3 mb-2 ${index > 0 ? 'pt-6' : ''}`}>
                        {item.section}
                      </div>
                    ) : (
                      index > 0 && <div className="h-px bg-app-border-dim my-4 mx-2" />
                    )
                  )}
                  <button
                    onClick={() => setActiveTab(item.key as any)}
                    title={isSidebarCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-xl font-semibold transition-all cursor-pointer border ${
                      activeTab === item.key
                        ? `${item.activeClass}`
                        : 'text-gray-400 hover:text-app-text-h hover:bg-app-border-dim border-transparent'
                    }`}
                  >
                    {item.icon}
                    {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  </button>
                </React.Fragment>
              );
            })}
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-app-border bg-app-bg/5 space-y-3">
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
                onClick={() => setActiveTab('profile')}
                className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-300 font-bold flex items-center justify-center text-sm shrink-0 border border-purple-500/30 hover:bg-purple-500/30 transition-all cursor-pointer"
                title={user?.username || 'user'}
              >
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
              </button>
              <button
                onClick={logout}
                title="Logout"
                className="p-2 rounded-lg text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer animate-none"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 max-w-[80%]">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-300 font-bold flex items-center justify-center text-sm shrink-0 border border-purple-500/30 hover:bg-purple-500/30 transition-all cursor-pointer"
                  >
                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
                  </button>
                  <div className="truncate text-xs font-semibold text-app-text-h">
                    {user?.username || 'user'}
                  </div>
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="p-2 rounded-lg text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
              <div className="text-[9px] text-gray-500 text-center font-mono">
                Version 1.0.0 (Old Kingdom)
              </div>
            </>
          )}
        </div>
      </aside>

      {/* Main Panel */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden max-h-screen">
        {/* Top Navbar */}
        <header className="h-16 border-b border-app-border bg-app-header backdrop-blur-xl px-8 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            {/* Sidebar toggle button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-2 rounded-xl bg-app-bg hover:bg-app-border-dim border border-app-border text-gray-400 hover:text-app-text-h transition-all cursor-pointer mr-1"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <Menu className="w-4.5 h-4.5" />
            </button>

            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-app-bg border border-app-border shadow-inner text-purple-600 dark:text-purple-300">
                {tabConfig[activeTab].icon}
              </span>
              <span className="text-gray-500 text-xs font-semibold">/</span>
              <span className="text-app-text-h font-extrabold text-sm tracking-wider uppercase">{tabConfig[activeTab].label}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Cluster Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/25 text-xs font-bold text-emerald-600 dark:text-emerald-400 tracking-wide">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
              Cluster Active
            </div>

            {/* Warnings Link with Indicator */}
            <button
              onClick={() => setActiveTab('warnings')}
              className="relative p-2.5 rounded-xl bg-app-bg hover:bg-app-border-dim border border-app-border text-gray-400 hover:text-app-text-h transition-all cursor-pointer"
              title="System Alerts"
            >
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center border border-app-sidebar shadow-lg shadow-rose-500/20 animate-bounce">
                3
              </span>
            </button>



            {/* Theme Toggle Button */}
            <button
              onClick={cycleTheme}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-app-bg hover:bg-app-border-dim border border-app-border text-app-text transition-all cursor-pointer text-xs font-bold"
              title={`Theme: ${themeConfig[theme].label} → click for ${themeConfig[theme].next}`}
            >
              {themeConfig[theme].icon}
              <span className="hidden sm:inline text-app-text-h">{themeConfig[theme].label}</span>
            </button>

            {/* Quick Settings */}
            <button
              onClick={() => setActiveTab('configuration')}
              className="p-2.5 rounded-xl bg-app-bg hover:bg-app-border-dim border border-app-border text-gray-400 hover:text-app-text-h transition-all cursor-pointer"
              title="System Configuration"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>

            {/* Vertical Divider */}
            <span className="h-6 w-px bg-app-border" />

            {/* Quick Profile Info */}
            <button
              onClick={() => setActiveTab('profile')}
              className="flex items-center gap-3 p-1.5 px-3 rounded-xl hover:bg-app-border-dim border border-transparent hover:border-app-border transition-all cursor-pointer text-left"
            >
              <div className="w-8 h-8 rounded-xl bg-purple-500/25 text-purple-600 dark:text-purple-300 font-extrabold flex items-center justify-center text-sm shrink-0 border border-purple-500/30 shadow-lg shadow-purple-500/10">
                {user?.username ? user.username.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-app-text-h tracking-wide">{user?.username || 'user'}</div>
                <div className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Admin</div>
              </div>
            </button>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 p-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
    </motion.div>
  );
  };

  return (
    <AnimatePresence mode="wait">
      {renderPortal()}
    </AnimatePresence>
  );
}