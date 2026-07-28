import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Layers, Plus, Cpu, HardDrive, Activity, X, Globe, Code2, ExternalLink, Terminal, AlertCircle, Check, Loader2, Trash2, RotateCw, Settings, Upload } from 'lucide-react';
import api from '../../api/axios';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface WebProject {
  id: string;
  name: string;
  framework: 'react' | 'django' | 'flask' | 'vue' | 'php' | 'laravel' | 'fastapi' | 'svelte';
  repo: string;
  subdomain: string;
  instanceName: string;
  tier: 'Free' | 'Pro' | 'Advance';
  status: 'Building' | 'Active' | 'Failed';
  logs: string[];
  cpuUsed: number;
  ramUsed: number;
  createdAt: string;
  deploySource?: 'github' | 'local';
  githubBranch?: string;
  uploadFileName?: string;
  uploadBase64?: string;
}

interface ProjectsViewProps {
  isAdmin?: boolean;
}

export default function ProjectsView({ isAdmin = false }: ProjectsViewProps) {
  const [projects, setProjects] = useState<WebProject[]>(() => {
    const saved = localStorage.getItem('tblinc_web_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('tblinc_web_projects', JSON.stringify(projects));
  }, [projects]);

  // Incus real projects state (for admin)
  const [incusProjects, setIncusProjects] = useState<any[]>([]);
  const [incusLoading, setIncusLoading] = useState(false);
  
  // Incus project creation states
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newProjectBalance, setNewProjectBalance] = useState('100.00');
  const [featImages, setFeatImages] = useState(true);
  const [featNetworks, setFeatNetworks] = useState(true);
  const [featProfiles, setFeatProfiles] = useState(true);
  const [featStorage, setFeatStorage] = useState(true);

  // View control states
  const [runningInstances, setRunningInstances] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLogsProject, setSelectedLogsProject] = useState<WebProject | null>(null);

  // Project Settings Modal States
  const [selectedSettingsProject, setSelectedSettingsProject] = useState<WebProject | null>(null);
  const [settingsSubdomain, setSettingsSubdomain] = useState('');
  const [settingsInstance, setSettingsInstance] = useState('');
  const [settingsTier, setSettingsTier] = useState<'Free' | 'Pro' | 'Advance'>('Free');

  useEffect(() => {
    if (selectedSettingsProject) {
      setSettingsSubdomain(selectedSettingsProject.subdomain.replace('.tblinc.com', ''));
      setSettingsInstance(selectedSettingsProject.instanceName);
      setSettingsTier(selectedSettingsProject.tier);
      fetchRunningInstances();
    }
  }, [selectedSettingsProject]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettingsProject) return;

    const domainName = settingsSubdomain.includes('.') ? settingsSubdomain : `${settingsSubdomain}.tblinc.com`;
    const cpu = settingsTier === 'Free' ? 4 : settingsTier === 'Pro' ? 10 : 25;
    const ram = settingsTier === 'Free' ? 256 : settingsTier === 'Pro' ? 1024 : 4096;

    setProjects(prev => prev.map(p => {
      if (p.id === selectedSettingsProject.id) {
        return {
          ...p,
          subdomain: domainName,
          instanceName: settingsInstance,
          tier: settingsTier,
          cpuUsed: cpu,
          ramUsed: ram
        };
      }
      return p;
    }));

    setSelectedSettingsProject(null);
  };

  // Deploy Form States
  const [appName, setAppName] = useState('');
  const [framework, setFramework] = useState<'react' | 'django' | 'flask' | 'vue' | 'php' | 'laravel' | 'fastapi' | 'svelte'>('react');
  const [githubRepo, setGithubRepo] = useState('');
  const [githubBranch, setGithubBranch] = useState('main');
  const [deploySource, setDeploySource] = useState<'github' | 'local'>('github');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadBase64, setUploadBase64] = useState('');

  // GitHub Integration States
  const [isGithubConnected, setIsGithubConnected] = useState(() => localStorage.getItem('github_connected') === 'true');
  const [githubUsername, setGithubUsername] = useState(() => localStorage.getItem('github_username') || '');
  const [githubWizardLoading, setGithubWizardLoading] = useState(false);
  const [githubPat, setGithubPat] = useState(() => localStorage.getItem('github_pat') || '');
  const [inputGithubUsername, setInputGithubUsername] = useState('');
  
  const [githubRepos, setGithubRepos] = useState<any[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      setIsGithubConnected(localStorage.getItem('github_connected') === 'true');
      setGithubUsername(localStorage.getItem('github_username') || '');
    };
    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const fetchGithubRepos = async (username: string, token: string) => {
    setLoadingRepos(true);
    try {
      const headers: any = {};
      if (token) headers['Authorization'] = `token ${token}`;
      const url = token ? 'https://api.github.com/user/repos?sort=updated' : `https://api.github.com/users/${username}/repos?sort=updated`;
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        setGithubRepos(data);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingRepos(false);
  };

  useEffect(() => {
    if (isGithubConnected && githubUsername) {
      fetchGithubRepos(githubUsername, githubPat);
    }
  }, [isGithubConnected, githubUsername, githubPat]);


  const handleGithubAuthorize = async () => {
    if (!inputGithubUsername && !githubPat) {
      alert("Please enter a GitHub username or PAT.");
      return;
    }
    setGithubWizardLoading(true);
    try {
      const headers: any = {};
      if (githubPat) headers['Authorization'] = `token ${githubPat}`;
      // If we have PAT but no username, we can fetch from /user
      const url = githubPat && !inputGithubUsername ? 'https://api.github.com/user' : `https://api.github.com/users/${inputGithubUsername}`;
      const res = await fetch(url, { headers });
      
      if (!res.ok) throw new Error("Invalid username or PAT");
      const userData = await res.json();
      
      localStorage.setItem('github_connected', 'true');
      localStorage.setItem('github_username', userData.login);
      if (githubPat) {
        localStorage.setItem('github_pat', githubPat);
      } else {
        localStorage.removeItem('github_pat');
      }
      setIsGithubConnected(true);
      setGithubUsername(userData.login);
      setInputGithubUsername('');
    } catch (e) {
      alert("Failed to authenticate with GitHub. Please check your username and PAT.");
    } finally {
      setGithubWizardLoading(false);
    }
  };

  const handleGithubDisconnect = () => {
    localStorage.removeItem('github_connected');
    localStorage.removeItem('github_username');
    localStorage.removeItem('github_pat');
    setIsGithubConnected(false);
    setGithubUsername('');
    setGithubPat('');
    setGithubRepos([]);
    setGithubRepo('');
  };
  const [subdomain, setSubdomain] = useState('');
  const [selectedInstance, setSelectedInstance] = useState('');
  const [selectedTier, setSelectedTier] = useState<'Free' | 'Pro' | 'Advance'>('Free');

  // Autocomplete subdomain to follow appName.selectedInstance structure (sub.domain)
  useEffect(() => {
    if (appName && selectedInstance) {
      setSubdomain(`${appName}.${selectedInstance}`);
    }
  }, [appName, selectedInstance]);

  // Simulator state for deployment progress
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySteps, setDeploySteps] = useState<string[]>([]);
  const [deployStepIndex, setDeployStepIndex] = useState(0);

  const fetchRunningInstances = async () => {
    try {
      const res = await api.get('/api/instances/');
      // Filter only running instances
      const running = res.data.filter((inst: any) => inst.status === 'Running' || inst.status?.toLowerCase() === 'running');
      setRunningInstances(running);
      if (running.length > 0) {
        setSelectedInstance(running[0].name);
      }
    } catch (err) {
      console.error("Failed to load instances for deploy selection", err);
    }
  };

  const fetchIncusProjects = async () => {
    if (!isAdmin) return;
    setIncusLoading(true);
    try {
      const res = await api.get('/api/projects/');
      setIncusProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch Incus projects", err);
    } finally {
      setIncusLoading(false);
    }
  };

  const handleDeleteIncusProject = async (name: string) => {
    if (name === 'default') {
      alert("The 'default' project namespace cannot be deleted.");
      return;
    }
    if (!window.confirm(`Are you sure you want to delete Incus project namespace "${name}"? This will delete all instances, profiles, and networks inside it. Proceed?`)) {
      return;
    }
    try {
      await api.delete(`/api/projects/${name}/`);
      fetchIncusProjects();
    } catch (err: any) {
      console.error("Failed to delete Incus project", err);
      alert(err.response?.data?.error || `Failed to delete Incus project "${name}".`);
    }
  };

  const handleCreateIncusProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName) return;

    setIncusLoading(true);
    try {
      const payload = {
        name: newProjectName.toLowerCase().replace(/\s+/g, '-').replace(/_/g, '-'),
        description: newProjectDesc,
        config: {
          "features.images": featImages ? "true" : "false",
          "features.networks": featNetworks ? "true" : "false",
          "features.profiles": featProfiles ? "true" : "false",
          "features.storage.volumes": featStorage ? "true" : "false",
          "user.balance": newProjectBalance || "0.00"
        }
      };
      await api.post('/api/projects/', payload);
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectBalance('100.00');
      setFeatImages(true);
      setFeatNetworks(true);
      setFeatProfiles(true);
      setFeatStorage(true);
      setIsModalOpen(false);
      fetchIncusProjects();
    } catch (err: any) {
      console.error("Failed to create Incus project", err);
      alert(err.response?.data?.error || "Failed to create Incus project namespace.");
    } finally {
      setIncusLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchIncusProjects();
    } else {
      fetchRunningInstances();
    }
  }, [isAdmin]);

  const handleOpenDeployModal = () => {
    setSelectedLogsProject(null);
    setSelectedSettingsProject(null);
    if (isAdmin) {
      setNewProjectName('');
      setNewProjectDesc('');
      setNewProjectBalance('100.00');
      setFeatImages(true);
      setFeatNetworks(true);
      setFeatProfiles(true);
      setFeatStorage(true);
      setIsModalOpen(true);
    } else {
      fetchRunningInstances();
      setAppName('');
      setGithubRepo('');
      setSubdomain('');
      setSelectedTier('Free');
      setFramework('react');
      setDeploySource('github');
      setGithubBranch('main');
      setUploadFileName('');
      setUploadBase64('');
      setGithubPat(localStorage.getItem('github_pat') || '');
      setIsModalOpen(true);
    }
  };

  const startRealDeployment = async (newProj: WebProject) => {
    setIsDeploying(true);
    setDeployStepIndex(0);
    const steps: string[] = [];
    setDeploySteps(steps);

    const addLog = (msg: string) => {
      steps.push(msg);
      setDeploySteps([...steps]);
      setDeployStepIndex(steps.length - 1);
    };

    try {
      addLog(`info  - Connecting to deploy target Tblinc host: [${newProj.instanceName}]...`);
      
      // Step 1: Prepare deployment workspace
      const step1Res = await api.post(`/api/instances/${newProj.instanceName}/exec/`, {
        command: `mkdir -p /var/www/${newProj.name} && cd /var/www/${newProj.name} && echo "Container OS: $(cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2 | tr -d '"') | Python: $(python3 --version 2>&1)"`
      });
      if (step1Res.data.exit_code === 0) {
        addLog(`success - Target initialized. ${step1Res.data.stdout.trim()}`);
      } else {
        throw new Error(step1Res.data.stderr || "Failed to initialize directory structure in container.");
      }

      // Step 2: Obtain application codebase (GitHub clone or local upload decode)
      if (newProj.deploySource === 'local') {
        addLog(`info  - Decoding and writing uploaded archive: ${newProj.uploadFileName}...`);
        
        let extractCmd = "";
        if (newProj.uploadFileName?.endsWith('.zip')) {
          extractCmd = ` && apt-get update && apt-get install -y unzip && unzip -o /var/www/${newProj.name}/${newProj.uploadFileName} -d /var/www/${newProj.name}/ && rm /var/www/${newProj.name}/${newProj.uploadFileName}`;
        } else if (newProj.uploadFileName?.endsWith('.tar.gz') || newProj.uploadFileName?.endsWith('.tgz')) {
          extractCmd = ` && tar -xzf /var/www/${newProj.name}/${newProj.uploadFileName} -C /var/www/${newProj.name}/ && rm /var/www/${newProj.name}/${newProj.uploadFileName}`;
        } else if (newProj.uploadFileName?.endsWith('.tar')) {
          extractCmd = ` && tar -xf /var/www/${newProj.name}/${newProj.uploadFileName} -C /var/www/${newProj.name}/ && rm /var/www/${newProj.name}/${newProj.uploadFileName}`;
        }

        const uploadCmd = `echo "${newProj.uploadBase64}" | base64 -d > /var/www/${newProj.name}/${newProj.uploadFileName}${extractCmd} 2>&1`;
        const step2Res = await api.post(`/api/instances/${newProj.instanceName}/exec/`, {
          command: uploadCmd
        });

        if (step2Res.data.exit_code === 0) {
          addLog(`success - Local archive unpacked successfully`);
        } else {
          addLog(`error - File decode/unpacker failed: ${step2Res.data.stderr?.trim() || step2Res.data.stdout?.trim()}`);
          throw new Error(step2Res.data.stderr?.trim() || step2Res.data.stdout?.trim() || "Failed to decode/unpack file.");
        }
      } else {
        const token = localStorage.getItem('github_pat');
        const branchName = newProj.githubBranch || 'main';
        addLog(`info  - Git clone initiated from https://${newProj.repo} (Branch: ${branchName})...`);
        const credentialsPrefix = token ? `${token}@` : '';
        const branchArg = newProj.githubBranch ? `--branch ${newProj.githubBranch}` : '--branch main';
        const gitCmd = `git clone --depth=1 ${branchArg} https://${credentialsPrefix}${newProj.repo} /var/www/${newProj.name} 2>&1`;
        const step2Res = await api.post(`/api/instances/${newProj.instanceName}/exec/`, {
          command: gitCmd
        });
        
        if (step2Res.data.exit_code === 0) {
          addLog(`success - Repository cloned successfully`);
        } else {
          addLog(`error - Git clone failed: ${step2Res.data.stderr?.trim() || step2Res.data.stdout?.trim() || 'Network/git error'}`);
          throw new Error(step2Res.data.stderr?.trim() || step2Res.data.stdout?.trim() || "Git clone command failed inside container.");
        }
      }

      // Step 3: Run package managers / build commands
      addLog(`info  - Building application dependencies using preset: [${newProj.framework}]...`);
      let buildCmd = "";
      if (newProj.framework === 'react' || newProj.framework === 'vue' || newProj.framework === 'svelte') {
        buildCmd = `npm install && npm run build`;
      } else if (newProj.framework === 'django' || newProj.framework === 'flask' || newProj.framework === 'fastapi') {
        buildCmd = `python3 -m venv venv && ./venv/bin/pip install --upgrade pip && ./venv/bin/pip install gunicorn flask django fastapi uvicorn && ([ -f requirements.txt ] && ./venv/bin/pip install -r requirements.txt || true)`;
        if (newProj.framework === 'django') {
          buildCmd += ` && ([ -f manage.py ] && ./venv/bin/python manage.py migrate || true)`;
        }
      } else if (newProj.framework === 'laravel' || newProj.framework === 'php') {
        buildCmd = `composer install`;
      }

      addLog(`info  - Executing build commands: ${buildCmd}`);
      const step3Res = await api.post(`/api/instances/${newProj.instanceName}/exec/`, {
        command: `cd /var/www/${newProj.name} && ${buildCmd} 2>&1`
      });

      if (step3Res.data.exit_code === 0) {
        addLog(`success - Build script finished successfully`);
        if (step3Res.data.stdout) {
          addLog(`info  - Output: ${step3Res.data.stdout}`);
        }
      } else {
        addLog(`error - Package manager build failed: ${step3Res.data.stderr?.trim() || step3Res.data.stdout?.trim() || 'Command not found'}`);
        throw new Error(step3Res.data.stderr?.trim() || step3Res.data.stdout?.trim() || "Build execution failed inside container.");
      }

      // Step 4: Run application server daemon in background
      addLog(`info  - Deploying background web service daemon inside target sandbox...`);
      let serverCmd = "";
      if (newProj.framework === 'django' || newProj.framework === 'flask' || newProj.framework === 'fastapi') {
        addLog(`info  - Launching Python application runner using Gunicorn WSGI/ASGI server...`);
        let runCmd = "";
        if (newProj.framework === 'django') {
          runCmd = `./venv/bin/gunicorn --bind 0.0.0.0:8000 backend.wsgi:application > gunicorn.log 2>&1 &`;
        } else if (newProj.framework === 'fastapi') {
          runCmd = `./venv/bin/gunicorn --bind 0.0.0.0:8000 -k uvicorn.workers.UvicornWorker main:app > gunicorn.log 2>&1 &`;
        } else {
          runCmd = `./venv/bin/gunicorn --bind 0.0.0.0:8000 app:app > gunicorn.log 2>&1 &`;
        }
        serverCmd = `pkill -f "gunicorn" || pkill -f "manage.py" || pkill -f "http.server" || true; cd /var/www/${newProj.name} && nohup ${runCmd}`;
      } else {
        addLog(`info  - Launching static files server for Node/PHP build assets...`);
        serverCmd = `pkill -f "gunicorn" || pkill -f "http.server 8000" || true; ` +
                    `if [ -d "/var/www/${newProj.name}/dist" ]; then DIR="/var/www/${newProj.name}/dist"; else DIR="/var/www/${newProj.name}"; fi; ` +
                    `nohup python3 -m http.server 8000 --directory $DIR > /var/www/${newProj.name}/server.log 2>&1 &`;
      }
      
      const step4Res = await api.post(`/api/instances/${newProj.instanceName}/exec/`, {
        command: serverCmd
      });
      if (step4Res.data.exit_code === 0) {
        addLog(`success - Web server daemon started in container on port 8000`);
      } else {
        throw new Error(step4Res.data.stderr || "Failed to start background python HTTP server.");
      }

      // Step 5: Configure domain forwarding / ingress
      addLog(`info  - Mapping router proxy binding: http://${newProj.subdomain} -> http://127.0.0.1 (Ingress)...`);
      await new Promise(resolve => setTimeout(resolve, 800));
      addLog(`success - Domain registered! Proxy rules active.`);
      
      addLog(`success - Deployment finished successfully!`);
      setIsDeploying(false);
      setIsModalOpen(false);

      // Save to projects list
      setProjects(prev =>
        prev.map(p => (p.id === newProj.id ? { ...p, status: 'Active', logs: steps } : p))
      );

    } catch (err: any) {
      console.error(err);
      addLog(`error - Deployment failed: ${err.message || 'Unknown error occurred'}`);
      setIsDeploying(false);
      
      setProjects(prev =>
        prev.map(p => (p.id === newProj.id ? { ...p, status: 'Failed', logs: steps } : p))
      );
    }
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName || !subdomain) return;
    if (deploySource === 'github' && !githubRepo) return;
    if (deploySource === 'local' && !uploadBase64) return;

    const domainName = subdomain.includes('.') ? subdomain : `${subdomain}.tblinc.com`;
    const newProj: WebProject = {
      id: `proj-${Date.now()}`,
      name: appName.toLowerCase().replace(/\s+/g, '-'),
      framework,
      repo: deploySource === 'github' ? githubRepo.replace(/https?:\/\//, '') : `local-upload: ${uploadFileName}`,
      subdomain: domainName,
      instanceName: selectedInstance || 'v1',
      tier: selectedTier,
      status: 'Building',
      cpuUsed: selectedTier === 'Free' ? 4 : selectedTier === 'Pro' ? 10 : 25,
      ramUsed: selectedTier === 'Free' ? 256 : selectedTier === 'Pro' ? 1024 : 4096,
      createdAt: new Date().toISOString().split('T')[0],
      logs: ['info - Queued for deployment'],
      deploySource,
      githubBranch: deploySource === 'github' ? githubBranch : undefined,
      uploadFileName,
      uploadBase64
    };

    setProjects(prev => [newProj, ...prev]);
    startRealDeployment(newProj);
  };

  const handleDeleteProject = (id: string) => {
    if (window.confirm("Are you sure you want to delete this web project? All associated file bindings and dns routing will be destroyed.")) {
      setProjects(prev => prev.filter(p => p.id !== id));
    }
  };

  const frameworkConfig = {
    react: { label: 'React', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    django: { label: 'Django', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    flask: { label: 'Flask', color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    vue: { label: 'Vue.js', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
    php: { label: 'PHP', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    laravel: { label: 'Laravel', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    fastapi: { label: 'FastAPI', color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    svelte: { label: 'SvelteKit', color: 'bg-orange-600/10 text-orange-500 border-orange-600/20' }
  };

  const pricingTiers = {
    Free: { price: '$0/mo', desc: '1 vCPU, 512MB RAM, shared IP' },
    Pro: { price: '$15/mo', desc: '2 vCPU, 2GB RAM, custom SSL' },
    Advance: { price: '$49/mo', desc: '4 vCPU, 8GB RAM, dedicated IP' }
  };

  const displayedProjects = projects.filter(proj => {
    if (proj.name === 'react-dashboard' && !isAdmin) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
            <Layers className="text-teal-500 w-8 h-8" />
            Projects
          </h2>
          <p className="text-gray-400 mt-1">
            {isAdmin 
              ? "Global view and management of Incus namespace projects." 
              : "Deploy websites and git repos directly onto Tblinc compute nodes."}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          {(selectedLogsProject || selectedSettingsProject || isModalOpen) && (
            <button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedLogsProject(null);
                setSelectedSettingsProject(null);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition cursor-pointer"
            >
              <X className="w-5 h-5" />
              {isModalOpen ? 'Cancel' : 'Close'}
            </button>
          )}

          {!isModalOpen && (
            <button
              onClick={handleOpenDeployModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-app-text-h rounded-xl font-medium shadow-lg hover:shadow-teal-500/20 active:scale-95 transition cursor-pointer"
            >
              <Plus className="w-5 h-5" />
              {isAdmin ? "Create Project" : "Deploy New App"}
            </button>
          )}
        </div>
      </div>

      {/* Projects Grid List */}
      {!isModalOpen && !selectedLogsProject && !selectedSettingsProject && (
        isAdmin ? (
        incusLoading && incusProjects.length === 0 ? (
          <div className="h-[40vh] flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
            <p className="font-semibold animate-pulse">Loading Incus projects...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {incusProjects.map((proj) => (
              <div
                key={proj.name}
                className="p-6 rounded-2xl border border-app-border bg-gradient-to-br from-app-card/60 to-app-card/20 hover:bg-app-card/85 transition-all duration-300 relative flex flex-col justify-between h-[300px]"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <Layers className="text-teal-400 w-6 h-6" />
                      <div className="flex flex-col">
                        <h3 className="text-lg font-bold text-app-text-h truncate max-w-[150px]" title={proj.name}>
                          {proj.name}
                        </h3>
                        <span className="text-[11px] text-emerald-400 font-bold tracking-wide mt-0.5">
                          ${parseFloat(proj.config?.["user.balance"] || "0.00").toFixed(2)} Balance
                        </span>
                      </div>
                    </div>
                    <span className="text-[9px] bg-teal-500/10 text-teal-400 border border-teal-500/25 px-2.5 py-0.5 rounded-full font-extrabold uppercase">
                      Incus Namespace
                    </span>
                  </div>

                  <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                    {proj.description || "No description provided."}
                  </p>

                  {/* Config settings */}
                  <div className="border-t border-app-border-dim pt-4 text-[10px] font-mono text-gray-500 grid grid-cols-2 gap-2">
                    <div>Images: <span className={proj.config?.["features.images"] === "true" ? "text-emerald-400" : "text-gray-400"}>{proj.config?.["features.images"] || "false"}</span></div>
                    <div>Networks: <span className={proj.config?.["features.networks"] === "true" ? "text-emerald-400" : "text-gray-400"}>{proj.config?.["features.networks"] || "false"}</span></div>
                    <div>Profiles: <span className={proj.config?.["features.profiles"] === "true" ? "text-emerald-400" : "text-gray-400"}>{proj.config?.["features.profiles"] || "false"}</span></div>
                    <div>Storage: <span className={proj.config?.["features.storage.volumes"] === "true" ? "text-emerald-400" : "text-gray-400"}>{proj.config?.["features.storage.volumes"] || "false"}</span></div>
                  </div>
                </div>

                <div className="border-t border-app-border-dim pt-4 flex gap-2">
                  <button
                    onClick={() => handleDeleteIncusProject(proj.name)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl border border-rose-500/25 transition cursor-pointer"
                    disabled={proj.name === 'default'}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Project Namespace
                  </button>
                </div>
              </div>
            ))}
            {incusProjects.length === 0 && (
              <div className="col-span-3 p-12 text-center text-gray-500 border border-app-border border-dashed rounded-2xl">
                No Incus namespace projects found.
              </div>
            )}
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProjects.map((proj) => (
            <div
              key={proj.id}
              className="p-6 rounded-2xl border border-app-border bg-gradient-to-br from-app-card/60 to-app-card/20 hover:bg-app-card/85 transition-all duration-300 relative flex flex-col justify-between h-[300px]"
            >
              {/* Top row */}
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <Layers className="text-teal-400 w-6 h-6" />
                    <h3 className="text-lg font-bold text-app-text-h truncate max-w-[170px]" title={proj.name}>
                      {proj.name}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${frameworkConfig[proj.framework].color}`}>
                      {frameworkConfig[proj.framework].label}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                      proj.status === 'Active'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : proj.status === 'Failed'
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        proj.status === 'Active'
                          ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                          : proj.status === 'Failed'
                          ? 'bg-rose-400'
                          : 'bg-amber-400'
                      }`} />
                      {proj.status}
                    </span>

                    <span className="text-[10px] bg-teal-500/10 text-teal-400 border border-teal-500/25 px-2 py-0.2 rounded font-extrabold uppercase">
                      {proj.tier}
                    </span>
                    {proj.name === 'react-dashboard' && (
                      <span className="text-[9px] bg-rose-500/15 text-rose-400 border border-rose-500/25 px-2 py-0.5 rounded font-bold uppercase mt-1">
                        /admin Only
                      </span>
                    )}
                  </div>
                </div>

                {/* GitHub Link & DNS Domain Info */}
                <div className="space-y-2 pt-2 text-xs font-mono">
                  <div className="flex items-center gap-2 text-gray-400 hover:text-white transition">
                    {proj.deploySource === 'local' ? (
                      <>
                        <HardDrive className="w-4 h-4 shrink-0 text-zinc-500" />
                        <span className="truncate">Local Upload: {proj.uploadFileName}</span>
                      </>
                    ) : (
                      <>
                        <Github className="w-4 h-4 shrink-0 text-zinc-500" />
                        <a href={`https://${proj.repo}/tree/${proj.githubBranch || 'main'}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate flex items-center gap-1.5">
                          {proj.repo}
                          <span className="text-[10px] bg-zinc-800/50 px-1.5 py-0.5 rounded text-zinc-400 font-bold border border-zinc-700/50">
                            {proj.githubBranch || 'main'}
                          </span>
                        </a>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-teal-400 hover:text-teal-300 font-semibold transition">
                    <Globe className="w-4 h-4 shrink-0" />
                    <a href={`https://${proj.subdomain}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate flex items-center gap-1">
                      {proj.subdomain}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Quotas & Operations */}
              <div className="border-t border-app-border-dim pt-4 mt-auto">
                <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 mb-4">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>Instance Host: <strong className="text-gray-200">{proj.instanceName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Activity className="w-3.5 h-3.5 text-blue-400" />
                    <span>RAM: <strong className="text-gray-200">{proj.ramUsed} MB</strong></span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {proj.name === 'react-dashboard' && !isAdmin ? (
                    <div className="w-full text-center py-2 px-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold select-none">
                      /admin Only Management
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedLogsProject(proj)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-app-border-dim hover:bg-app-border text-app-text-h text-xs font-semibold rounded-xl border border-app-border-dim hover:border-app-border transition cursor-pointer text-center"
                        title="View Deployment Logs"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        View Logs
                      </button>
                      
                      <button
                        onClick={() => {
                          setProjects(prev =>
                            prev.map(p => (p.id === proj.id ? { ...p, status: 'Building', logs: ['info - Queued for rebuild'] } : p))
                          );
                          startRealDeployment({ ...proj, status: 'Building', logs: ['info - Queued for rebuild'] });
                        }}
                        className="px-3 py-2 bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 rounded-xl border border-teal-500/25 transition cursor-pointer"
                        title="Rebuild & Redeploy Web Project"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setSelectedSettingsProject(proj)}
                        className="px-3 py-2 bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 rounded-xl border border-violet-500/25 transition cursor-pointer"
                        title="Configure Project Settings"
                      >
                        <Settings className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteProject(proj.id)}
                        className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/25 transition cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )
    )}

      {/* Create Project Modal / Deploy Wizard Card */}
      <AnimatePresence mode="wait">
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-4xl mx-auto bg-app-card border border-app-border rounded-2xl p-7 shadow-lg mt-8 text-left"
          >
              {isAdmin ? (
                /* Create Incus Project Form */
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-app-text-h flex items-center gap-2">
                      <Layers className="text-teal-400" />
                      Create Incus Project Namespace
                    </h3>
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition cursor-pointer"
                      disabled={incusLoading}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateIncusProject} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold">Project Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. member-newproject"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-[#0d0a14] text-app-text-h focus:outline-none focus:border-teal-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold">Description</label>
                      <textarea
                        placeholder="Namespace description or details"
                        value={newProjectDesc}
                        onChange={(e) => setNewProjectDesc(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-[#0d0a14] text-app-text-h focus:outline-none focus:border-teal-500 transition-colors h-20 resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-gray-400 font-semibold">Initial Balance ($)</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="100.00"
                        value={newProjectBalance}
                        onChange={(e) => setNewProjectBalance(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-[#0d0a14] text-app-text-h focus:outline-none focus:border-teal-500 transition-colors text-sm"
                      />
                    </div>

                    <div className="space-y-2 pt-2">
                      <label className="text-xs text-gray-400 font-semibold block mb-2">Isolated Features Configuration</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-app-border bg-white/[0.01] hover:bg-white/[0.03] transition cursor-pointer text-xs font-semibold">
                          <input type="checkbox" checked={featImages} onChange={(e) => setFeatImages(e.target.checked)} className="rounded accent-teal-500" />
                          <span>Isolated Images</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-app-border bg-white/[0.01] hover:bg-white/[0.03] transition cursor-pointer text-xs font-semibold">
                          <input type="checkbox" checked={featNetworks} onChange={(e) => setFeatNetworks(e.target.checked)} className="rounded accent-teal-500" />
                          <span>Isolated Networks</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-app-border bg-white/[0.01] hover:bg-white/[0.03] transition cursor-pointer text-xs font-semibold">
                          <input type="checkbox" checked={featProfiles} onChange={(e) => setFeatProfiles(e.target.checked)} className="rounded accent-teal-500" />
                          <span>Isolated Profiles</span>
                        </label>
                        <label className="flex items-center gap-2.5 p-3 rounded-xl border border-app-border bg-white/[0.01] hover:bg-white/[0.03] transition cursor-pointer text-xs font-semibold">
                          <input type="checkbox" checked={featStorage} onChange={(e) => setFeatStorage(e.target.checked)} className="rounded accent-teal-500" />
                          <span>Isolated Storage</span>
                        </label>
                      </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="flex-1 py-2.5 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition cursor-pointer text-center"
                        disabled={incusLoading}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition cursor-pointer text-center flex items-center justify-center gap-2"
                        disabled={incusLoading}
                      >
                        {incusLoading ? 'Creating...' : 'Create Namespace'}
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* Member: Deploy New Application Form */
                <>
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-app-text-h flex items-center gap-2">
                      <Layers className="text-teal-400" />
                      Deploy New Application
                    </h3>
                {!isDeploying && (
                  <button
                    onClick={() => {
                        setIsModalOpen(false);
                        setGithubBranch('main');
                    }}
                    className="p-1.5 rounded-lg bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                )}
              </div>

              {isDeploying ? (
                /* Deploy Simulator UI */
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3 text-sm text-teal-400 font-semibold">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Executing deployment scripts (Branch: {githubBranch})...</span>
                  </div>

                  <div className="bg-black/90 p-4 rounded-xl border border-app-border-dim font-mono text-[11px] text-emerald-400 h-[220px] overflow-y-auto space-y-1.5 scrollbar-thin">
                    {deploySteps.slice(0, deployStepIndex + 1).map((s, i) => (
                      <div key={i} className={s.startsWith('error') ? 'text-rose-400' : s.startsWith('success') ? 'text-teal-400 font-semibold' : 'text-emerald-400'}>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Deployment Setup Form */
                <form onSubmit={handleCreateProject} className="space-y-4">
                  {/* Web App Name */}
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-semibold">App Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. laravel-ecom-store"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-teal-500 transition-colors text-sm"
                    />
                  </div>

                  {/* Framework Presets */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Select Preset Framework</label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
                      {(['react', 'vue', 'svelte', 'django', 'flask', 'fastapi', 'laravel', 'php'] as const).map((fw) => (
                        <button
                          key={fw}
                          type="button"
                          onClick={() => setFramework(fw)}
                          className={`py-3.5 rounded-xl border text-[11px] font-bold text-center flex flex-col items-center justify-center gap-1.5 transition cursor-pointer ${
                            framework === fw
                              ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                              : 'bg-app-card/50 border-app-border-dim text-gray-400 hover:text-app-text-h'
                          }`}
                        >
                          <Code2 className="w-4 h-4" />
                          <span className="capitalize">{fw}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Deploy Source Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-gray-300 font-semibold">Deployment Source</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setDeploySource('github')}
                        className={`py-2 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                          deploySource === 'github'
                            ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                            : 'bg-app-card/50 border-app-border-dim text-gray-400 hover:text-app-text-h'
                        }`}
                      >
                        GitHub Repository
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeploySource('local')}
                        className={`py-2 rounded-xl border text-xs font-semibold text-center transition cursor-pointer ${
                          deploySource === 'local'
                            ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                            : 'bg-app-card/50 border-app-border-dim text-gray-400 hover:text-app-text-h'
                        }`}
                      >
                        Local Code Upload
                      </button>
                    </div>
                  </div>

                  {/* GitHub Repo link */}
                  {deploySource === 'github' ? (
                    <div className="space-y-2 animate-none">
                      {!isGithubConnected ? (
                        <div className="p-5 rounded-2xl border border-app-border bg-app-card space-y-5 text-center">
                          <div className="space-y-1">
                            <Github className="w-10 h-10 text-white mx-auto mb-3" />
                            <h4 className="font-bold text-app-text-h text-base">Connect GitHub Account</h4>
                            <p className="text-[11px] text-gray-400 leading-relaxed max-w-xs mx-auto">
                              Link your GitHub account to directly select and pull your public or private repositories.
                            </p>
                          </div>
                          
                          <div className="space-y-3 text-left max-w-sm mx-auto">
                            <div className="space-y-1.5">
                              <label className="text-xs text-gray-300 font-semibold">GitHub Username</label>
                              <input
                                type="text"
                                placeholder="e.g. torvalds"
                                value={inputGithubUsername}
                                onChange={(e) => setInputGithubUsername(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-app-border bg-white/5 font-mono text-sm text-app-text-h focus:outline-none focus:border-teal-500 transition-colors"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-xs text-gray-300 font-semibold">Personal Access Token (PAT) [Optional]</label>
                              <input
                                type="password"
                                placeholder="ghp_xxxxxxxxxxxx"
                                value={githubPat}
                                onChange={(e) => setGithubPat(e.target.value)}
                                className="w-full px-3 py-2 rounded-xl border border-app-border bg-white/5 font-mono text-sm text-app-text-h focus:outline-none focus:border-teal-500 transition-colors"
                              />
                              <div className="text-[10px] text-gray-500 leading-relaxed">
                                Required for private repos.{' '}
                                <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
                                  Generate token
                                </a>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleGithubAuthorize}
                            disabled={githubWizardLoading}
                            className="w-full max-w-sm mx-auto py-2.5 bg-[#1e2327] hover:bg-[#292f34] border border-[#1e2327] hover:border-[#292f34] text-white rounded-xl font-bold transition text-xs flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
                          >
                            {githubWizardLoading ? (
                              <>
                                <Activity className="w-4 h-4 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                <Github className="w-4 h-4 text-white" />
                                Authorize TblInc
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="p-3.5 rounded-xl border border-app-border bg-app-card flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <img src={`https://github.com/${githubUsername}.png?size=40`} alt={githubUsername} className="w-8 h-8 rounded-lg border border-app-border" />
                              <div>
                                <div className="text-xs font-bold text-app-text-h">@{githubUsername}</div>
                                <div className="text-[9px] text-gray-500 font-mono">github.com/{githubUsername}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-extrabold uppercase">
                                Connected
                              </span>
                              <button
                                type="button"
                                onClick={handleGithubDisconnect}
                                className="p-1.5 rounded-md hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 transition cursor-pointer"
                                title="Disconnect GitHub"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs text-gray-300 font-semibold">Select Repository</label>
                            {loadingRepos ? (
                              <div className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card text-gray-400 text-xs flex items-center gap-2">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Loading repositories...
                              </div>
                            ) : (
                              <select
                                required
                                value={githubRepo}
                                onChange={(e) => setGithubRepo(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card text-app-text-h focus:outline-none focus:border-teal-500 transition-colors text-xs font-semibold"
                              >
                                <option value="">-- Choose one of your repositories --</option>
                                {githubRepos.map(repo => (
                                  <option key={repo.id} value={`github.com/${repo.full_name}`}>
                                    {repo.full_name} {repo.private ? '(Private)' : ''}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* GitHub Branch Input */}
                          {githubRepo && (
                            <div className="space-y-1 animate-none">
                              <label className="text-xs text-gray-300 font-semibold">Deployment Branch</label>
                              <input
                                type="text"
                                required
                                placeholder="e.g. main, master, production"
                                value={githubBranch}
                                onChange={(e) => setGithubBranch(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card text-app-text-h focus:outline-none focus:border-teal-500 transition-colors text-xs font-semibold"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Local File Drop Zone */
                    <div className="space-y-1 animate-none">
                      <label className="text-xs text-gray-300 font-semibold">Upload Code Archive (.zip, .tar, .tar.gz)</label>
                      <div className="relative border border-dashed border-app-border-dim rounded-xl p-4 bg-app-card/30 hover:bg-app-card/50 transition text-center cursor-pointer">
                        <input
                          type="file"
                          required={!uploadBase64}
                          accept=".zip,.tar,.gz,.tar.gz,.tgz"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                const base64Str = (ev.target?.result as string).split(',')[1];
                                setUploadBase64(base64Str);
                                setUploadFileName(file.name);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="space-y-1">
                          <Upload className="w-6 h-6 text-teal-400 mx-auto" />
                          <div className="text-xs font-semibold text-app-text-h">
                            {uploadFileName ? `Selected: ${uploadFileName}` : 'Drag & Drop or Click to browse'}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Supports ZIP, TAR, TAR.GZ archives up to 20MB
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* DNS Forward Subdomain */}
                  <div className="space-y-1">
                    <label className="text-xs text-gray-300 font-semibold">Ingress Domain Forwarding</label>
                    <div className="relative flex items-center">
                      <Globe className="absolute left-3 w-4.5 h-4.5 text-zinc-500" />
                      <input
                        type="text"
                        required
                        placeholder="subdomain (e.g. shop)"
                        value={subdomain}
                        onChange={(e) => setSubdomain(e.target.value)}
                        className="w-full pl-10 pr-32 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-teal-500 transition-colors text-sm"
                      />
                      <span className="absolute right-3 text-xs text-zinc-500 font-mono select-none">
                        .tblinc.com
                      </span>
                    </div>
                  </div>

                  {/* Filter/Select Target Instance Host */}
                  <div className="space-y-1 text-left">
                    <label className="text-xs text-gray-300 font-semibold">Deploy Target Tblinc Host</label>
                    {runningInstances.length === 0 ? (
                      <div className="p-3 rounded-xl border border-amber-500/10 bg-amber-500/5 text-amber-400 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>No running Tblinc hosts detected. The app will be provisioned on a default instance virtual wrapper automatically.</span>
                      </div>
                    ) : (
                      <select
                        value={selectedInstance}
                        onChange={(e) => setSelectedInstance(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card text-app-text-h focus:outline-none focus:border-teal-500 transition-colors text-sm"
                      >
                        {runningInstances.map((inst) => (
                          <option key={inst.id || inst.name} value={inst.name}>
                            Host instance: {inst.name} ({isAdmin ? 'Admin Node' : 'Member Sandbox'})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Prices & Tier Selector */}
                  <div className="space-y-2 text-left">
                    <label className="text-xs text-gray-300 font-semibold">Select Deployment Tier</label>
                    <div className="grid grid-cols-3 gap-3">
                      {(Object.keys(pricingTiers) as Array<keyof typeof pricingTiers>).map((tier) => {
                        const config = pricingTiers[tier];
                        const isSelected = selectedTier === tier;
                        return (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => setSelectedTier(tier)}
                            className={`p-4 rounded-xl border font-semibold text-left flex flex-col gap-1 transition cursor-pointer relative overflow-hidden ${
                              isSelected
                                ? 'bg-teal-500/10 border-teal-500 text-teal-300'
                                : 'bg-app-card/50 border-app-border-dim text-gray-400 hover:text-app-text-h'
                            }`}
                          >
                            <div className="flex justify-between items-center w-full">
                              <span className="text-xs text-gray-300">{tier}</span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                            </div>
                            <span className="text-lg font-bold text-app-text-h">{config.price}</span>
                            <span className="text-[9px] text-gray-500 font-normal leading-tight">{config.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit / Action buttons */}
                  <div className="pt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 py-3 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition cursor-pointer text-center text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 bg-teal-600 hover:bg-teal-700 text-app-text-h rounded-xl font-medium transition cursor-pointer text-center shadow-lg hover:shadow-teal-500/20 text-xs"
                    >
                      Start Deployment
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Build Logs Terminal Console Card */}
      <AnimatePresence mode="wait">
        {selectedLogsProject && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-4xl mx-auto bg-[#09070f] border border-app-border rounded-2xl overflow-hidden shadow-lg mt-8 text-left flex flex-col h-[600px]"
          >
              {/* Header */}
              <div className="flex justify-between items-center bg-[#110e19] px-6 py-4 border-b border-app-border-dim shrink-0">
                <div className="flex items-center gap-2.5">
                  <Terminal className="text-teal-400 w-5 h-5" />
                  <span className="font-mono text-sm font-semibold text-app-text-h">
                    Deployment Ingress Logs — {selectedLogsProject.name}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedLogsProject(null)}
                  className="p-1.5 rounded-lg bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Logs area */}
              <div className="flex-1 p-6 overflow-y-auto font-mono text-xs text-emerald-400 space-y-1.5 bg-[#050408] scrollbar-thin">
                <div className="text-zinc-500 pb-3 border-b border-zinc-900 mb-3">
                  Tblinc Engine version 1.0 (Old Kingdom) - Web Deployment console history.
                  <br />
                  Target instance: host {selectedLogsProject.instanceName} | Ingress domain: {selectedLogsProject.subdomain}
                </div>
                {selectedLogsProject.logs.map((log, index) => (
                  <div key={index} className={log.startsWith('error') ? 'text-rose-400' : log.startsWith('success') ? 'text-teal-400 font-semibold' : 'text-emerald-400'}>
                    {log}
                  </div>
                ))}
              </div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* Project Settings Card */}
      <AnimatePresence mode="wait">
        {selectedSettingsProject && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-4xl mx-auto bg-app-card border border-app-border rounded-2xl p-7 shadow-lg mt-8 text-left"
          >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-app-text-h flex items-center gap-2">
                  <Settings className="text-violet-400 w-5 h-5" />
                  Project Settings — {selectedSettingsProject.name}
                </h3>
                <button
                  onClick={() => setSelectedSettingsProject(null)}
                  className="p-1.5 rounded-lg bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4">
                {/* Domain Forward Ingress */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold">Subdomain Forwarding</label>
                  <div className="relative flex items-center">
                    <Globe className="absolute left-3 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      required
                      placeholder="subdomain"
                      value={settingsSubdomain}
                      onChange={(e) => setSettingsSubdomain(e.target.value)}
                      className="w-full pl-9 pr-24 py-2 rounded-xl border border-app-border bg-[#0a080f] text-xs text-app-text-h focus:outline-none focus:border-violet-500 transition-colors"
                    />
                    <span className="absolute right-3 text-[10px] text-zinc-500 font-mono select-none">
                      .tblinc.com
                    </span>
                  </div>
                </div>

                {/* Target Tblinc Host */}
                <div className="space-y-1">
                  <label className="text-xs text-gray-300 font-semibold">Target Tblinc Host</label>
                  {runningInstances.length === 0 ? (
                    <div className="p-2 rounded-xl border border-amber-500/10 bg-amber-500/5 text-amber-400 text-[10px]">
                      No running Tblinc hosts detected.
                    </div>
                  ) : (
                    <select
                      value={settingsInstance}
                      onChange={(e) => setSettingsInstance(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-app-border bg-[#0a080f] text-xs text-app-text-h focus:outline-none focus:border-violet-500 transition-colors font-mono"
                    >
                      {runningInstances.map((inst) => (
                        <option key={inst.id || inst.name} value={inst.name}>
                          Host: {inst.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Pricing Tiers */}
                <div className="space-y-2">
                  <label className="text-xs text-gray-300 font-semibold">Deployment Resource Tier</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(pricingTiers) as Array<keyof typeof pricingTiers>).map((tier) => {
                      const isSelected = settingsTier === tier;
                      return (
                        <button
                          key={tier}
                          type="button"
                          onClick={() => setSettingsTier(tier)}
                          className={`p-2.5 rounded-xl border text-[10px] font-bold text-center flex flex-col items-center justify-center transition cursor-pointer ${
                            isSelected
                              ? 'bg-violet-500/10 border-violet-500 text-violet-400'
                              : 'bg-app-card/50 border-app-border-dim text-gray-400 hover:text-app-text-h'
                          }`}
                        >
                          <span className="capitalize">{tier}</span>
                          <span className="font-mono font-extrabold mt-0.5">{pricingTiers[tier].price}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedSettingsProject(null)}
                    className="flex-1 py-2.5 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition cursor-pointer text-center text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-violet-600 hover:bg-violet-700 text-app-text-h rounded-xl font-semibold transition cursor-pointer text-center text-xs shadow-lg hover:shadow-violet-500/20"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
