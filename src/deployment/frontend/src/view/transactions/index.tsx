import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, ArrowUpRight, ArrowDownRight, Search, Activity, User, X } from 'lucide-react';
import api from '../../api/axios';

interface MemberUser {
  id: number;
  username: string;
  email: string;
  balance?: number;
}

export default function TransactionsView() {
  const [members, setMembers] = useState<MemberUser[]>([]);
  const [balances, setBalances] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'balances' | 'requests'>('balances');
  
  // Pending Requests state
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<MemberUser | null>(null);
  const [amount, setAmount] = useState<number | string>('');

  useEffect(() => {
    if (activeTab === 'balances') {
      fetchMembers();
    } else {
      fetchRequests();
    }
  }, [activeTab]);

  const fetchRequests = async () => {
    setRequestsLoading(true);
    try {
      const res = await api.get('/api/admin-billing/');
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/members/');
      setMembers(res.data);
      
      // Initialize balances from backend
      const initialBalances: Record<number, number> = {};
      res.data.forEach((m: MemberUser) => {
        initialBalances[m.id] = Number(m.balance) || 0.00;
      });
      setBalances(prev => ({ ...prev, ...initialBalances }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = (type: 'deposit' | 'withdraw') => {
    if (!selectedUser || !amount || isNaN(Number(amount))) return;
    
    const val = Number(amount);
    if (val <= 0) return;

    setBalances(prev => {
      const current = prev[selectedUser.id] || 0;
      const updated = type === 'deposit' ? current + val : current - val;
      return { ...prev, [selectedUser.id]: updated };
    });

    setIsModalOpen(false);
    setAmount('');
    setSelectedUser(null);
  };

  const openModal = (user: MemberUser) => {
    setSelectedUser(user);
    setAmount('');
    setIsModalOpen(true);
  };

  const handleVerify = async (reqId: number, reqType: string, newStatus: 'verified' | 'rejected') => {
    if (!window.confirm(`Are you sure you want to ${newStatus === 'verified' ? 'approve' : 'reject'} this request?`)) return;
    try {
      await api.post('/api/admin-billing/verify/', {
        id: reqId,
        type: reqType,
        status: newStatus
      });
      fetchRequests();
      fetchMembers(); // refresh balances
    } catch (err) {
      console.error(err);
      alert('Failed to process request');
    }
  };

  const filteredMembers = members.filter(m => 
    m.username.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const pastRequests = requests.filter(r => r.status !== 'pending');

  return (
    <div className="p-6 text-left w-full h-full max-w-6xl mx-auto bg-app-bg text-app-text font-sans">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/15 flex items-center justify-center border border-blue-500/30 shadow-lg shadow-blue-500/10">
            <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-app-text-h tracking-tight">User Transactions</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">Manage user balances, deposits, and withdrawals.</p>
          </div>
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="w-4 h-4 text-gray-500 dark:text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search users..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-72 pl-10 pr-4 py-2.5 bg-app-card border border-app-border rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none text-app-text-h transition-all shadow-inner"
          />
        </div>
      </div>

      <div className="flex border-b border-app-border mb-6">
        <button
          onClick={() => setActiveTab('balances')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${activeTab === 'balances' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-app-text-h'}`}
        >
          Members Balances
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${activeTab === 'requests' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500 hover:text-app-text-h'}`}
        >
          Pending Requests
          {pendingRequests.length > 0 && (
            <span className="px-2 py-0.5 bg-rose-500 text-white text-xs font-bold rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      <div className="bg-app-card border border-app-border rounded-2xl overflow-hidden shadow-sm">
        {activeTab === 'balances' ? (
          loading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4">
              <Activity className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-gray-500 dark:text-gray-400 font-medium">Loading members data...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-app-text">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-app-bg/50 border-b border-app-border">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">User Account</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Available Balance</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {filteredMembers.map(member => (
                    <tr key={member.id} className="hover:bg-app-bg transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-app-bg flex items-center justify-center border border-app-border shadow-sm">
                            <User className="w-4.5 h-4.5 text-gray-500 dark:text-gray-300" />
                          </div>
                          <div>
                            <div className="font-bold text-app-text-h text-[15px]">{member.username}</div>
                            <div className="text-[13px] text-gray-500 dark:text-gray-400">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5 font-mono text-lg font-bold">
                          <DollarSign className="w-4 h-4 text-gray-500" />
                          <span className={balances[member.id] < 0 ? "text-rose-500 dark:text-rose-400" : "text-app-text-h"}>
                            {(balances[member.id] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button 
                          type="button"
                          onClick={() => openModal(member)}
                          className="px-4 py-2 bg-app-bg hover:bg-blue-500/10 border border-app-border hover:border-blue-500/40 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-sm"
                        >
                          Manage Balance
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-6 py-16 text-center text-gray-500 flex flex-col items-center justify-center">
                        <Search className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-3" />
                        No users found matching your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : (
          requestsLoading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-4">
              <Activity className="w-8 h-8 text-blue-500 animate-spin" />
              <span className="text-gray-500 dark:text-gray-400 font-medium">Loading requests...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-app-text">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-app-bg/50 border-b border-app-border">
                  <tr>
                    <th className="px-6 py-4 font-bold tracking-wider">Date</th>
                    <th className="px-6 py-4 font-bold tracking-wider">User</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Type / Method</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Amount</th>
                    <th className="px-6 py-4 font-bold tracking-wider">Details</th>
                    <th className="px-6 py-4 font-bold tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-app-border">
                  {requests.map(req => (
                    <tr key={`${req.type}-${req.id}`} className="hover:bg-app-bg transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-app-text-h">{req.user?.username || 'Unknown'}</div>
                        <div className="text-xs text-gray-500">{req.user?.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${req.type === 'deposit' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {req.type === 'deposit' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {req.type}
                        </span>
                        <div className="mt-1 text-xs text-gray-500 font-bold uppercase">{req.method}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-base font-bold text-app-text-h">
                        ${Number(req.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {req.details}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {req.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleVerify(req.id, req.type, 'rejected')}
                              className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold rounded-md transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleVerify(req.id, req.type, 'verified')}
                              className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-xs font-bold rounded-md transition-colors cursor-pointer"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${req.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {req.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {requests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-gray-500 flex flex-col items-center justify-center">
                        <Activity className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-3" />
                        No requests found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-md">
          <div className="bg-app-sidebar border border-app-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-app-text font-sans">
            <div className="px-6 py-5 border-b border-app-border flex justify-between items-center bg-app-card">
              <h3 className="text-lg font-extrabold text-app-text-h flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                Manage User Balance
              </h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-app-text-h transition bg-transparent hover:bg-app-bg p-1.5 rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4 bg-app-bg p-4 rounded-xl border border-app-border">
                <div className="w-12 h-12 rounded-full bg-app-card flex items-center justify-center border border-app-border">
                  <User className="w-5 h-5 text-gray-500 dark:text-gray-300" />
                </div>
                <div>
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Account</div>
                  <div className="text-base font-bold text-app-text-h">{selectedUser.username}</div>
                </div>
                <div className="ml-auto text-right">
                  <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-0.5">Current Balance</div>
                  <div className="text-lg font-mono font-bold text-app-text-h">${(balances[selectedUser.id] || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                </div>
              </div>

              <div className="space-y-2.5">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 ml-1">Transaction Amount</label>
                <div className="relative">
                  <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-11 pr-4 py-3.5 bg-app-bg border border-app-border rounded-xl text-app-text-h font-mono text-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 outline-none transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleTransaction('withdraw')}
                  disabled={!amount || Number(amount) <= 0}
                  className="flex items-center justify-center gap-2 py-3.5 bg-app-card hover:bg-rose-500/10 border border-app-border hover:border-rose-500/40 text-gray-600 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <ArrowDownRight className="w-4.5 h-4.5 text-rose-600 dark:text-rose-500 group-hover:animate-bounce" /> Withdraw
                </button>
                <button
                  type="button"
                  onClick={() => handleTransaction('deposit')}
                  disabled={!amount || Number(amount) <= 0}
                  className="flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 group"
                >
                  <ArrowUpRight className="w-4.5 h-4.5 text-blue-100 group-hover:text-white" /> Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
