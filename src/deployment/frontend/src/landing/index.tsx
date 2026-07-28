import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingBag, 
  ArrowRight, 
  Activity, 
  Layers, 
  Network, 
  HardDrive, 
  Bell, 
  Server, 
  Terminal,
  Cpu,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from 'lucide-react';
import Navbar from './navbar';
import SideNav from './sidenav';
import Contain from './contain';
import Fotter from './fotter';

interface LandingPageProps {
  theme: 'light' | 'dark' | 'blue';
  cycleTheme: () => void;
  themeConfig: any;
}

export default function LandingPage({ theme, cycleTheme, themeConfig }: LandingPageProps) {
  const [sliderCpu, setSliderCpu] = useState<number>(2);
  const [sliderRam, setSliderRam] = useState<number>(4);
  const [sliderStorage, setSliderStorage] = useState<number>(40);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const handlePortalEnter = (hashPath: string) => {
    window.location.hash = hashPath;
  };

  const calculateTier = () => {
    if (sliderCpu <= 2 && sliderRam <= 4 && sliderStorage <= 40) {
      return { name: 'Free Sandbox', cost: '$0', desc: 'Best for experimenting with lightweight Linux nodes.', badge: 'Hobbyist' };
    }
    if (sliderCpu <= 4 && sliderRam <= 16 && sliderStorage <= 150) {
      return { name: 'Developer Workspace', cost: '$15', desc: 'Ideal for standard testing APIs, databases, and persistent sites.', badge: 'Popular' };
    }
    if (sliderCpu <= 8 && sliderRam <= 32 && sliderStorage <= 500) {
      return { name: 'Pro Compute Node', cost: '$49', desc: 'Heavy workloads requiring dedicated vCPUs shares and high memory caches.', badge: 'Production' };
    }
    return { name: 'Advanced Enterprise Cluster', cost: 'Custom Quote', desc: 'Clustered OVN networks with multi-node redundancy failovers.', badge: 'Enterprise' };
  };

  const currentTier = calculateTier();

  const faqs = [
    {
      q: "How fast do sandbox instances boot up?",
      a: "Sandbox containers spin up in under 3 seconds! Using pre-seeded base OS images (Ubuntu, Debian, Alpine) and lightweight LXD-derived hypervisor mechanics, instances launch instantly without any VM boot overhead."
    },
    {
      q: "Can I map custom domains or configure subdomains?",
      a: "Yes! The Member Portal features a DNS Domain Manager where you can add domain sub-routes, automatically matching ingress policies with your virtual containers."
    },
    {
      q: "Are the container storage volumes persistent?",
      a: "Absolutely. All root disk mounts are loaded on clustered Ceph or persistent local storage pools. Your configs, files, and databases remain saved during container reboots or host allocations."
    },
    {
      q: "How does TblInc ensure isolated network safety?",
      a: "We utilize Software-Defined OVN (Open Virtual Network) to provision dedicated virtual routing tables, private subnets, and isolated namespaces for each user sandbox. Your instances remain protected by private firewalls."
    }
  ];

  return (
    <div className="min-h-screen bg-app-bg text-app-text flex flex-col relative overflow-hidden w-full font-sans">
      {/* Background gradient rings */}
      <div className="absolute top-[-30%] left-[-20%] w-[70%] h-[70%] rounded-full bg-purple-500/5 dark:bg-purple-950/15 blur-[180px] pointer-events-none z-0" />
      <div className="absolute bottom-[-30%] right-[-20%] w-[70%] h-[70%] rounded-full bg-teal-500/5 dark:bg-teal-950/10 blur-[180px] pointer-events-none z-0" />

      {/* Navbar */}
      <Navbar theme={theme} cycleTheme={cycleTheme} themeConfig={themeConfig} />

      {/* Body: SideNav + Main Content */}
      <div className="flex flex-1">
        <SideNav onNavigate={handlePortalEnter} />

        <Contain>
          {/* Hero Banner Section */}
          <div className="relative flex flex-col items-center space-y-8 w-full">
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-10 left-10 md:left-20 w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-2xl blur-xl opacity-30"
            />
            <motion.div
              animate={{ y: [0, 20, 0], rotate: [0, -10, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-10 right-10 md:right-20 w-24 h-24 bg-gradient-to-br from-teal-500 to-emerald-500 rounded-full blur-xl opacity-30"
            />

            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              onClick={() => handlePortalEnter('#portal')}
              className="group relative flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-app-card/80 border border-purple-500/30 hover:bg-purple-500/10 text-xs font-extrabold text-app-text-h tracking-wide cursor-pointer transition-all active:scale-95 shadow-lg shadow-purple-500/10 hover:shadow-purple-500/25 hover:border-purple-500/50 backdrop-blur-md overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <ShoppingBag className="w-4 h-4 text-purple-400 relative z-10" />
              <span className="relative z-10 flex items-center gap-2">
                <span className="bg-purple-500 text-white px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider">New</span>
                Explore preset templates in the App Marketplace
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </span>
            </motion.div>

            <div className="space-y-6 max-w-4xl text-center relative z-10">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-app-text-h m-0 leading-[1.1]"
              >
                Next-Gen <br className="hidden sm:block" />
                <span className="relative inline-block mt-2">
                  <span className="absolute -inset-2 bg-gradient-to-r from-purple-500 via-pink-500 to-teal-500 blur-2xl opacity-20 rounded-full"></span>
                  <span className="relative bg-gradient-to-r from-purple-400 via-pink-400 to-teal-400 bg-clip-text text-transparent">Sandbox Cloud</span>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-gray-500 dark:text-gray-400 text-base sm:text-lg lg:text-xl leading-relaxed max-w-2xl mx-auto font-medium"
              >
                Deploy sandboxes, launch custom containers, and manage virtual machines in a secure, isolated container ecosystem powered by industry-leading <span className="text-purple-400 font-bold">Incus technology</span>.
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center gap-4 pt-8 relative z-10 w-full sm:w-auto"
            >
              <button
                onClick={() => handlePortalEnter('#portal')}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-app-card/50 hover:bg-app-border-dim border border-app-border text-app-text-h font-extrabold text-sm transition-all cursor-pointer backdrop-blur-sm flex items-center justify-center gap-3 active:scale-95 hover:border-gray-500/30"
              >
                <Layers className="w-4 h-4 text-teal-400" />
                Browse Marketplace
              </button>
            </motion.div>
          </div>

          {/* How It Works Section */}
          <div className="space-y-12 w-full text-left">
            <div className="text-center">
              <h3 className="font-extrabold text-app-text-h text-2xl tracking-tight">Onboarding In 3 Steps</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Deploying sandbox containers is smooth and fully automated.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { step: '01', title: 'Pick Preset Stack Template', desc: 'Choose a boilerplate like WordPress stack, Python Django, NodeJS API, or Postgres Database from the built-in marketplace.', icon: <ShoppingBag className="w-5 h-5 text-teal-400" /> },
                { step: '02', title: 'Adjust Hardware Boundaries', desc: 'Allocate vCPU cores, memory capacity, and persistent disk allocations directly per sandbox container instance.', icon: <Cpu className="w-5 h-5 text-purple-400" /> },
                { step: '03', title: 'Spin Up & Access Web Shell', desc: 'Connect securely using direct Web Terminal Console integrations under 3 seconds with OVN ingress mappings.', icon: <Terminal className="w-5 h-5 text-pink-400" /> }
              ].map((step, i) => (
                <div key={i} className="relative p-8 rounded-3xl border border-app-border bg-app-card/25 space-y-4 hover:border-app-border-dim transition">
                  <div className="absolute top-4 right-6 text-3xl font-black text-gray-500/10 font-mono">{step.step}</div>
                  <div className="w-10 h-10 rounded-xl bg-app-border-dim flex items-center justify-center">{step.icon}</div>
                  <h4 className="font-extrabold text-app-text-h text-sm">{step.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resource Estimator */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full text-left">
            <div className="p-8 rounded-3xl border border-app-border bg-app-card/35 md:col-span-2 space-y-6">
              <div>
                <h3 className="font-bold text-app-text-h text-lg">Interactive Resource Estimator</h3>
                <p className="text-gray-400 text-xs mt-0.5">Toggle hardware boundaries to evaluate computing allocations.</p>
              </div>
              {[
                { label: 'CPU Cores', value: sliderCpu, unit: 'vCPUs', min: 1, max: 16, color: 'accent-purple-500', colorText: 'text-purple-400', set: setSliderCpu },
                { label: 'Memory RAM', value: sliderRam, unit: 'GB RAM', min: 1, max: 64, color: 'accent-teal-500', colorText: 'text-teal-400', set: setSliderRam },
                { label: 'Ceph Disk Storage', value: sliderStorage, unit: 'GB HDD', min: 10, max: 1000, color: 'accent-pink-500', colorText: 'text-pink-400', set: setSliderStorage, step: 10 },
              ].map((s) => (
                <div key={s.label} className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-500 uppercase tracking-wide">{s.label}</span>
                    <span className={`font-bold font-mono ${s.colorText}`}>{s.value} {s.unit}</span>
                  </div>
                  <input
                    type="range" min={s.min} max={s.max} step={s.step ?? 1} value={s.value}
                    onChange={(e) => s.set(parseInt(e.target.value))}
                    className={`w-full h-1.5 rounded-lg bg-app-border-dim appearance-none cursor-pointer ${s.color}`}
                  />
                </div>
              ))}
            </div>
            <div className="p-8 rounded-3xl border border-app-border bg-gradient-to-b from-purple-500/10 to-pink-500/5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 right-4 px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/35 text-[9px] font-black uppercase text-purple-400 tracking-wider">{currentTier.badge}</div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 tracking-wider uppercase">
                  <TrendingUp className="w-4 h-4 text-purple-400" /> Recommended Tier
                </div>
                <div>
                  <h4 className="text-xl font-black text-app-text-h">{currentTier.name}</h4>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed">{currentTier.desc}</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-app-border/40">
                <div className="text-3xl font-black text-app-text-h font-mono">{currentTier.cost}<span className="text-xs font-normal text-gray-500"> / month</span></div>
                <button
                  onClick={() => handlePortalEnter('#portal')}
                  className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-xs tracking-wider transition cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  Launch Sandbox Environment
                </button>
              </div>
            </div>
          </div>

          {/* Cluster Status Dashboard */}
          <div className="p-6 rounded-3xl border border-app-border bg-app-card/30 w-full text-left space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-app-text-h text-lg">Cluster Status Dashboard</h3>
                <p className="text-gray-400 text-xs mt-0.5">Real-time status parameters of physical cluster pools.</p>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/25 text-[10px] font-bold text-emerald-400 tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Hypervisor: Active
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
                  <div className="w-8 h-8 rounded-lg bg-app-border-dim flex items-center justify-center">{metric.icon}</div>
                  <div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">{metric.label}</div>
                    <div className="text-sm font-bold text-app-text-h mt-0.5">{metric.value}</div>
                    <div className="text-[10px] text-gray-400 mt-0.5">{metric.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ecosystem Features */}
          <div className="space-y-6 w-full text-left">
            <div className="text-center md:text-left">
              <h3 className="font-extrabold text-app-text-h text-2xl tracking-tight">Ecosystem Architecture</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Engineered for bare-metal speed and absolute security isolation.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {[
                { title: 'Bare-Metal Hypervisors', desc: 'LXD-derived container virtualization delivering native bare-metal execution speeds without traditional VM hypervisor overhead.', icon: <Server className="w-5 h-5 text-purple-400" /> },
                { title: 'Software-Defined OVN', desc: 'Private isolated subnets dynamically provisioned inside isolated namespaces to guarantee packet filtering integrity.', icon: <Network className="w-5 h-5 text-teal-400" /> },
                { title: 'Ceph Storage Pool', desc: 'Persistent, clustered block volumes automatically scaling storage limits for containers, folders, or base images.', icon: <HardDrive className="w-5 h-5 text-pink-400" /> },
                { title: 'Resource Throttling', desc: 'Dynamic control limits configuring custom vCPU shares, memory bounds, and bandwidth pools per container namespace.', icon: <Layers className="w-5 h-5 text-indigo-400" /> },
                { title: 'Alert Monitoring', desc: 'Global monitoring tools compiling threshold warnings, CPU spikes, and warning logs to keep clusters running smoothly.', icon: <Bell className="w-5 h-5 text-rose-400" /> },
                { title: 'Template Catalog', desc: 'Ready-to-launch presets for Django, NodeJS, WordPress, Laravel, or databases to spin up sandboxes in 3 seconds.', icon: <ShoppingBag className="w-5 h-5 text-violet-400" /> }
              ].map((feat, i) => (
                <div key={i} className="p-6 rounded-2xl border border-app-border bg-app-card/20 space-y-3 hover:bg-app-card/35 transition duration-300">
                  <div className="w-9 h-9 rounded-xl bg-app-border-dim flex items-center justify-center">{feat.icon}</div>
                  <h4 className="font-extrabold text-app-text-h text-sm">{feat.title}</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <div className="space-y-8 w-full max-w-3xl mx-auto text-left">
            <div className="text-center">
              <h3 className="font-extrabold text-app-text-h text-2xl tracking-tight">Frequently Asked Questions</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Get quick answers regarding container boundaries and network mappings.</p>
            </div>
            <div className="space-y-4">
              {faqs.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className="rounded-2xl border border-app-border bg-app-card/20 overflow-hidden transition">
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="w-full flex items-center justify-between p-5 text-left font-bold text-app-text-h text-sm hover:bg-app-card/30 transition cursor-pointer select-none"
                    >
                      <span>{faq.q}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-purple-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="p-5 pt-0 text-xs text-gray-500 dark:text-gray-400 leading-relaxed border-t border-app-border/40">
                            {faq.a}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </Contain>
      </div>

      {/* Footer */}
      <Fotter />
    </div>
  );
}
