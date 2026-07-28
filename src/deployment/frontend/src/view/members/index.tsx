import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Search, Plus, Trash2, Shield, User, Mail, Globe, CheckCircle2, ShieldAlert, X, Sparkles, Key, Activity } from 'lucide-react';
import api from '../../api/axios';

interface MemberUser {
  id: number;
  username: string;
  email: string;
  address: string;
  is_staff: boolean;
  is_superuser: boolean;
  date_joined: string;
}

export default function MembersAdminView() {
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  
  // Add Member Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newIsStaff, setNewIsStaff] = useState(false);
  const [newIsSuperuser, setNewIsSuperuser] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/api/members/');
      setMembers(res.data);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to fetch cloud members database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    setModalSuccess(null);
    setSaving(true);
    try {
      await api.post('/api/members/', {
        username: newUsername,
        email: newEmail,
        password: newPassword,
        address: newAddress,
        is_staff: newIsStaff,
        is_superuser: newIsSuperuser,
      });
      setModalSuccess('Member account provisioned successfully!');
      setNewUsername('');
      setNewEmail('');
      setNewPassword('');
      setNewAddress('');
      setNewIsStaff(false);
      setNewIsSuperuser(false);
      fetchMembers();
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(null);
      }, 1500);
    } catch (err: any) {
      const errData = err.response?.data;
      let msg = 'Failed to provision member.';
      if (errData && typeof errData === 'object') {
        msg = Object.entries(errData).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('; ');
      }
      setModalError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: number, username: string) => {
    if (!window.confirm(`Are you sure you want to terminate member account "${username}"? This deletes all isolated sandbox resources.`)) {
      return;
    }
    try {
      await api.delete(`/api/members/${id}/`);
      setMembers(prev => prev.filter(m => m.id !== id));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete member.');
    }
  };

  const handleToggleStaff = async (member: MemberUser) => {
    try {
      const updated = !member.is_staff;
      await api.patch(`/api/members/${member.id}/`, { is_staff: updated });
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, is_staff: updated } : m));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to toggle privileges.');
    }
  };

  const filtered = members.filter(m => 
    m.username.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    m.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-semibold tracking-tight text-app-text-h flex items-center gap-3">
            <ShoppingBag className="text-emerald-500 w-8 h-8" />
            Members & E-commerce
          </h2>
          <p className="text-gray-400 mt-1">Manage sandboxed member tenants, resource subscriptions, and account privileges.</p>
        </div>

        <button
          onClick={() => {
            setModalError(null);
            setModalSuccess(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-750 text-app-text-h rounded-xl font-medium shadow-lg hover:shadow-emerald-500/20 active:scale-95 transition cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Add Member
        </button>
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

      {/* Search Filter Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 rounded-2xl border border-app-border-dim bg-app-card/50 backdrop-blur-md">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search members by username, email or physical address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-app-border bg-app-card/70 text-app-text-h placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>
      </div>

      {/* Users / Members Database Table */}
      {loading && members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Activity className="w-12 h-12 text-emerald-500 animate-spin" />
          <p className="text-gray-400 font-medium">Loading cloud members registry...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-app-border rounded-2xl bg-app-card/20">
          <User className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-app-text-h mb-1">No Members Found</h3>
          <p className="text-gray-400 max-w-xs mx-auto text-sm">
            {search ? 'No registered cloud tenants match your search filter.' : 'Deploy a sandbox or add user members manually.'}
          </p>
        </div>
      ) : (
        <div className="border border-app-border rounded-2xl bg-app-card/30 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-app-card/60 text-gray-400 font-semibold border-b border-app-border-dim select-none">
                  <th className="p-4">Member / User</th>
                  <th className="p-4">Email Address</th>
                  <th className="p-4">Physical Address</th>
                  <th className="p-4 text-center">Privileges</th>
                  <th className="p-4 text-center">Plan Tier</th>
                  <th className="p-4">Date Joined</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border-dim/40 text-gray-300">
                {filtered.map(member => (
                  <tr key={member.id} className="hover:bg-app-card/20 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
                          {member.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="font-semibold text-app-text-h font-mono">{member.username}</div>
                      </div>
                    </td>
                    <td className="p-4 font-mono">{member.email}</td>
                    <td className="p-4 max-w-[200px] truncate" title={member.address}>{member.address || <span className="text-gray-600 font-normal italic">None</span>}</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggleStaff(member)}
                        className={`px-2.5 py-1 rounded-lg border font-bold text-[9px] uppercase tracking-wide cursor-pointer transition ${
                          member.is_staff 
                            ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20' 
                            : 'bg-black/20 border-app-border-dim text-gray-500 hover:text-gray-350 hover:bg-white/5'
                        }`}
                      >
                        {member.is_staff ? 'Staff Admin' : 'Customer'}
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[9px] font-bold uppercase tracking-wider">
                        {member.is_staff ? 'Enterprise' : 'Developer Sandbox'}
                      </span>
                    </td>
                    <td className="p-4 text-gray-400">{member.date_joined ? member.date_joined.split('T')[0] : 'N/A'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDeleteMember(member.id, member.username)}
                        title="Delete User"
                        className="p-2 rounded-lg text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Member Pop-up Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setIsModalOpen(false)}
              className="fixed inset-0 bg-black z-40"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-app-card border border-app-border rounded-2xl p-6 shadow-2xl z-50 text-left"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-app-text-h flex items-center gap-2">
                  <Sparkles className="text-emerald-400 w-5 h-5" />
                  Add Member Account
                </h3>
                {!saving && (
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 rounded-lg bg-app-border-dim hover:bg-app-border text-gray-400 hover:text-app-text-h transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <form onSubmit={handleAddMember} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Username</label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      required
                      placeholder="john_doe"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-app-border bg-app-card/70 text-xs text-app-text-h focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      required
                      placeholder="john@example.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-app-border bg-app-card/70 text-xs text-app-text-h focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Temporary Password</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-app-border bg-app-card/70 text-xs text-app-text-h focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Physical Address</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="123 Cloud St, Silicon Valley, CA"
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-xl border border-app-border bg-app-card/70 text-xs text-app-text-h focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Roles checkboxes */}
                <div className="flex gap-4 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is-staff-check"
                      checked={newIsStaff}
                      onChange={(e) => setNewIsStaff(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <label htmlFor="is-staff-check" className="text-xs text-gray-300 select-none">Staff Privileges</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is-superuser-check"
                      checked={newIsSuperuser}
                      onChange={(e) => setNewIsSuperuser(e.target.checked)}
                      className="accent-emerald-500"
                    />
                    <label htmlFor="is-superuser-check" className="text-xs text-gray-300 select-none">Superuser Admin</label>
                  </div>
                </div>

                {modalError && (
                  <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-400 flex items-center gap-2 text-xs">
                    <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                    <span>{modalError}</span>
                  </div>
                )}

                {modalSuccess && (
                  <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 flex items-center gap-2 text-xs">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{modalSuccess}</span>
                  </div>
                )}

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 bg-app-border-dim hover:bg-app-border text-app-text-h rounded-xl font-medium transition cursor-pointer text-center text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-app-text-h rounded-xl font-semibold transition cursor-pointer text-center text-xs shadow-lg hover:shadow-emerald-500/20"
                  >
                    {saving ? 'Saving...' : 'Create Account'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
