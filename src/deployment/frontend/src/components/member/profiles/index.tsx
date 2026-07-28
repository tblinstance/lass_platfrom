import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, ShieldAlert, Globe, CheckCircle2, Camera, MapPin, Navigation, Fingerprint, Plus, Trash2, Loader2, Activity, X, Terminal } from 'lucide-react';
import api from '../../../api/axios';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import { useAuth } from '../../../store/auth';

const Github = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface MemberProfileProps {
  user: { username: string; email: string; address?: string; avatar?: string; location?: string } | null;
  refreshUser: () => Promise<void>;
}

export default function MemberProfileView({ user, refreshUser }: MemberProfileProps) {
  const { addPasskey } = useAuth();
  const [activeTier, setActiveTier] = useState<'Free' | 'Pro' | 'Advance'>('Pro');
  
  // Physical Address states
  const [address, setAddress] = useState(user?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Geo Location states
  const [location, setLocation] = useState(user?.location || '');
  const [isSavingLoc, setIsSavingLoc] = useState(false);
  const [saveLocSuccess, setSaveLocSuccess] = useState(false);
  const [saveLocError, setSaveLocError] = useState('');
  const [isDetectingLoc, setIsDetectingLoc] = useState(false);

  // WebAuthn Passkeys states
  const [passkey, setPasskey] = useState<any | null>(null);
  const [passkeyLoading, setPasskeyLoading] = useState(false);
  const [passkeyError, setPasskeyError] = useState('');
  const [passkeySuccess, setPasskeySuccess] = useState('');

  const fetchPasskey = async () => {
    try {
      const res = await api.get('/api/auth/webauthn-keys/');
      if (res.data && res.data.length > 0) {
        setPasskey(res.data[0]);
      } else {
        setPasskey(null);
      }
    } catch {
      setPasskey(null);
    }
  };

  const handleRegisterPasskey = async () => {
    setPasskeyError('');
    setPasskeySuccess('');
    setPasskeyLoading(true);
    try {
      const res = await addPasskey();
      if (res.success) {
        setPasskeySuccess('Passkey registered successfully!');
        await fetchPasskey();
      } else {
        setPasskeyError(res.error || 'Failed to register Passkey.');
      }
    } catch (err: any) {
      setPasskeyError(err.message || 'An error occurred during passkey registration.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  const handleDeletePasskey = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete your Passkey? You will no longer be able to log in using this passkey.')) return;
    setPasskeyError('');
    setPasskeySuccess('');
    setPasskeyLoading(true);
    try {
      await api.delete(`/api/auth/webauthn-keys/${id}/`);
      setPasskeySuccess('Passkey deleted successfully.');
      setPasskey(null);
    } catch {
      setPasskeyError('Failed to delete Passkey.');
    } finally {
      setPasskeyLoading(false);
    }
  };

  // GitHub Integration States
  const [isGithubConnected, setIsGithubConnected] = useState(() => localStorage.getItem('github_connected') === 'true');
  const [githubUsername, setGithubUsername] = useState(() => localStorage.getItem('github_username') || '');
  const [githubWizardLoading, setGithubWizardLoading] = useState(false);
  const [githubPat, setGithubPat] = useState(() => localStorage.getItem('github_pat') || '');
  const [inputGithubUsername, setInputGithubUsername] = useState('');

  useEffect(() => {
    const checkAuth = () => {
      setIsGithubConnected(localStorage.getItem('github_connected') === 'true');
      setGithubUsername(localStorage.getItem('github_username') || '');
    };
    checkAuth();
    fetchPasskey();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleGithubAuthorize = async () => {
    if (!inputGithubUsername && !githubPat) {
      alert("Please enter a GitHub username or PAT.");
      return;
    }
    setGithubWizardLoading(true);
    try {
      const headers: any = {};
      if (githubPat) headers['Authorization'] = `token ${githubPat}`;
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
      window.dispatchEvent(new Event('storage')); // Notify other components
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
    window.dispatchEvent(new Event('storage'));
  };

  // Update local state when user prop changes
  useEffect(() => {
    if (user?.address) setAddress(user.address);
    if (user?.location) setLocation(user.location);
  }, [user]);

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(false);
    setSaveSuccess(false);
    setSaveError('');
    setIsSaving(true);
    try {
      await api.patch('/api/auth/users/me/', { address });
      setSaveSuccess(true);
      await refreshUser();
    } catch (err: any) {
      setSaveError(err.response?.data?.detail || 'Failed to update address.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveLocation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingLoc(false);
    setSaveLocSuccess(false);
    setSaveLocError('');
    setIsSavingLoc(true);
    try {
      await api.patch('/api/auth/users/me/', { location });
      setSaveLocSuccess(true);
      await refreshUser();
    } catch (err: any) {
      setSaveLocError(err.response?.data?.detail || 'Failed to update location.');
    } finally {
      setIsSavingLoc(false);
    }
  };

  const handleAutoDetectLocation = () => {
    setIsDetectingLoc(true);
    if (!navigator.geolocation) {
      setSaveLocError('Geolocation is not supported by your browser');
      setIsDetectingLoc(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocode using Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          let newLoc = '';
          if (data.address) {
            newLoc = `${data.address.city || data.address.town || data.address.village || ''}, ${data.address.country || ''}`.replace(/^, /, '').trim();
          } else {
            newLoc = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          }
          setLocation(newLoc);
          await api.patch('/api/auth/users/me/', { location: newLoc });
          setSaveLocSuccess(true);
          await refreshUser();
        } catch (err) {
          setSaveLocError("Failed to reverse geocode location");
        } finally {
          setIsDetectingLoc(false);
        }
      },
      () => {
        setSaveLocError('Unable to retrieve your location');
        setIsDetectingLoc(false);
      }
    );
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result as string;
        await api.patch('/api/auth/users/me/', { avatar: base64String });
        await refreshUser();
      };
      reader.readAsDataURL(file);
    } catch (err) {
      alert("Failed to upload avatar");
    } finally {
      setIsUploadingAvatar(false);
    }
  };


  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5 text-left w-full max-w-4xl mx-auto">
      <motion.div variants={itemVariants}>
        <h3 className="text-xl font-bold text-app-text-h">User Profile</h3>
        <p className="text-gray-400 text-xs mt-1">Manage credentials, sandbox keys, and dashboard profile settings.</p>
      </motion.div>
      
      <hr className="border-app-border-dim" />

      <div className="flex flex-col-reverse lg:flex-row-reverse gap-5 items-stretch justify-center">
        {/* Left Column: GitHub and Security Integration Cards */}
        <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-5">
          {/* GitHub Integration Card */}
          <motion.div variants={itemVariants} className="w-full h-full rounded-2xl border border-app-border bg-app-card/40 p-5 shadow-lg">
          <div className="flex items-center gap-3 mb-6 border-b border-app-border-dim pb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
              <Github className="w-5 h-5 text-teal-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-app-text-h">GitHub Integration</h4>
              <p className="text-[11px] text-gray-400">Link your repositories</p>
            </div>
          </div>
          
          {!isGithubConnected ? (
            <div className="p-5 rounded-2xl border border-app-border bg-app-card space-y-5 text-center">
              <div className="space-y-1">
                <Github className="w-10 h-10 text-white mx-auto mb-3" />
                <h4 className="font-bold text-app-text-h text-base">Connect GitHub Account</h4>
                <p className="text-[11px] text-gray-400 leading-relaxed max-w-xs mx-auto">
                  Link your GitHub account to directly select and pull your public or private repositories for deployment.
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
            <div className="p-4 rounded-xl border border-app-border bg-app-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={`https://github.com/${githubUsername}.png?size=48`} alt={githubUsername} className="w-10 h-10 rounded-lg border border-app-border" />
                <div>
                  <div className="text-sm font-bold text-app-text-h">@{githubUsername}</div>
                  <div className="text-[10px] text-gray-500 font-mono">github.com/{githubUsername}</div>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-extrabold uppercase tracking-wide">
                  Connected
                </span>
                <button
                  type="button"
                  onClick={handleGithubDisconnect}
                  className="text-[10px] font-bold text-gray-400 hover:text-rose-400 transition cursor-pointer flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Disconnect
                </button>
              </div>
            </div>
          )}
        </motion.div>


      </div>

      {/* Right Column: User Profile Data */}
      <motion.div variants={itemVariants} className="w-full lg:w-[320px] shrink-0 rounded-2xl border border-app-border bg-app-card/40 overflow-hidden relative shadow-lg">
        <div className="p-5 space-y-5 relative">
          <div className="flex items-end gap-4 mb-2">
            <div className="relative group shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                className="hidden"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="w-20 h-20 rounded-2xl bg-app-bg border-[3px] border-app-bg shadow-xl flex items-center justify-center relative overflow-hidden z-10 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 bg-teal-500/20 flex items-center justify-center font-extrabold text-3xl text-teal-400">
                    {user?.username ? user.username.substring(0, 2).toUpperCase() : 'ME'}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                  {isUploadingAvatar ? (
                    <Activity className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </div>
              </button>
            </div>
            <div className="pb-1 space-y-1">
              <h4 className="text-lg font-black text-app-text-h flex items-center gap-2 drop-shadow-md">
                {user?.username || 'member_user'}
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30 text-[9px] uppercase font-extrabold tracking-wider shadow-sm">
                  {activeTier} Plan
                </span>
              </h4>
              <div className="text-[10px] text-gray-500 font-mono font-medium">Role: Sandboxed Member Tenant</div>
              {user?.location && (
                <div className="text-[10px] text-teal-400 font-medium flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3" />
                  {user.location}
                </div>
              )}
            </div>
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-app-border-dim text-xs font-semibold">
          <div className="space-y-1.5">
            <span className="text-gray-400 flex items-center gap-1.5"><User className="w-4 h-4 text-teal-400" /> Username</span>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 font-mono shadow-sm">{user?.username || 'N/A'}</div>
          </div>
          <div className="space-y-1.5">
            <span className="text-gray-400 flex items-center gap-1.5"><Mail className="w-4 h-4 text-teal-400" /> Email address</span>
            <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-700 font-mono shadow-sm">{user?.email || 'N/A'}</div>
          </div>
        </div>

        {/* Geo Location System Form */}
        <div className="space-y-3 pt-4 border-t border-app-border-dim">
          <span className="text-xs text-gray-400 font-semibold block">Geo-Location Tracking</span>
          <form onSubmit={handleSaveLocation} className="space-y-3">
            <div className="relative flex gap-3">
              <div className="relative flex-1">
                <MapPin className="absolute left-3.5 top-3.5 w-4.5 h-4.5 text-teal-400" />
                <input
                  type="text"
                  placeholder="No location configured. Enter coordinates or city..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-app-border bg-app-card text-xs text-app-text-h placeholder-gray-500 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
              <button
                type="button"
                onClick={handleAutoDetectLocation}
                disabled={isDetectingLoc}
                className="shrink-0 px-4 py-3 bg-white/5 hover:bg-white/10 border border-app-border text-teal-400 font-bold rounded-xl text-xs transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isDetectingLoc ? <Activity className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                Auto-Detect
              </button>
            </div>
            
            <div className="flex justify-between items-center">
              <div>
                {saveLocSuccess && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Geo-Location saved successfully!
                  </span>
                )}
                {saveLocError && (
                  <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5" /> {saveLocError}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={isSavingLoc}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-teal-950 font-bold rounded-lg text-[10px] uppercase tracking-wider transition active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isSavingLoc ? <Activity className="w-3 h-3 animate-spin" /> : null}
                Update Location
              </button>
            </div>
          </form>
        </div>

        {/* Active Profile Plan Tier */}
        <div className="p-4 mt-2 rounded-xl bg-white shadow-sm">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block mb-3">Active Profile Plan Tier</span>
          <div className="flex gap-2">
            {(['Free', 'Pro', 'Advance'] as const).map(tier => (
              <button
                key={tier}
                type="button"
                onClick={() => setActiveTier(tier)}
                className={`flex-1 py-2 px-2 rounded-lg text-center text-xs font-bold transition cursor-pointer ${
                  activeTier === tier
                    ? 'bg-teal-50 border border-teal-200 text-teal-700 shadow-sm ring-1 ring-teal-500/20'
                    : 'bg-transparent border border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>

        {/* WebAuthn / Passkeys */}
        <div className="space-y-4 pt-4 border-t border-app-border-dim">
          <div>
            <span className="text-xs text-gray-400 font-semibold flex items-center gap-1.5 mb-1">
              <Fingerprint className="w-4 h-4 text-teal-400" />
              WebAuthn / Passkeys
            </span>
            <p className="text-[10px] text-gray-400 leading-relaxed">Use biometrics or security keys for secure, passwordless authentication.</p>
          </div>

          <div className="space-y-3">
            {passkey ? (
              <div className="p-4 rounded-xl border border-app-border bg-app-card flex justify-between items-center gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-app-text-h text-sm truncate">
                      {passkey.display_name || 'Passkey Device'}
                    </div>
                    <div className="text-xs text-emerald-450 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Registered & Active
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeletePasskey(passkey.id)}
                  disabled={passkeyLoading}
                  className="p-2 rounded-lg text-gray-400 hover:text-rose-450 hover:bg-rose-500/10 transition cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {passkeyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-app-border bg-app-card text-center text-xs text-gray-400 space-y-3">
                <div>No passkeys registered. Register a device to enable passwordless sign-in.</div>
                <button
                  type="button"
                  onClick={handleRegisterPasskey}
                  disabled={passkeyLoading}
                  className="mx-auto flex items-center gap-2 px-4 py-2.5 bg-teal-500 hover:bg-teal-400 text-teal-950 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {passkeyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Register Device
                </button>
              </div>
            )}

            <AnimatePresence>
              {passkeyError && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-center gap-2 text-xs">
                  <ShieldAlert className="w-4 h-4 shrink-0" />{passkeyError}
                </motion.div>
              )}
              {passkeySuccess && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-450 flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />{passkeySuccess}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="p-4 rounded-xl border border-teal-500/10 bg-teal-500/5 text-teal-300 flex items-start gap-3 text-xs leading-relaxed">
        <Shield className="w-5 h-5 text-teal-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Sandbox Isolation Active:</span> Your compute container workloads are fully segregated inside a network bridge namespace. Admin users cannot view internal application code or databases without key privilege escalations.
        </div>
      </motion.div>

    </motion.div>
  );
}
