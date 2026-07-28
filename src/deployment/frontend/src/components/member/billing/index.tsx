import React, { useState } from 'react';
import { CreditCard, Check, AlertCircle, Loader2, DollarSign, Download, Calendar, Activity, Cpu, HardDrive, ArrowUpRight, ArrowDownRight, Plus, X, Wallet, Smartphone, Landmark } from 'lucide-react';
import api from '../../../api/axios';

interface MemberInstance {
  id: string;
  name: string;
  template: string;
  status: 'Running' | 'Stopped' | 'Provisioning';
  ipAddress: string;
  cpu: number;
  ram: string; // e.g. "2GB"
  disk: string; // e.g. "40GB"
  uptime: string;
  tier: 'Free' | 'Pro' | 'Advance';
  domain?: string;
}

interface MemberBill {
  id: string;
  date: string;
  amount: string;
  status: 'Paid' | 'Pending';
}

interface PaymentMethod {
  id: string;
  type?: 'card' | 'bank';
  brand?: string;
  last4: string;
  exp: string;
  isDefault: boolean;
}

interface MemberBillingProps {
  instances?: MemberInstance[];
  refreshUser?: () => Promise<void>;
}

export default function MemberBillingView({ instances = [], refreshUser }: MemberBillingProps) {
  const [bills, setBills] = useState<MemberBill[]>([]);
  const [selectedTier, setSelectedTier] = useState<'Free' | 'Pro' | 'Advance'>('Free');
  const [loading, setLoading] = useState(true);

  // New states for Balance and Cards
  const [balance, setBalance] = useState(0);

  // Define brand icons component inline to use original logos
  const BrandIcon = ({ brand, type }: { brand: string, type?: string }) => {
    if (type === 'bank') {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-white/90">
          <path d="M3 21h18"></path><path d="M3 10h18"></path><path d="M5 6l7-3 7 3"></path><path d="M4 10v11"></path><path d="M20 10v11"></path><path d="M8 14v3"></path><path d="M12 14v3"></path><path d="M16 14v3"></path>
        </svg>
      );
    }
    switch (brand.toLowerCase()) {
      case 'visa':
        return (
          <svg viewBox="0 0 38 12" className="h-6 w-auto">
            <path fill="#ffffff" d="M13.6 11.5L15.9 0h2.4l-2.3 11.5h-2.4zm16.5-11.2c-1.1-.4-2.5-.6-4.1-.6-4.5 0-7.7 2.4-7.7 5.8 0 2.5 2.2 3.9 3.9 4.7 1.8.8 2.4 1.3 2.4 2 0 1.1-1.3 1.6-2.5 1.6-1.7 0-2.6-.3-4-.9l-.6-.3-.3 2.1c1 .4 2.8.8 4.7.8 4.7 0 7.8-2.3 7.8-5.9 0-1.9-1.1-3.4-3.7-4.6-1.6-.7-2.6-1.2-2.6-2 0-.7.8-1.5 2.4-1.5 1.3 0 2.3.3 3.1.6l.4.2.4-2.1zm5.1 11.2h2.5L34.1 0h-2.3c-.6 0-1.1.4-1.3.9l-4.4 10.6h2.6s.4-1.2.5-1.5h3.2c0 .3.3 1.5.3 1.5zm-3.1-3.6l1.2-3.3c0-.1.2-.5.3-1 .1.4.1.8.3 1.3l.7 3h-2.5zM12 8.1L8.7.6c-.2-.5-.6-1-.6H.1L0 0l2 9.6 1.1-6c.2-.7.6-1 1.2-1h3.3l1.8 8.9h2.6z"/>
          </svg>
        );
      case 'mastercard':
        return (
          <svg viewBox="0 0 36 22" className="h-7 w-auto">
            <circle fill="#EB001B" cx="11" cy="11" r="11"/><circle fill="#F79E1B" cx="25" cy="11" r="11"/>
            <path fill="#FF5F00" d="M18 11c0-2.6.9-4.9 2.5-6.8-1.6-1.9-4.1-3.2-6.5-3.2s-4.9 1.3-6.5 3.2C9.1 6.1 10 8.4 10 11s-.9 4.9-2.5 6.8c1.6 1.9 4.1 3.2 6.5 3.2s4.9-1.3 6.5-3.2c-1.6-1.9-2.5-4.2-2.5-6.8z"/>
          </svg>
        );
      case 'amex':
        return (
          <div className="bg-[#007bc1] text-white text-[12px] font-black px-2 py-1 rounded">AMEX</div>
        );
      case 'discover':
        return <div className="text-white text-lg font-black italic">Discover</div>;
      default:
        return <CreditCard className="w-8 h-8 text-white/80" />;
    }
  };

  const [cards, setCards] = useState<PaymentMethod[]>([
    { id: 'mock_card_1', type: 'card', brand: 'Visa', last4: '4242', exp: '12/28', isDefault: true },
    { id: 'mock_bank_1', type: 'bank', brand: 'Chase Bank', last4: '9901', exp: 'N/A', isDefault: false }
  ]);
  
  // Card verification state for removal
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);

  // Modal states
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  
  // Mobile Deposit states
  const [depositMethod, setDepositMethod] = useState<'card' | 'mobile'>('mobile');
  const [mobileMethod, setMobileMethod] = useState<'bkash' | 'nagad' | 'rocket'>('bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [tnxId, setTnxId] = useState('');

  // Add Method states
  const [addMethodType, setAddMethodType] = useState<'card' | 'bank'>('card');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardExp, setNewCardExp] = useState('');
  const [newCardCvc, setNewCardCvc] = useState('');
  const [newBankName, setNewBankName] = useState('');
  const [newBankAccount, setNewBankAccount] = useState('');
  const [newBankRouting, setNewBankRouting] = useState('');
  const [cardError, setCardError] = useState('');
  
  // Selected Card for deposit
  const [selectedCardId, setSelectedCardId] = useState<string>('');

  // Withdraw states
  const [withdrawMethod, setWithdrawMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'bank' | 'visa'>('bkash');
  const [withdrawAccountDetails, setWithdrawAccountDetails] = useState('');

  React.useEffect(() => {
    const fetchBilling = async () => {
      try {
        const res = await api.get('/api/member-billing/');
        setBills(res.data.bills || []);
        setSelectedTier(res.data.active_tier || 'Free');
        if (res.data.balance !== undefined) {
          setBalance(res.data.balance);
        }
      } catch (err) {
        console.error("Failed to fetch billing data", err);
        // Fallback mock data if API fails
        setBills([
          { id: 'INV-2026-07-01', date: 'Jul 1, 2026', amount: '$15.00', status: 'Paid' },
          { id: 'INV-2026-06-01', date: 'Jun 1, 2026', amount: '$15.00', status: 'Paid' },
          { id: 'INV-2026-05-01', date: 'May 1, 2026', amount: '$15.00', status: 'Paid' },
        ]);
        setSelectedTier('Pro');
      } finally {
        setLoading(false);
      }
    };
    fetchBilling();
  }, []);

  const plans = [
    { title: 'Free', price: '$0/mo', desc: 'Best for local sandboxes.', spec: '1 vCPU, 512MB RAM, 10GB disk', maxCpu: 1, maxRam: 0.5, maxDisk: 10 },
    { title: 'Pro', price: '$15/mo', desc: 'Great for production APIs.', spec: '2 vCPU, 2GB RAM, 40GB disk', maxCpu: 2, maxRam: 2, maxDisk: 40 },
    { title: 'Advance', price: '$49/mo', desc: 'High performance cluster.', spec: '4 vCPU, 8GB RAM, 150GB disk', maxCpu: 4, maxRam: 8, maxDisk: 150 }
  ];

  const activePlanDetails = plans.find(p => p.title === selectedTier) || plans[0];

  // Calculate used resources
  const totalCpuUsed = instances.reduce((acc, inst) => acc + (inst.cpu || 0), 0);
  const totalRamUsed = instances.reduce((acc, inst) => {
    const val = parseFloat(inst.ram) || 0;
    const isMB = inst.ram.includes('MB');
    return acc + (isMB ? val / 1024 : val);
  }, 0);
  const totalDiskUsed = instances.reduce((acc, inst) => acc + (parseFloat(inst.disk) || 0), 0);

  const cpuPercent = Math.min(100, Math.round((totalCpuUsed / activePlanDetails.maxCpu) * 100)) || 0;
  const ramPercent = Math.min(100, Math.round((totalRamUsed / activePlanDetails.maxRam) * 100)) || 0;
  const diskPercent = Math.min(100, Math.round((totalDiskUsed / activePlanDetails.maxDisk) * 100)) || 0;

  const handleDeposit = async () => {
    if (!amountInput || isNaN(Number(amountInput)) || Number(amountInput) <= 0) return;
    try {
      if (depositMethod === 'mobile') {
        if (!senderNumber) {
          alert('Sender number is required for mobile deposit');
          return;
        }
        if (!tnxId) {
          alert('Transaction ID is required for mobile deposit');
          return;
        }
        await api.post('/api/member-billing/submit_mobile_deposit/', { 
          amount: Number(amountInput),
          method: mobileMethod,
          sender_number: senderNumber,
          tnx_id: tnxId
        });
        alert('Deposit request submitted! Please wait for admin verification.');
      } else {
        const res = await api.post('/api/member-billing/add_balance/', { amount: Number(amountInput) });
        setBalance(res.data.balance);
      }
      setIsDepositOpen(false);
      setAmountInput('');
      setSenderNumber('');
      setTnxId('');
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      console.error('Failed to deposit', err);
      alert(err.response?.data?.error || 'Failed to deposit funds');
    }
  };

  const handleWithdraw = async () => {
    if (!amountInput || isNaN(Number(amountInput)) || Number(amountInput) <= 0) return;
    try {
      if (!withdrawAccountDetails) {
        alert('Please enter your account details where you want to receive the funds.');
        return;
      }
      const res = await api.post('/api/member-billing/withdraw_balance/', { 
        amount: Number(amountInput),
        method: withdrawMethod,
        account_details: withdrawAccountDetails
      });
      alert(res.data.message || 'Withdrawal request submitted! It is pending verification.');
      setIsWithdrawOpen(false);
      setAmountInput('');
      setWithdrawAccountDetails('');
      if (refreshUser) await refreshUser();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to withdraw balance');
    }
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    setCardError('');
    
    if (addMethodType === 'bank') {
      if (!newBankName || !newBankAccount) {
        setCardError('Bank Name and Account Number are required.');
        return;
      }
      const newMethod: PaymentMethod = {
        id: `bank_${Date.now()}`,
        type: 'bank',
        brand: newBankName,
        last4: newBankAccount.slice(-4) || '****',
        exp: 'N/A',
        isDefault: cards.length === 0
      };
      setCards([...cards, newMethod]);
      if (cards.length === 0) setSelectedCardId(newMethod.id);
      setNewBankName('');
      setNewBankAccount('');
      setNewBankRouting('');
      setIsAddCardOpen(false);
      return;
    }

    // Clean inputs for Card
    const number = newCardNumber.replace(/\D/g, '');
    const exp = newCardExp.replace(/\s/g, '');
    const cvc = newCardCvc.replace(/\D/g, '');

    // 1. Basic length checks
    if (number.length < 13 || number.length > 19) {
      setCardError('Invalid card number length.');
      return;
    }

    // 2. Luhn Algorithm Check
    let sum = 0;
    let isEven = false;
    for (let i = number.length - 1; i >= 0; i--) {
      let digit = parseInt(number.charAt(i), 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }
    if (sum % 10 !== 0) {
      setCardError('Invalid card number (Verification failed).');
      return;
    }

    // 3. Expiry Check (MM/YY)
    const expMatch = exp.match(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/);
    if (!expMatch) {
      setCardError('Invalid expiry format. Use MM/YY.');
      return;
    }
    const month = parseInt(expMatch[1], 10);
    const year = parseInt(`20${expMatch[2]}`, 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      setCardError('Card has expired.');
      return;
    }

    // 4. CVC Check
    if (cvc.length < 3 || cvc.length > 4) {
      setCardError('Invalid CVC.');
      return;
    }

    // Determine Brand
    let brand = 'Unknown';
    if (number.startsWith('4')) brand = 'Visa';
    else if (/^5[1-5]/.test(number)) brand = 'Mastercard';
    else if (/^3[47]/.test(number)) brand = 'Amex';
    else if (/^6(?:011|5)/.test(number)) brand = 'Discover';
    else brand = 'Credit Card';

    const newCard: PaymentMethod = { 
      id: `card_${Date.now()}`, 
      type: 'card',
      brand, 
      last4: number.slice(-4), 
      exp: expMatch[0], 
      isDefault: cards.length === 0 
    };

    setCards([...cards, newCard]);
    if (cards.length === 0) setSelectedCardId(newCard.id);
    
    // Reset form
    setNewCardNumber('');
    setNewCardExp('');
    setNewCardCvc('');
    setIsAddCardOpen(false);
  };

  const formatCardNumber = (val: string) => {
    const v = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) return parts.join(' ');
    return val;
  };

  const formatExp = (val: string) => {
    const v = val.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto pb-12">
      <div>
        <h3 className="text-2xl font-bold text-app-text-h flex items-center gap-2">
          <CreditCard className="w-6 h-6 text-teal-400" /> Billing & Subscriptions
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage payment history, plans, cards, and allocated container budgets.</p>
      </div>

      {/* Account Balance and Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-app-card border border-app-border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-teal-400" />
              <h4 className="font-bold text-app-text-h text-sm">Account Balance</h4>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Available funds for your infrastructure costs.</p>
            <div className="mt-4 text-4xl font-black text-app-text-h font-mono tracking-tight">
              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={() => { setAmountInput(''); setIsDepositOpen(true); }}
              className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" /> Deposit Funds
            </button>
            <button
              onClick={() => { setAmountInput(''); setIsWithdrawOpen(true); }}
              className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-app-bg hover:bg-app-border-dim border border-app-border text-app-text font-bold rounded-xl text-sm transition cursor-pointer"
            >
              <ArrowDownRight className="w-4 h-4 text-rose-500" /> Withdraw
            </button>
          </div>
        </div>

        <div className="bg-app-card border border-app-border rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                <h4 className="font-bold text-app-text-h text-sm">Payment Methods</h4>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Manage your linked cards and bank accounts.</p>
            </div>
            <button
              onClick={() => setIsAddCardOpen(true)}
              className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Payment Method
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar flex-1 items-center">
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 w-full bg-app-bg border border-dashed border-app-border rounded-xl">
                <CreditCard className="w-8 h-8 text-gray-500 mb-3" />
                <p className="text-sm font-bold text-gray-400 mb-1">No Payment Methods</p>
                <p className="text-xs text-gray-500 text-center max-w-xs">Add a credit card or bank account to enable seamless deposits and withdrawals.</p>
              </div>
            ) : cards.map((card) => (
              <div key={card.id} className={`group shrink-0 w-[300px] h-[180px] rounded-2xl p-5 relative overflow-hidden text-white flex flex-col justify-between shadow-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${card.type === 'bank' ? 'bg-gradient-to-br from-cyan-600 via-blue-700 to-indigo-900' : card.brand === 'Visa' ? 'bg-gradient-to-br from-indigo-800 to-blue-900' : card.brand === 'Mastercard' ? 'bg-gradient-to-br from-gray-900 to-gray-800' : 'bg-gradient-to-br from-emerald-600 to-teal-900'}`}>
                {/* Premium Glassmorphism Reflections */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none"></div>
                
                <div className="relative z-10 flex justify-between items-start">
                  <div className="opacity-90">
                    {card.type === 'bank' ? (
                       <Landmark className="w-8 h-8 opacity-0" /> // Spacer for layout
                    ) : (
                       <Cpu className="w-9 h-9 text-yellow-300/80 drop-shadow-sm" />
                    )}
                  </div>
                  <div className="drop-shadow-md">
                    <BrandIcon brand={card.brand || ''} type={card.type} />
                  </div>
                </div>
                
                <div className="relative z-10">
                  <div className="font-mono text-xl tracking-[0.2em] mb-3 opacity-95 drop-shadow-sm flex items-center">
                    {card.type === 'bank' ? `•••• •••• •••• ${card.last4}` : `•••• •••• •••• ${card.last4}`}
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <div className="text-[9px] uppercase tracking-[0.2em] opacity-70 mb-0.5">{card.type === 'bank' ? 'Bank Account' : 'Cardholder'}</div>
                      <div className="text-sm font-bold uppercase tracking-wider truncate max-w-[140px] drop-shadow-sm">{card.type === 'bank' ? card.brand : 'MEMBER'}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      {card.isDefault && (
                        <div className="bg-white/20 backdrop-blur-md text-[9px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full mb-1 border border-white/10">Default</div>
                      )}
                      {card.type !== 'bank' && (
                        <div className="flex gap-2 text-right">
                          <div className="flex flex-col justify-end text-[7px] uppercase tracking-widest opacity-60 leading-tight"><span>Valid</span><span>Thru</span></div>
                          <div className="text-sm font-bold font-mono tracking-wider drop-shadow-sm">{card.exp}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Action buttons (Set Default & Delete) visible on hover */}
                <div className={`absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 flex flex-col items-center justify-center gap-3 z-20 ${cardToDelete === card.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {cardToDelete === card.id ? (
                    <div className="text-center animate-in zoom-in duration-200 px-4">
                      <p className="text-[11px] font-bold text-rose-400 mb-1 uppercase tracking-wider">Action Denied</p>
                      <p className="text-xs font-bold text-white mb-3">Only admin can remove this card.</p>
                      <div className="flex gap-2 justify-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCardToDelete(null);
                          }}
                          className="px-6 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          Okay
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      {!card.isDefault && (
                        <button 
                          onClick={() => setCards(cards.map(c => ({ ...c, isDefault: c.id === card.id })))}
                          className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs font-bold rounded-xl backdrop-blur-md transition cursor-pointer"
                        >
                          Set Default
                        </button>
                      )}
                      <button 
                        onClick={() => setCardToDelete(card.id)}
                        className="p-2 bg-rose-500/80 hover:bg-rose-500 text-white rounded-xl backdrop-blur-md transition cursor-pointer shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div>
        <h4 className="font-bold text-app-text-h text-sm mb-4">Available Plans</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-3 flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            </div>
          ) : plans.map(plan => (
            <div
              key={plan.title}
              className={`p-6 rounded-2xl border flex flex-col justify-between h-auto min-h-[260px] relative transition-all ${
                selectedTier === plan.title
                  ? 'bg-gradient-to-br from-teal-500/15 to-teal-500/5 border-teal-500/40 shadow-xl shadow-teal-500/10'
                  : 'bg-app-card hover:bg-app-bg border-app-border'
              }`}
            >
              {selectedTier === plan.title && (
                <span className="absolute top-4 right-4 bg-teal-500/20 border border-teal-500/40 text-teal-400 text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Active
                </span>
              )}
              <div className="space-y-3 mt-2">
                <h4 className={`font-extrabold text-sm uppercase tracking-wider ${selectedTier === plan.title ? 'text-teal-400' : 'text-gray-500'}`}>{plan.title}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-app-text-h">{plan.price.split('/')[0]}</span>
                  <span className="text-sm font-semibold text-gray-500">/{plan.price.split('/')[1]}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed min-h-[40px]">{plan.desc}</p>
                <div className="pt-4 border-t border-app-border">
                  <ul className="space-y-2 text-xs font-medium text-app-text">
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-400 shrink-0" /> {plan.maxCpu} vCPU Cores</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-400 shrink-0" /> {plan.maxRam >= 1 ? plan.maxRam : plan.maxRam * 1024} {plan.maxRam >= 1 ? 'GB' : 'MB'} RAM</li>
                    <li className="flex items-center gap-2"><Check className="w-4 h-4 text-teal-400 shrink-0" /> {plan.maxDisk}GB NVMe Storage</li>
                  </ul>
                </div>
              </div>

              <div className="pt-6 mt-auto">
                {selectedTier === plan.title ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3 bg-teal-500/10 border border-teal-500/30 text-teal-400 font-bold rounded-xl text-xs cursor-default text-center transition-colors"
                  >
                    Current Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedTier(plan.title as any)}
                    className="w-full py-3 bg-app-bg hover:bg-teal-500/10 border border-app-border hover:border-teal-500/30 text-gray-400 hover:text-teal-400 font-bold rounded-xl text-xs transition cursor-pointer text-center"
                  >
                    Select Plan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Allocated Container Budgets */}
        <div className="space-y-4">
          <h4 className="font-bold text-app-text-h text-sm">Allocated Container Budgets</h4>
          <div className="bg-app-card border border-app-border rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-bold text-app-text-h">Resource Utilization</div>
                <div className="text-xs text-gray-500 mt-0.5">Based on your {selectedTier} plan limits</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20">
                <Activity className="w-5 h-5 text-teal-400" />
              </div>
            </div>
            
            <div className="space-y-5">
              {/* CPU Budget */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-500 flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> CPU Cores</span>
                  <span className="text-app-text-h">{totalCpuUsed} / {activePlanDetails.maxCpu}</span>
                </div>
                <div className="h-2 w-full bg-app-bg rounded-full overflow-hidden border border-app-border">
                  <div className={`h-full rounded-full transition-all ${cpuPercent > 90 ? 'bg-rose-500' : cpuPercent > 70 ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ width: `${cpuPercent}%` }} />
                </div>
              </div>

              {/* RAM Budget */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-500 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Memory (RAM)</span>
                  <span className="text-app-text-h">{totalRamUsed.toFixed(1)}GB / {activePlanDetails.maxRam}GB</span>
                </div>
                <div className="h-2 w-full bg-app-bg rounded-full overflow-hidden border border-app-border">
                  <div className={`h-full rounded-full transition-all ${ramPercent > 90 ? 'bg-rose-500' : ramPercent > 70 ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ width: `${ramPercent}%` }} />
                </div>
              </div>

              {/* Disk Budget */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-gray-500 flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> Storage (Disk)</span>
                  <span className="text-app-text-h">{totalDiskUsed.toFixed(0)}GB / {activePlanDetails.maxDisk}GB</span>
                </div>
                <div className="h-2 w-full bg-app-bg rounded-full overflow-hidden border border-app-border">
                  <div className={`h-full rounded-full transition-all ${diskPercent > 90 ? 'bg-rose-500' : diskPercent > 70 ? 'bg-amber-400' : 'bg-teal-400'}`} style={{ width: `${diskPercent}%` }} />
                </div>
              </div>
            </div>

            {(cpuPercent > 90 || ramPercent > 90 || diskPercent > 90) && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-3 mt-4">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-500 font-medium">
                  You are approaching your plan limits. Consider upgrading to the next tier to deploy more instances.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="space-y-4">
          <h4 className="font-bold text-app-text-h text-sm">Payment History</h4>
          <div className="bg-app-card border border-app-border rounded-2xl overflow-hidden shadow-sm">
            {bills.length === 0 && !loading ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                No payment history available.
              </div>
            ) : (
              <div className="divide-y divide-app-border">
                {bills.map(b => (
                  <div key={b.id} className="flex justify-between items-center p-5 hover:bg-app-bg transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 shrink-0">
                        <DollarSign className="w-5 h-5 text-teal-400" />
                      </div>
                      <div className="space-y-1">
                        <div className="font-bold text-app-text-h text-sm group-hover:text-teal-400 transition-colors">Invoice {b.id}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3.5 h-3.5" /> {b.date}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className="font-mono text-app-text-h font-bold text-base">{b.amount}</span>
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider border ${
                          b.status === 'Paid' 
                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                        }`}>
                          {b.status}
                        </span>
                        <button type="button" title="Download Invoice" className="text-gray-400 hover:text-teal-400 transition cursor-pointer">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {bills.length > 0 && (
              <div className="p-3 border-t border-app-border bg-app-bg text-center">
                <button type="button" className="text-xs font-bold text-teal-400 hover:text-teal-300 transition cursor-pointer">View All Receipts</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Deposit Modal */}
      {isDepositOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-md">
          <div className="bg-app-sidebar border border-app-border rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-app-border flex justify-between items-center">
              <h3 className="font-bold text-app-text-h flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-teal-400" /> Deposit Funds
              </h3>
              <button type="button" onClick={() => setIsDepositOpen(false)} className="text-gray-500 hover:text-app-text-h">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex bg-app-bg p-1 rounded-xl border border-app-border">
                <button
                  type="button"
                  onClick={() => setDepositMethod('mobile')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${depositMethod === 'mobile' ? 'bg-teal-500/20 text-teal-400' : 'text-gray-400 hover:text-app-text-h'}`}
                >
                  Mobile Banking
                </button>
                <button
                  type="button"
                  onClick={() => setDepositMethod('card')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors ${depositMethod === 'card' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-app-text-h'}`}
                >
                  Credit Card
                </button>
              </div>

              {depositMethod === 'mobile' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-app-text mb-3 block">Select Method</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'bkash', name: 'bKash', color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/50' },
                        { id: 'nagad', name: 'Nagad', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/50' },
                        { id: 'rocket', name: 'Rocket', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/50' }
                      ].map(m => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMobileMethod(m.id as any)}
                          className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all cursor-pointer ${mobileMethod === m.id ? `${m.bg} ${m.border} shadow-sm shadow-${m.color.split('-')[1]}-500/20` : 'bg-app-bg border-app-border text-gray-500 hover:text-app-text-h hover:border-gray-500/30'}`}
                        >
                          <img src={m.id === 'rocket' ? '/rocket.svg' : `/${m.id}.png`} alt={m.name} className={`w-10 h-10 object-contain mb-2 ${mobileMethod === m.id ? '' : 'grayscale opacity-60'}`} />
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${mobileMethod === m.id ? m.color : ''}`}>{m.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 bg-app-bg border border-app-border rounded-xl text-xs text-gray-400">
                    Send money to our {mobileMethod.charAt(0).toUpperCase() + mobileMethod.slice(1)} Personal Account: <strong className="text-app-text-h">01700000000</strong>. Save the TrxID.
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-app-text mb-2 block">Amount (USD)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min="1"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 outline-none"
                  />
                </div>
              </div>

              {depositMethod === 'mobile' ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-app-text mb-2 block">Sender Mobile Number</label>
                    <input
                      type="text"
                      value={senderNumber}
                      onChange={(e) => setSenderNumber(e.target.value)}
                      placeholder="e.g. 01700000000"
                      className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-app-text mb-2 block">Transaction ID (TrxID)</label>
                    <input
                      type="text"
                      value={tnxId}
                      onChange={(e) => setTnxId(e.target.value)}
                      placeholder="e.g. 9B6A2X8Z"
                      className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm font-mono focus:border-teal-500 focus:ring-1 focus:ring-teal-500/50 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-app-text mb-2 block">Select Saved Payment Method</label>
                  {cards.length === 0 ? (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> No payment methods added yet. Please add a card or bank first.
                    </div>
                  ) : (
                    <select
                      value={selectedCardId || (cards.length > 0 ? cards[0].id : '')}
                      onChange={(e) => setSelectedCardId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none"
                    >
                      {cards.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.type === 'bank' ? '🏦 ' : '💳 '}{c.brand} •••• {c.last4} {c.type === 'card' && `(Exp ${c.exp})`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <button
                type="button"
                onClick={handleDeposit}
                disabled={!amountInput || Number(amountInput) <= 0 || (depositMethod === 'mobile' && (!tnxId || !senderNumber)) || (depositMethod === 'card' && cards.length === 0)}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
              >
                {depositMethod === 'mobile' ? 'Verify & Submit Request' : 'Confirm Deposit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {isWithdrawOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70 backdrop-blur-md">
          <div className="bg-app-sidebar border border-app-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-app-border flex justify-between items-center">
              <h3 className="font-bold text-app-text-h flex items-center gap-2">
                <ArrowDownRight className="w-4 h-4 text-rose-500" /> Withdraw Funds
              </h3>
              <button type="button" onClick={() => setIsWithdrawOpen(false)} className="text-gray-500 hover:text-app-text-h">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6">
              <div>
                <label className="text-xs font-bold text-app-text mb-2 block">Amount to Withdraw (USD)</label>
                <input
                  type="number"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="e.g. 50.00"
                  className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 outline-none mb-6"
                />
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-app-text mb-3 block">Withdrawal Method</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { id: 'bkash', name: 'bKash', color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/50' },
                      { id: 'nagad', name: 'Nagad', color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/50' },
                      { id: 'rocket', name: 'Rocket', color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/50' },
                      { id: 'bank', name: 'Bank Transfer', color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/50', icon: 'bank' },
                      { id: 'visa', name: 'Visa Direct', color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/50', icon: 'visa' }
                    ].map(m => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setWithdrawMethod(m.id as any)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer ${withdrawMethod === m.id ? `${m.bg} ${m.border} shadow-sm shadow-${m.color.split('-')[1]}-500/20` : 'bg-app-bg border-app-border text-gray-500 hover:text-app-text-h hover:border-gray-500/30'}`}
                      >
                        {m.id === 'bank' ? (
                          <Landmark className={`w-8 h-8 mb-2 ${withdrawMethod === m.id ? m.color : 'opacity-40'}`} />
                        ) : m.id === 'visa' ? (
                          <div className={`w-10 h-8 mb-2 flex items-center justify-center ${withdrawMethod === m.id ? 'opacity-100' : 'opacity-40 grayscale'}`}>
                            <svg viewBox="0 0 38 12" className="w-full h-auto">
                              <path fill={withdrawMethod === m.id ? "#1434CB" : "currentColor"} d="M13.6 11.5L15.9 0h2.4l-2.3 11.5h-2.4zm16.5-11.2c-1.1-.4-2.5-.6-4.1-.6-4.5 0-7.7 2.4-7.7 5.8 0 2.5 2.2 3.9 3.9 4.7 1.8.8 2.4 1.3 2.4 2 0 1.1-1.3 1.6-2.5 1.6-1.7 0-2.6-.3-4-.9l-.6-.3-.3 2.1c1 .4 2.8.8 4.7.8 4.7 0 7.8-2.3 7.8-5.9 0-1.9-1.1-3.4-3.7-4.6-1.6-.7-2.6-1.2-2.6-2 0-.7.8-1.5 2.4-1.5 1.3 0 2.3.3 3.1.6l.4.2.4-2.1zm5.1 11.2h2.5L34.1 0h-2.3c-.6 0-1.1.4-1.3.9l-4.4 10.6h2.6s.4-1.2.5-1.5h3.2c0 .3.3 1.5.3 1.5zm-3.1-3.6l1.2-3.3c0-.1.2-.5.3-1 .1.4.1.8.3 1.3l.7 3h-2.5zM12 8.1L8.7.6c-.2-.5-.6-1-.6H.1L0 0l2 9.6 1.1-6c.2-.7.6-1 1.2-1h3.3l1.8 8.9h2.6z"/>
                            </svg>
                          </div>
                        ) : (
                          <img src={m.id === 'rocket' ? '/rocket.svg' : `/${m.id}.png`} alt={m.name} className={`w-8 h-8 object-contain mb-2 ${withdrawMethod === m.id ? '' : 'grayscale opacity-60'}`} />
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider text-center ${withdrawMethod === m.id ? m.color : ''}`}>{m.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-bold text-app-text mb-2 block">
                    {withdrawMethod === 'bank' ? 'Bank Account Details' : withdrawMethod === 'visa' ? 'Visa Card Number' : `${withdrawMethod.charAt(0).toUpperCase() + withdrawMethod.slice(1)} Number`}
                  </label>
                  <input
                    type="text"
                    value={withdrawAccountDetails}
                    onChange={(e) => setWithdrawAccountDetails(e.target.value)}
                    placeholder={withdrawMethod === 'bank' ? 'Account Name, Number, Bank Name, Routing' : withdrawMethod === 'visa' ? '16-digit Visa Card Number' : 'e.g. 01700000000'}
                    className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm font-mono focus:border-rose-500 focus:ring-1 focus:ring-rose-500/50 outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleWithdraw}
                disabled={!amountInput || Number(amountInput) <= 0 || Number(amountInput) > balance || !withdrawAccountDetails}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
              >
                Submit Withdrawal Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsAddCardOpen(false)}></div>
          <div className="bg-app-card border border-app-border w-full max-w-sm rounded-2xl shadow-xl relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-app-border flex justify-between items-center bg-app-bg">
              <h3 className="font-bold text-app-text-h">Add Payment Method</h3>
              <button onClick={() => setIsAddCardOpen(false)} className="text-gray-400 hover:text-white transition cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex border-b border-app-border">
              <button
                onClick={() => setAddMethodType('card')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${addMethodType === 'card' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-app-text-h'}`}
              >
                Credit Card
              </button>
              <button
                onClick={() => setAddMethodType('bank')}
                className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors cursor-pointer ${addMethodType === 'bank' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-app-text-h'}`}
              >
                Bank Account
              </button>
            </div>
            <form onSubmit={handleAddCard} className="p-6 space-y-4">
              {cardError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {cardError}
                </div>
              )}
              
              {addMethodType === 'card' ? (
                <>
                  <div>
                    <label className="text-xs font-bold text-app-text mb-2 block">Card Number</label>
                    <input
                      required
                      type="text"
                      value={newCardNumber}
                      onChange={(e) => setNewCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      placeholder="0000 0000 0000 0000"
                      className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-app-text mb-2 block">Expiry</label>
                      <input
                        required
                        type="text"
                        value={newCardExp}
                        onChange={(e) => setNewCardExp(formatExp(e.target.value))}
                        maxLength={5}
                        placeholder="MM/YY"
                        className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-app-text mb-2 block">CVC</label>
                      <input
                        required
                        type="text"
                        value={newCardCvc}
                        onChange={(e) => setNewCardCvc(e.target.value.replace(/\D/g, ''))}
                        placeholder="123"
                        maxLength={4}
                        className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-app-text mb-2 block">Bank Name</label>
                    <input
                      required
                      type="text"
                      value={newBankName}
                      onChange={(e) => setNewBankName(e.target.value)}
                      placeholder="e.g. Chase Bank"
                      className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-app-text mb-2 block">Account Number</label>
                    <input
                      required
                      type="text"
                      value={newBankAccount}
                      onChange={(e) => setNewBankAccount(e.target.value)}
                      placeholder="000000000000"
                      className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-app-text mb-2 block">Routing Number (Optional)</label>
                    <input
                      type="text"
                      value={newBankRouting}
                      onChange={(e) => setNewBankRouting(e.target.value)}
                      placeholder="123456789"
                      className="w-full px-4 py-2.5 bg-app-bg border border-app-border rounded-xl text-app-text-h text-sm font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 outline-none"
                    />
                  </div>
                </>
              )}
              
              <button
                type="submit"
                disabled={addMethodType === 'card' ? (!newCardNumber || !newCardExp || !newCardCvc) : (!newBankName || !newBankAccount)}
                className="w-full py-2.5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
              >
                {addMethodType === 'card' ? 'Verify & Save Card' : 'Save Bank Account'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
