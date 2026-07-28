import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'motion/react';
import {
  User as UserIcon, Key, Lock, Mail, Clipboard, Plus, Trash2,
  CheckCircle2, ShieldAlert, Eye, EyeOff, Terminal, Copy,
  RefreshCw, MapPin, Camera, Loader2, Fingerprint, Shield
} from 'lucide-react';
import { User, useAuth } from '../../store/auth';
import api from '../../api/axios';

interface ProfileViewProps {
  user: User | null;
  refreshUser: () => Promise<void>;
}

interface SshKey {
  id: number;
  name: string;
  public_key: string;
  fingerprint: string;
  added_on: string;
}

export default function ProfileView({ user, refreshUser }: ProfileViewProps) {
  const { addPasskey } = useAuth();

  // ── SSH Keys ──────────────────────────────────────────────────────────────
  const [sshKeys, setSshKeys] = useState<SshKey[]>([]);
  const [sshLoaded, setSshLoaded] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [keyContent, setKeyContent] = useState('');
  const [sshError, setSshError] = useState('');
  const [sshLoading, setSshLoading] = useState(false);

  // ── Password ──────────────────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // ── API Key ───────────────────────────────────────────────────────────────
  const [authKey, setAuthKey] = useState<string>('');
  const [keyVisible, setKeyVisible] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [keyError, setKeyError] = useState('');

  // ── Profile fields ────────────────────────────────────────────────────────
  const [address, setAddress] = useState(user?.address || '');
  const [location, setLocation] = useState((user as any)?.location || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Avatar ────────────────────────────────────────────────────────────────
  const [avatarPreview, setAvatarPreview] = useState<string>((user as any)?.avatar || '');
  const [avatarSaving, setAvatarSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── WebAuthn Passkeys ──────────────────────────────────────────────────────
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

  React.useEffect(() => {
    if (user?.address) setAddress(user.address);
    if ((user as any)?.location) setLocation((user as any).location);
    if ((user as any)?.avatar) setAvatarPreview((user as any).avatar);
    fetchAuthKey();
    fetchSshKeys();
    fetchPasskey();
  }, [user]);

  // ── API Key handlers ──────────────────────────────────────────────────────
  const fetchAuthKey = async () => {
    setKeyLoading(true);
    try {
      const res = await api.get('/api/auth/token/');
      setAuthKey(res.data.key);
    } catch (err) {
      setKeyError('Failed to load API Secret Key.');
    } finally {
      setKeyLoading(false);
    }
  };

  const handleRegenerateKey = async () => {
    if (!window.confirm('Regenerate your API Key? All existing integrations using the old key will break.')) return;
    setKeyLoading(true);
    try {
      const res = await api.post('/api/auth/token/');
      setAuthKey(res.data.key);
      setKeyVisible(true);
    } catch {
      setKeyError('Failed to regenerate API Secret Key.');
    } finally {
      setKeyLoading(false);
    }
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  // ── Profile save ──────────────────────────────────────────────────────────
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError('');
    try {
      await api.patch('/api/auth/users/me/', { address, location });
      setSaveSuccess(true);
      await refreshUser();
    } catch (err: any) {
      setSaveError(err.response?.data?.detail || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Avatar handlers ───────────────────────────────────────────────────────
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setAvatarPreview(dataUrl);
      setAvatarSaving(true);
      try {
        await api.patch('/api/auth/users/me/', { avatar: dataUrl });
        await refreshUser();
      } catch {
        // revert on failure
        setAvatarPreview((user as any)?.avatar || '');
      } finally {
        setAvatarSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // ── SSH Key handlers ──────────────────────────────────────────────────────
  const fetchSshKeys = async () => {
    try {
      const res = await api.get('/api/auth/ssh-keys/');
      setSshKeys(res.data);
      setSshLoaded(true);
    } catch {
      setSshLoaded(true);
    }
  };

  const handleAddSshKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSshError('');
    if (!keyName || !keyContent) return;
    if (!keyContent.startsWith('ssh-rsa') && !keyContent.startsWith('ssh-ed25519') && !keyContent.startsWith('ecdsa-sha2')) {
      setSshError('Invalid SSH key format. Must start with ssh-rsa, ssh-ed25519, or ecdsa-sha2.');
      return;
    }
    setSshLoading(true);
    try {
      const res = await api.post('/api/auth/ssh-keys/', { name: keyName, public_key: keyContent.trim() });
      setSshKeys(prev => [res.data, ...prev]);
      setKeyName('');
      setKeyContent('');
    } catch (err: any) {
      const msg = err.response?.data?.name?.[0] || err.response?.data?.detail || 'Failed to add SSH key.';
      setSshError(msg);
    } finally {
      setSshLoading(false);
    }
  };

  const handleDeleteSshKey = async (id: number) => {
    try {
      await api.delete(`/api/auth/ssh-keys/${id}/`);
      setSshKeys(prev => prev.filter(k => k.id !== id));
    } catch {
      // silent fail
    }
  };

  // ── Password handler ──────────────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');
    if (newPassword !== confirmPassword) { setPassError('New passwords do not match.'); return; }
    if (newPassword.length < 8) { setPassError('Password must be at least 8 characters.'); return; }
    setPassLoading(true);
    try {
      await api.post('/api/auth/users/set_password/', {
        new_password: newPassword,
        re_new_password: confirmPassword,
        current_password: currentPassword,
      });
      setPassSuccess('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      const errorData = error.response?.data;
      let msg = 'Failed to change password.';
      if (errorData) {
        msg = typeof errorData === 'object'
          ? Object.values(errorData).flat().join(', ')
          : String(errorData);
      }
      setPassError(msg);
    } finally {
      setPassLoading(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const isAdmin = !!(user as any)?.is_superuser || !!(user as any)?.is_staff;
  const initials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'US';

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8 text-left">
      <motion.div variants={itemVariants}>
        <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
          <UserIcon className="text-purple-500 w-8 h-8" />
          User Profile
        </h2>
        <p className="text-gray-400 mt-1">Manage your account details, security settings, and credentials.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">

          {/* Profile Card */}
          <motion.div variants={itemVariants} className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md space-y-6">
            <div className="flex items-center gap-5">
              {/* Avatar */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer"
                >
                  {avatarSaving
                    ? <Loader2 className="w-5 h-5 text-white animate-spin" />
                    : <Camera className="w-5 h-5 text-white" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>

              <div className="min-w-0">
                <h3 className="text-lg font-bold text-app-text-h truncate">{user?.username || 'User Account'}</h3>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  isAdmin
                    ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                    : 'text-teal-400 bg-teal-500/10 border-teal-500/20'
                }`}>
                  {isAdmin ? 'Global Administrator' : 'Member'}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-app-border-dim text-sm text-gray-300">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="truncate">{user?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clipboard className="w-4 h-4 text-gray-400 shrink-0" />
                <span>Account ID: #{user?.id || '—'}</span>
              </div>
              {location && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{location}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Profile Details Form */}
          <motion.div variants={itemVariants} className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md space-y-5">
            <h3 className="text-lg font-bold text-app-text-h flex items-center gap-2">
              <UserIcon className="text-purple-400 w-5 h-5" />
              Profile Details
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium">Physical Address</label>
                <input
                  type="text"
                  placeholder="123 Cloud St, Silicon Valley, CA"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card text-sm text-app-text-h focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Location / City
                </label>
                <input
                  type="text"
                  placeholder="San Francisco, CA"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card text-sm text-app-text-h focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <AnimatePresence>
                {saveError && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-center gap-2 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />{saveError}
                  </motion.div>
                )}
                {saveSuccess && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />Profile saved successfully!
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={isSaving}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center justify-center gap-2">
                {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Profile'}
              </button>
            </form>
          </motion.div>

          {/* Change Password */}
          <motion.div variants={itemVariants} className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md space-y-5">
            <h3 className="text-lg font-bold text-app-text-h flex items-center gap-2">
              <Lock className="text-purple-400 w-5 h-5" />
              Security / Password
            </h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              {['Current Password', 'New Password', 'Confirm New Password'].map((label, i) => (
                <div key={label} className="space-y-1">
                  <label className="text-xs text-gray-400">{label}</label>
                  <input
                    type="password"
                    required
                    value={[currentPassword, newPassword, confirmPassword][i]}
                    onChange={(e) => [setCurrentPassword, setNewPassword, setConfirmPassword][i](e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              ))}

              <AnimatePresence>
                {passError && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-center gap-2 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />{passError}
                  </motion.div>
                )}
                {passSuccess && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />{passSuccess}
                  </motion.div>
                )}
              </AnimatePresence>

              <button type="submit" disabled={passLoading}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition cursor-pointer active:scale-95 flex items-center justify-center gap-2">
                {passLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Updating...</> : 'Update Password'}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1 space-y-6">

          {/* SSH Keys */}
          <motion.div variants={itemVariants} className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md space-y-6">
            <div>
              <h3 className="text-lg font-bold text-app-text-h flex items-center gap-2">
                <Key className="text-purple-400 w-5 h-5" />
                SSH Authorized Keys
              </h3>
              <p className="text-xs text-gray-400 mt-1">Public keys for secure shell access to your VM instances.</p>
            </div>

            {/* Key list */}
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {sshLoaded && sshKeys.length === 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="p-4 rounded-xl border border-dashed border-app-border-dim text-center text-xs text-gray-500">
                    No SSH keys added yet.
                  </motion.div>
                )}
                {sshKeys.map((key) => (
                  <motion.div layout key={key.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="p-4 rounded-xl border border-app-border-dim bg-app-card/30 flex justify-between items-center gap-3">
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-app-text-h text-sm truncate">{key.name}</div>
                      <div className="text-xs font-mono text-gray-400 truncate">{key.fingerprint}</div>
                      <div className="text-[10px] text-gray-500">Added {key.added_on}</div>
                    </div>
                    <button onClick={() => handleDeleteSshKey(key.id)}
                      className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add key form */}
            <div className="pt-5 border-t border-app-border-dim">
              <h4 className="font-semibold text-app-text-h text-sm mb-4">Add SSH Public Key</h4>
              <form onSubmit={handleAddSshKey} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Key Name</label>
                  <input type="text" required placeholder="e.g. macbook-pro" value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h text-sm focus:outline-none focus:border-purple-500 transition-colors" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Public Key</label>
                  <textarea required rows={3} placeholder="ssh-ed25519 AAAA... user@host" value={keyContent}
                    onChange={(e) => setKeyContent(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h font-mono text-xs focus:outline-none focus:border-purple-500 transition-colors resize-none" />
                </div>

                {sshError && (
                  <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-center gap-2 text-xs">
                    <ShieldAlert className="w-4 h-4 shrink-0" />{sshError}
                  </div>
                )}

                <button type="submit" disabled={sshLoading}
                  className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition cursor-pointer active:scale-95">
                  {sshLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add Key
                </button>
              </form>
            </div>
          </motion.div>

          {/* WebAuthn / Passkeys */}
          <motion.div variants={itemVariants} className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md space-y-6">
            <div>
              <h3 className="text-lg font-bold text-app-text-h flex items-center gap-2">
                <Fingerprint className="text-purple-400 w-5 h-5" />
                WebAuthn / Passkeys
              </h3>
              <p className="text-xs text-gray-400 mt-1">Use biometrics or security keys for secure, passwordless authentication.</p>
            </div>

            <div className="space-y-4">
              {passkey ? (
                <div className="p-4 rounded-xl border border-app-border-dim bg-app-card/30 flex justify-between items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <div className="font-semibold text-app-text-h text-sm truncate">
                        {passkey.display_name || 'Passkey Device'}
                      </div>
                      <div className="text-xs text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Registered & Active
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePasskey(passkey.id)}
                    disabled={passkeyLoading}
                    className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {passkeyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed border-app-border-dim text-center text-xs text-gray-500 space-y-3">
                  <div>No passkeys registered. Register a device to enable passwordless sign-in.</div>
                  <button
                    type="button"
                    onClick={handleRegisterPasskey}
                    disabled={passkeyLoading}
                    className="mx-auto flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer active:scale-95"
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
                    className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />{passkeySuccess}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* API Secret Key */}
          <motion.div variants={itemVariants} className="p-6 rounded-2xl border border-app-border bg-app-card/50 backdrop-blur-md space-y-5">
            <div>
              <h3 className="text-lg font-bold text-app-text-h flex items-center gap-2">
                <Terminal className="text-purple-400 w-5 h-5" />
                API Secret Key
              </h3>
              <p className="text-xs text-gray-400 mt-1">Your secret token for authenticating API requests and integrations.</p>
            </div>

            {keyError && (
              <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-center gap-2 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0" />{keyError}
              </div>
            )}

            <div className="p-4 rounded-xl border border-app-border-dim bg-app-card/30 space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block">Authentication Token</label>
                <div className="flex items-center gap-2">
                  <input type={keyVisible ? 'text' : 'password'} readOnly
                    value={authKey || (keyLoading ? 'Loading...' : '—')}
                    className="w-full px-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h font-mono text-sm focus:outline-none transition-colors" />
                  <button type="button" onClick={() => setKeyVisible(!keyVisible)}
                    className="p-2.5 rounded-xl bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer shrink-0">
                    {keyVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button type="button" onClick={() => copyToClipboard(authKey)}
                    className="p-2.5 rounded-xl bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer shrink-0">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={handleRegenerateKey} disabled={keyLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50">
                  <RefreshCw className={`w-4 h-4 ${keyLoading ? 'animate-spin' : ''}`} />
                  {keyLoading ? 'Processing...' : 'Regenerate Key'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-app-border-dim">
              <h4 className="font-semibold text-app-text-h text-sm mb-3">Example cURL Request</h4>
              <div className="relative group">
                <pre className="p-4 rounded-xl border border-app-border-dim bg-black/50 overflow-x-auto text-xs font-mono text-gray-300">
                  <code>
                    curl -X GET http://localhost:8000/api/instances/ \<br />
                    &nbsp;&nbsp;&nbsp;&nbsp;-H "Authorization: Token {keyVisible && authKey ? authKey : 'YOUR_SECRET_KEY'}"
                  </code>
                </pre>
                <button type="button"
                  onClick={() => copyToClipboard(`curl -X GET http://localhost:8000/api/instances/ -H "Authorization: Token ${authKey}"`)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-app-border hover:bg-purple-600 text-gray-400 hover:text-white transition cursor-pointer opacity-0 group-hover:opacity-100">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
