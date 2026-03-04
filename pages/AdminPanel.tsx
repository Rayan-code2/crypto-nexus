
import React, { useState, useEffect } from 'react';
import { mockApi } from '../lib/mockApi';
import { User, Wallet, ExchangerRequest, Task, Transaction } from '../types';
import { BRAND_CONFIG } from '../brandConfig';

const AdminPanel: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'users' | 'exchanger' | 'tasks' | 'settings' | 'deposits'>('analytics');
  const [users, setUsers] = useState<(User & { wallets: Wallet[] })[]>([]);
  const [exchangeRequests, setExchangeRequests] = useState<ExchangerRequest[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // System Settings State
  const [buyRate, setBuyRate] = useState(92);
  const [sellRate, setSellRate] = useState(88);
  const [adminUpi, setAdminUpi] = useState('nexus@upi');
  const [adminQr, setAdminQr] = useState('');

  // New Task Form State
  const [newTask, setNewTask] = useState({ title: '', description: '', reward: 0, link: '' });

  const [processing, setProcessing] = useState<string | null>(null);
  const [giftAmount, setGiftAmount] = useState<string>('');
  const [giftUserId, setGiftUserId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const userData = await mockApi.db.getAllUsers();
      setUsers(userData as any);

      const exData = await mockApi.db.getExchangeRequests();
      setExchangeRequests(exData as any);

      const taskData = await mockApi.db.getTasks();
      setTasks(taskData as any);

      const settings = await mockApi.db.getSettings();
      if (settings) {
        setBuyRate(settings.usdt_buy_rate || 92);
        setSellRate(settings.usdt_sell_rate || 88);
        setAdminUpi(settings.admin_upi || 'nexus@upi');
        setAdminQr(settings.admin_qr || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    await mockApi.db.updateUser(userId, { is_blocked: !currentStatus });
    showStatus(`Node ${!currentStatus ? 'Suspended' : 'Activated'}`); 
    fetchData();
  };

  const handleToggleRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole.toLowerCase() === 'admin' ? 'user' : 'admin';
    await mockApi.db.updateUser(userId, { role: newRole });
    showStatus(`Agent role updated to ${newRole}`); 
    fetchData();
  };

  const handleUpdateBalance = async (userId: string, newBalance: string) => {
    const amount = parseFloat(newBalance);
    if (isNaN(amount)) return;
    await mockApi.db.updateWallet(userId, amount);
    showStatus("Balance Synchronized"); 
    fetchData();
  };

  const handleGiftUSDT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!giftUserId || !giftAmount) return;
    const amount = parseFloat(giftAmount);
    if (isNaN(amount) || amount <= 0) {
      showStatus("Invalid Amount", "error");
      return;
    }

    try {
      const wallet = await mockApi.db.getWallet(giftUserId);
      if (wallet) {
        await mockApi.db.updateWallet(giftUserId, wallet.balance + amount);
        showStatus(`Gifted $${amount} USDT Successfully`);
        setGiftUserId(null);
        setGiftAmount('');
        fetchData();
      }
    } catch (err) {
      showStatus("Gift Failed", "error");
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    await mockApi.db.addTask(newTask);
    showStatus("New Task Deployed");
    setNewTask({ title: '', description: '', reward: 0, link: '' });
    fetchData();
  };

  const handleUpdateRates = async () => {
    // Ensure we don't send NaN
    const finalBuyRate = isNaN(buyRate) ? 92 : buyRate;
    const finalSellRate = isNaN(sellRate) ? 88 : sellRate;

    try {
      await mockApi.db.updateSettings({
        usdt_buy_rate: finalBuyRate,
        usdt_sell_rate: finalSellRate,
        admin_upi: adminUpi,
        admin_qr: adminQr
      });
      showStatus("System Rates Updated Successfully");
    } catch (e: any) {
      console.error("Rate update error:", e);
      showStatus(e.message || "Failed to update rates", "error");
    }
  };

  const handleApproveExchange = async (requestId: string, status: 'approved' | 'rejected') => {
    if (processing) return;
    setProcessing(requestId);
    try {
      const request = exchangeRequests.find(r => r.id === requestId);
      if (!request || request.status !== 'pending') {
        setProcessing(null);
        return;
      }

      // Update the request status in DB
      await mockApi.db.updateExchangeRequest(requestId, { status });

      // If it's a deposit or buy and approved, add balance to user and activate account
      if ((request.type === 'deposit' || request.type === 'buy') && status === 'approved') {
        const wallet = await mockApi.db.getWallet(request.user_id);
        if (wallet) {
          await mockApi.db.updateWallet(request.user_id, wallet.balance + request.amount);
          await mockApi.db.updateUser(request.user_id, { is_active: true });
        }
      }

      // If it's a withdrawal or sell and rejected, refund the balance
      if ((request.type === 'withdraw' || request.type === 'sell') && status === 'rejected') {
        const wallet = await mockApi.db.getWallet(request.user_id);
        if (wallet) {
          await mockApi.db.updateWallet(request.user_id, wallet.balance + request.amount);
        }
      }

      showStatus(`Order ${status.toUpperCase()}`);
      await fetchData();
    } catch (e) {
      console.error("Approval error:", e);
      showStatus("Update failed", "error");
    } finally {
      setProcessing(null);
    }
  };

  const filteredUsers = users.filter(u => 
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (u.id || '').includes(searchQuery)
  );

  // Analytics Calculations
  const totalBalance = users.reduce((acc, u) => acc + (u.wallets?.[0]?.balance || 0), 0);
  const pendingExchanges = exchangeRequests.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-8 animate-in slide-in-from-top duration-700 pb-20">
      {statusMsg && (
        <div className={`fixed top-24 right-6 z-50 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl animate-in fade-in slide-in-from-right-4 ${
          statusMsg.type === 'success' ? 'bg-primary text-darker' : 'bg-red-500 text-white'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <span className="text-secondary">{BRAND_CONFIG.shortName}</span> COMMAND
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">{BRAND_CONFIG.description}</p>
        </div>
        
        <div className="flex gap-1 bg-darker p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar w-full xl:w-auto">
          {[
            { id: 'analytics', label: 'Analytics' },
            { id: 'users', label: 'Agents' },
            { id: 'exchanger', label: 'Exchange' },
            { id: 'deposits', label: 'Deposits' },
            { id: 'tasks', label: 'Tasks' },
            { id: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                activeSubTab === tab.id ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics View */}
      {activeSubTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Total Agents', value: users.length, icon: '👥', color: 'text-primary' },
              { label: 'System Liquidity', value: `$${totalBalance.toFixed(2)}`, icon: '💰', color: 'text-green-400' },
              { label: 'Pending P2P', value: pendingExchanges, icon: '⏳', color: 'text-amber-500' },
              { label: 'Active Tasks', value: tasks.length, icon: '⚡', color: 'text-secondary' },
            ].map((stat, i) => (
              <div key={i} className="glass p-6 rounded-[2rem] border-white/5 relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-125 transition-transform">{stat.icon}</div>
                <h3 className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">{stat.label}</h3>
                <p className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="glass rounded-[2.5rem] p-8 border-white/5">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 border-b border-white/5 pb-4">Real-time Activity Log</h3>
            <div className="space-y-4">
               {transactions.length === 0 ? (
                 <p className="text-slate-600 italic text-center py-10 font-bold uppercase tracking-widest text-[10px]">No recent data stream...</p>
               ) : (
                 transactions.map(tx => (
                   <div key={tx.id} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest bg-white/5 p-4 rounded-2xl">
                     <div className="flex gap-4 items-center">
                        <span className="text-secondary">TXID: {tx.id.slice(0,8)}</span>
                        <span className="text-slate-500">{tx.type} protocol</span>
                     </div>
                     <div className="flex gap-6 items-center">
                        <span className="text-primary">+${tx.amount} USDT</span>
                        <span className="text-green-500">{tx.status}</span>
                     </div>
                   </div>
                 ))
               )}
            </div>
          </div>
        </div>
      )}

      {/* Users View */}
      {activeSubTab === 'users' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="glass rounded-[2.5rem] overflow-hidden border-white/5">
            <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
              <h3 className="text-xl font-black uppercase italic">Agent Database</h3>
              <input 
                type="text" 
                placeholder="Filter by Node ID / Email..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80 bg-slate-900 border border-white/10 rounded-2xl px-6 py-3 text-xs outline-none focus:ring-2 ring-secondary transition-all"
              />
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Profile</th>
                    <th className="px-8 py-5">Vault Balance</th>
                    <th className="px-8 py-5">Access Level</th>
                    <th className="px-8 py-5 text-right">Protocol Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm ${u.is_blocked ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
                            {(u.email || 'A')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-white">{u.email}</p>
                              <span className={`w-2 h-2 rounded-full ${u.is_active ? 'bg-primary animate-pulse' : 'bg-red-500'}`} title={u.is_active ? 'Active' : 'Inactive'}></span>
                            </div>
                            <p className="text-[9px] text-slate-500 font-mono tracking-tighter uppercase">ID: {u.id.slice(0, 20)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-primary font-black">$</span>
                          <input 
                            type="number" 
                            defaultValue={u.wallets?.[0]?.balance || 0}
                            onBlur={(e) => handleUpdateBalance(u.id, e.target.value)}
                            className="bg-transparent border-b border-white/5 focus:border-primary outline-none w-24 text-lg font-black text-white"
                          />
                        </div>
                      </td>
                      <td className="px-8 py-5">
                         <button 
                          onClick={() => handleToggleRole(u.id, u.role)}
                          className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${
                            u.role?.toLowerCase() === 'admin' ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-slate-800/50 border-white/5 text-slate-400'
                          }`}
                         >
                           {u.role}
                         </button>
                      </td>
                      <td className="px-8 py-5 text-right space-x-3">
                        <button 
                          onClick={() => setGiftUserId(u.id)}
                          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-darker transition-all"
                        >
                          Gift
                        </button>
                        <button 
                          onClick={() => handleToggleBlock(u.id, u.is_blocked)}
                          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                            u.is_blocked ? 'bg-green-500 text-darker shadow-lg shadow-green-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:scale-105'
                          }`}
                        >
                          {u.is_blocked ? 'Restore' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/5">
              {filteredUsers.map((u) => (
                <div key={u.id} className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${u.is_blocked ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
                        {(u.email || 'A')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{u.email}</p>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-primary animate-pulse' : 'bg-red-500'}`}></span>
                        </div>
                        <p className="text-[8px] text-slate-500 font-mono uppercase">ID: {u.id.slice(0, 12)}...</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleToggleRole(u.id, u.role)}
                      className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                        u.role?.toLowerCase() === 'admin' ? 'bg-secondary/10 border-secondary text-secondary' : 'bg-slate-800/50 border-white/5 text-slate-400'
                      }`}
                    >
                      {u.role}
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl">
                    <div>
                      <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Vault Balance</p>
                      <div className="flex items-center gap-1">
                        <span className="text-primary font-black text-sm">$</span>
                        <input 
                          type="number" 
                          defaultValue={u.wallets?.[0]?.balance || 0}
                          onBlur={(e) => handleUpdateBalance(u.id, e.target.value)}
                          className="bg-transparent border-none outline-none w-20 text-lg font-black text-white"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setGiftUserId(u.id)}
                        className="p-3 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      >
                        Gift
                      </button>
                      <button 
                        onClick={() => handleToggleBlock(u.id, u.is_blocked)}
                        className={`p-3 rounded-xl ${u.is_blocked ? 'bg-green-500 text-darker' : 'bg-red-500 text-white'}`}
                      >
                        {u.is_blocked ? '✓' : '✕'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gift Modal */}
      {giftUserId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-darker/80 backdrop-blur-md animate-in fade-in">
          <div className="glass w-full max-w-md p-8 rounded-[3rem] border-amber-500/20 shadow-2xl shadow-amber-500/10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500/20 rounded-3xl mx-auto flex items-center justify-center text-3xl mb-4">🎁</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Gift USDT Protocol</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Transferring to Node ID: {giftUserId.slice(0, 12)}...</p>
            </div>
            
            <form onSubmit={handleGiftUSDT} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gift Amount (USDT)</label>
                <div className="relative">
                  <span className="absolute left-6 top-1/2 -translate-y-1/2 text-primary font-black">$</span>
                  <input 
                    type="number" 
                    autoFocus
                    value={giftAmount}
                    onChange={(e) => setGiftAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border-none rounded-2xl py-4 pl-12 pr-6 text-xl font-black text-white outline-none ring-1 ring-white/5 focus:ring-amber-500"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setGiftUserId(null)}
                  className="flex-1 py-4 bg-white/5 text-slate-400 font-black rounded-2xl uppercase text-[11px] tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-2 py-4 bg-amber-500 text-darker font-black rounded-2xl uppercase text-[11px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-amber-500/20"
                >
                  Confirm Gift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Exchange View (P2P) */}
      {activeSubTab === 'exchanger' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in">
          {exchangeRequests.filter(r => r.type === 'buy' || r.type === 'sell').map((ex) => (
            <div key={ex.id} className="glass p-8 rounded-[3rem] border-white/5 relative overflow-hidden">
               <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[10px] font-black uppercase tracking-[0.2em] ${
                ex.type === 'buy' ? 'bg-primary text-darker' : 'bg-secondary text-white'
              }`}>
                {ex.type} Protocol
              </div>
              <div className="mb-8">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-2">Requested Volume</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-white">${ex.amount}</span>
                  <span className="text-primary font-black text-xs uppercase tracking-[0.2em]">USDT</span>
                  <span className="mx-2 text-slate-700 text-2xl">/</span>
                  <span className="text-2xl font-bold text-slate-400">₹{ex.inr_amount}</span>
                </div>
                <p className="text-[10px] text-slate-600 font-bold uppercase mt-4">Agent ID: {ex.user_id}</p>
                {ex.utr_number && (
                  <div className="mt-4 p-4 bg-primary/10 rounded-2xl border border-primary/20">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">UTR / Transaction ID</p>
                    <p className="text-xl font-black text-white tracking-widest">{ex.utr_number}</p>
                  </div>
                )}
                {ex.user_upi && (
                  <div className="mt-4 p-4 bg-secondary/10 rounded-2xl border border-secondary/20">
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">User UPI ID (Pay Here)</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-black text-white">{ex.user_upi}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(ex.user_upi!);
                          showStatus('User UPI Copied!');
                        }}
                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => handleApproveExchange(ex.id, 'approved')}
                  disabled={ex.status !== 'pending' || processing === ex.id}
                  className="flex-1 py-4 bg-green-500 disabled:bg-slate-800 disabled:text-slate-600 text-darker font-black rounded-2xl uppercase text-[11px] tracking-widest hover:scale-[1.02] transition-all shadow-xl shadow-green-500/10"
                >
                  {processing === ex.id ? 'Processing...' : (ex.status === 'approved' ? 'Processed' : 'Authorize Order')}
                </button>
                {ex.status === 'pending' && (
                  <button 
                    onClick={() => handleApproveExchange(ex.id, 'rejected')}
                    className="flex-1 py-4 bg-white/5 text-red-500 font-black rounded-2xl uppercase text-[11px] tracking-widest hover:bg-red-500 hover:text-white transition-all"
                  >
                    Deny
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Deposits & Withdrawals View */}
      {activeSubTab === 'deposits' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="glass rounded-[2.5rem] overflow-hidden border-white/5">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase italic">Protocol Transfers</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Stream</span>
                </div>
              </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Type</th>
                    <th className="px-8 py-5">Volume (USDT)</th>
                    <th className="px-8 py-5">Agent / Node</th>
                    <th className="px-8 py-5">Network Details</th>
                    <th className="px-8 py-5 text-right">Authorization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {exchangeRequests.filter(r => r.type === 'deposit' || r.type === 'withdraw').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs italic">No active transfer protocols detected...</p>
                      </td>
                    </tr>
                  ) : (
                    exchangeRequests.filter(r => r.type === 'deposit' || r.type === 'withdraw').map((dep) => (
                      <tr key={dep.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${dep.type === 'deposit' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                              {dep.type === 'deposit' ? '↓' : '↑'}
                            </div>
                            <span className={`font-black uppercase text-[10px] tracking-widest ${dep.type === 'deposit' ? 'text-primary' : 'text-secondary'}`}>
                              {dep.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xl font-black text-white">${dep.amount}</span>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-slate-300">{dep.user_id}</p>
                          <p className="text-[8px] text-slate-600 font-mono uppercase">Node ID: {dep.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="space-y-1">
                            {dep.network && <p className="text-[9px] text-slate-500 font-black uppercase tracking-tighter">{dep.network} Protocol</p>}
                            {dep.hash_id && <p className="text-[8px] text-slate-600 font-mono truncate w-32" title={dep.hash_id}>HASH: {dep.hash_id}</p>}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {dep.status === 'pending' ? (
                              <>
                                <button 
                                  onClick={() => handleApproveExchange(dep.id, 'rejected')}
                                  disabled={processing === dep.id}
                                  className="px-4 py-2 rounded-xl bg-white/5 text-red-500 font-black uppercase text-[9px] tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                >
                                  Deny
                                </button>
                                <button 
                                  onClick={() => handleApproveExchange(dep.id, 'approved')}
                                  disabled={processing === dep.id}
                                  className="px-6 py-2 rounded-xl bg-green-500 text-darker font-black uppercase text-[9px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-green-500/20"
                                >
                                  {processing === dep.id ? 'Wait...' : 'Authorize'}
                                </button>
                              </>
                            ) : (
                              <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${dep.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {dep.status}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-white/5">
              {exchangeRequests.filter(r => r.type === 'deposit' || r.type === 'withdraw').length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-slate-600 font-black uppercase tracking-widest text-[10px]">No active protocols...</p>
                </div>
              ) : (
                exchangeRequests.filter(r => r.type === 'deposit' || r.type === 'withdraw').map((dep) => (
                  <div key={dep.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${dep.type === 'deposit' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                          {dep.type === 'deposit' ? '↓' : '↑'}
                        </div>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${dep.type === 'deposit' ? 'text-primary' : 'text-secondary'}`}>{dep.type}</p>
                          <p className="text-2xl font-black text-white">${dep.amount}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${dep.status === 'approved' ? 'bg-green-500/10 text-green-500' : dep.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                        {dep.status}
                      </span>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-2xl space-y-2">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500 uppercase font-black">Agent</span>
                        <span className="text-slate-300 font-bold">{dep.user_id}</span>
                      </div>
                      {dep.network && (
                        <div className="flex justify-between text-[9px]">
                          <span className="text-slate-500 uppercase font-black">Network</span>
                          <span className="text-slate-300 font-bold">{dep.network}</span>
                        </div>
                      )}
                      {dep.hash_id && (
                        <div className="flex flex-col gap-1 pt-1 border-t border-white/5">
                          <span className="text-[8px] text-slate-500 uppercase font-black">Hash ID</span>
                          <span className="text-[8px] text-slate-400 font-mono break-all">{dep.hash_id}</span>
                        </div>
                      )}
                    </div>

                    {dep.status === 'pending' && (
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleApproveExchange(dep.id, 'rejected')}
                          disabled={processing === dep.id}
                          className="flex-1 py-3 bg-white/5 text-red-500 font-black rounded-xl uppercase text-[10px] tracking-widest"
                        >
                          Deny
                        </button>
                        <button 
                          onClick={() => handleApproveExchange(dep.id, 'approved')}
                          disabled={processing === dep.id}
                          className="flex-2 py-3 bg-green-500 text-darker font-black rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-green-500/20"
                        >
                          {processing === dep.id ? 'Wait...' : 'Authorize'}
                        </button>
                      </div>
                    )}
                  </div>
                )
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tasks View */}
      {activeSubTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
          <div className="lg:col-span-1 glass p-8 rounded-[3rem] border-secondary/20 h-fit sticky top-24">
             <h3 className="text-lg font-black uppercase italic mb-6 text-secondary">Deploy New Task</h3>
             <form onSubmit={handleAddTask} className="space-y-5">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Task Identifier</label>
                   <input required value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} placeholder="e.g. Subscribe Youtube" className="w-full bg-slate-900 border-none rounded-2xl py-3 px-5 text-sm outline-none ring-1 ring-white/5 focus:ring-secondary" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mission Description</label>
                   <textarea required value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} placeholder="Task details..." className="w-full bg-slate-900 border-none rounded-2xl py-3 px-5 text-sm outline-none ring-1 ring-white/5 focus:ring-secondary h-24" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Reward (USDT)</label>
                     <input required type="number" step="0.1" value={newTask.reward} onChange={e => setNewTask({...newTask, reward: parseFloat(e.target.value)})} className="w-full bg-slate-900 border-none rounded-2xl py-3 px-5 text-sm outline-none ring-1 ring-white/5 focus:ring-secondary" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">External Link</label>
                     <input required value={newTask.link} onChange={e => setNewTask({...newTask, link: e.target.value})} placeholder="https://..." className="w-full bg-slate-900 border-none rounded-2xl py-3 px-5 text-sm outline-none ring-1 ring-white/5 focus:ring-secondary" />
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-secondary text-white font-black rounded-2xl uppercase tracking-[0.2em] shadow-lg shadow-secondary/20 hover:scale-[1.02] transition-all">Broadcast Task</button>
             </form>
          </div>
          
          <div className="lg:col-span-2 space-y-4">
             <h3 className="text-xs font-black uppercase tracking-widest mb-4">Live Task Feed</h3>
             {tasks.map(t => (
               <div key={t.id} className="glass p-6 rounded-3xl flex justify-between items-center group border-white/5">
                 <div>
                   <h4 className="font-bold text-white text-lg">{t.title}</h4>
                   <p className="text-slate-500 text-xs">{t.description}</p>
                   <p className="text-primary font-black text-[10px] mt-2 uppercase">Reward: ${t.reward} USDT</p>
                 </div>
                 <button className="p-4 rounded-2xl bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                   </svg>
                 </button>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* Settings View */}
      {activeSubTab === 'settings' && (
        <div className="max-w-3xl mx-auto animate-in zoom-in duration-500">
           <div className="glass p-10 rounded-[3rem] border-amber-500/20 space-y-10">
              <div className="text-center">
                 <h3 className="text-2xl font-black uppercase text-amber-500 mb-2">System Parameters</h3>
                 <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Global P2P & Network Config</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 bg-green-500 rounded-full"></span> Buy Rate (USDT/INR)
                    </label>
                    <div className="relative">
                       <input type="number" value={buyRate} onChange={e => setBuyRate(parseFloat(e.target.value))} className="w-full bg-slate-900 border-none rounded-3xl py-6 px-8 text-4xl font-black outline-none ring-1 ring-white/5 focus:ring-amber-500" />
                       <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 font-black">₹</span>
                    </div>
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-2 h-2 bg-red-500 rounded-full"></span> Sell Rate (USDT/INR)
                    </label>
                    <div className="relative">
                       <input type="number" value={sellRate} onChange={e => setSellRate(parseFloat(e.target.value))} className="w-full bg-slate-900 border-none rounded-3xl py-6 px-8 text-4xl font-black outline-none ring-1 ring-white/5 focus:ring-amber-500" />
                       <span className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-600 font-black">₹</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Admin UPI ID</label>
                    <input 
                      type="text" 
                      value={adminUpi} 
                      onChange={e => setAdminUpi(e.target.value)} 
                      placeholder="nexus@upi"
                      className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-1 ring-white/5 focus:ring-amber-500" 
                    />
                 </div>
                 <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Admin QR Code URL / Base64</label>
                    <input 
                      type="text" 
                      value={adminQr} 
                      onChange={e => setAdminQr(e.target.value)} 
                      placeholder="https://... or data:image/png;base64,..."
                      className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-1 ring-white/5 focus:ring-amber-500" 
                    />
                 </div>
              </div>

              <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10">
                 <p className="text-[10px] font-bold text-amber-500 uppercase leading-relaxed tracking-wider">
                    Note: Adjusting these rates will immediately affect the P2P Exchanger for all users. System updates take 3-5 seconds to propagate across all edge nodes.
                 </p>
              </div>

              <button onClick={handleUpdateRates} className="w-full py-5 bg-amber-500 text-darker font-black rounded-[2rem] uppercase tracking-[0.3em] shadow-2xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                 Apply Global Updates
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
