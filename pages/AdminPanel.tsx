
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { mockApi } from '../lib/mockApi';
import { User, Wallet, ExchangerRequest, Task, Transaction } from '../types';
import { BRAND_CONFIG } from '../brandConfig';

interface AdminPanelProps {
  user: User;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
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
  const [adminUpi, setAdminUpi] = useState('spiral@upi');
  const [adminQr, setAdminQr] = useState('');
  const [adminAddressTrc20, setAdminAddressTrc20] = useState('TYL5Hw7hQ8w7X9...trc20_demo');
  const [adminAddressBep20, setAdminAddressBep20] = useState('0x7hQ8w7X9...bep20_demo');
  const [adminAddressErc20, setAdminAddressErc20] = useState('0xERC20...erc20_demo');
  const [marqueeText, setMarqueeText] = useState('');
  const [telegramLink, setTelegramLink] = useState('https://t.me/cryptospiral');
  const [minDeposit, setMinDeposit] = useState(10);
  const [minWithdrawal, setMinWithdrawal] = useState(20);
  const [maxWithdrawal, setMaxWithdrawal] = useState(1000);

  const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [adminNewPassword, setAdminNewPassword] = useState('');

  // New Task Form State
  const [newTask, setNewTask] = useState({ title: '', description: '', reward: 0, link: '' });

  const [processing, setProcessing] = useState<string | null>(null);
  const [giftAmount, setGiftAmount] = useState<string>('');
  const [giftUserId, setGiftUserId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteChecked, setDeleteChecked] = useState(false);
  const [purgeConfirmText, setPurgeConfirmText] = useState('');
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [userOffset, setUserOffset] = useState(0);
  const [exOffset, setExOffset] = useState(0);
  const PAGE_SIZE = 50;

  const fetchData = async () => {
    setLoading(true);
    try {
      setUserOffset(0);
      setExOffset(0);
      const userData = await mockApi.db.getAllUsers(PAGE_SIZE, 0);
      setUsers(userData as any);

      const exData = await mockApi.db.getExchangeRequests();
      setExchangeRequests(exData as any);

      const taskData = await mockApi.db.getTasks();
      setTasks(taskData as any);

      // Fetch global transactions for activity log
      try {
        const txData = await mockApi.db.getAllTransactions(20);
        setTransactions(txData as any);
      } catch (txErr) {
        console.error("Failed to fetch transactions", txErr);
      }

      const settings = await mockApi.db.getSettings();
      if (settings) {
        setBuyRate(settings.usdt_buy_rate || 92);
        setSellRate(settings.usdt_sell_rate || 88);
        setAdminUpi(settings.admin_upi || 'spiral@upi');
        setAdminQr(settings.admin_qr || '');
        setAdminAddressTrc20(settings.admin_address_trc20 || 'TYL5Hw7hQ8w7X9...trc20_demo');
        setAdminAddressBep20(settings.admin_address_bep20 || '0x7hQ8w7X9...bep20_demo');
        setAdminAddressErc20(settings.admin_address_erc20 || '0xERC20...erc20_demo');
        setMarqueeText(settings.marquee_text || '⚡ NODE ACTIVE: SYSTEM ONLINE | 💎 USDT/INR: ₹92.45 (+0.4%) | 🔥 NETWORK VOLUME: $4.2M | 🚀 NEW POOL 5 ENTRY FROM ID #8291');
        setTelegramLink(settings.telegram_link || 'https://t.me/cryptospiral');
        setMinDeposit(settings.min_deposit || 10);
        setMinWithdrawal(settings.min_withdrawal || 20);
        setMaxWithdrawal(settings.max_withdrawal || 1000);
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
        admin_qr: adminQr,
        admin_address_trc20: adminAddressTrc20,
        admin_address_bep20: adminAddressBep20,
        admin_address_erc20: adminAddressErc20,
        marquee_text: marqueeText,
        telegram_link: telegramLink,
        min_deposit: minDeposit,
        min_withdrawal: minWithdrawal,
        max_withdrawal: maxWithdrawal
      });
      showStatus("System Rates Updated Successfully");
    } catch (e: any) {
      console.error("Rate update error:", e);
      showStatus(e.message || "Failed to update rates", "error");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPasswordUserId || !newPassword) return;
    try {
      await mockApi.db.updateUserPassword(resetPasswordUserId, newPassword);
      showStatus("Password Reset Successfully");
      setResetPasswordUserId(null);
      setNewPassword('');
    } catch (err: any) {
      showStatus(err.message || "Failed to reset password", "error");
    }
  };

  const handleAdminPasswordChange = async () => {
    if (!adminNewPassword) return;
    try {
      await mockApi.db.updateUserPassword(user.id, adminNewPassword);
      showStatus("Admin Password Updated Successfully");
      setAdminNewPassword('');
    } catch (err: any) {
      showStatus(err.message || "Failed to update admin password", "error");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!deleteChecked) return;
    try {
      await mockApi.db.deleteUser(userId);
      showStatus("Agent Data Purged Successfully");
      setDeleteConfirmId(null);
      setDeleteChecked(false);
      fetchData();
    } catch (err: any) {
      showStatus(err.message || "Failed to delete user", "error");
    }
  };

  const handlePurgeAllData = async () => {
    if (purgeConfirmText !== 'PURGE') return;
    setLoading(true);
    try {
      await mockApi.db.purgeAllData();
      showStatus("System Reset Successfully - All Data Purged");
      setShowPurgeModal(false);
      setPurgeConfirmText('');
      fetchData();
    } catch (err: any) {
      showStatus(err.message || "Failed to purge data", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMoreUsers = async () => {
    const nextOffset = userOffset + PAGE_SIZE;
    try {
      const moreUsers = await mockApi.db.getAllUsers(PAGE_SIZE, nextOffset);
      if (moreUsers.length > 0) {
        setUsers(prev => [...prev, ...moreUsers as any]);
        setUserOffset(nextOffset);
      } else {
        showStatus("No more agents to load", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproveExchange = async (requestId: string, status: 'approved' | 'rejected') => {
    if (processing) return;
    setProcessing(requestId);
    try {
      // Re-fetch the latest status from DB to avoid stale state issues
      const latestRequest = await mockApi.db.getExchangeRequest(requestId);
      
      if (!latestRequest || latestRequest.status !== 'pending') {
        showStatus("Request already processed", "error");
        await fetchData();
        setProcessing(null);
        return;
      }

      // Update the request status in DB
      await mockApi.db.updateExchangeRequest(requestId, { status });

      // If it's a deposit or buy and approved, add balance to user and activate account
      if ((latestRequest.type === 'deposit' || latestRequest.type === 'buy') && status === 'approved') {
        try {
          await mockApi.db.activateUser(latestRequest.user_id, latestRequest.amount);
        } catch (activateErr: any) {
          console.error("Activation failed after status update:", activateErr);
          showStatus(`Status updated, but activation failed: ${activateErr.message}`, "error");
          await fetchData();
          setProcessing(null);
          return;
        }
      }

      // If it's a withdrawal or sell and rejected, refund the balance
      if ((latestRequest.type === 'withdraw' || latestRequest.type === 'sell') && status === 'rejected') {
        const wallet = await mockApi.db.getWallet(latestRequest.user_id);
        if (wallet) {
          await mockApi.db.updateWallet(latestRequest.user_id, wallet.balance + latestRequest.amount);
        }
      }

      showStatus(`Order ${status.toUpperCase()}`);
      await fetchData();
    } catch (e: any) {
      console.error("Approval error:", e);
      showStatus(`Update failed: ${e.message || "Unknown error"}`, "error");
      await fetchData();
    } finally {
      setProcessing(null);
    }
  };

  const handleManualActivate = async (userId: string) => {
    if (processing) return;
    setProcessing(userId);
    try {
      await mockApi.db.activateUser(userId, 10);
      showStatus("User Activated Successfully");
      await fetchData();
    } catch (e: any) {
      console.error("Manual activation error:", e);
      showStatus(`Activation failed: ${e.message}`, "error");
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
            <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
              <h3 className="text-xs font-black uppercase tracking-widest">Real-time Activity Log</h3>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Live Feed</span>
              </div>
            </div>
            <div className="space-y-3">
               {transactions.length === 0 ? (
                 <p className="text-slate-600 italic text-center py-10 font-bold uppercase tracking-widest text-[10px]">No recent data stream...</p>
               ) : (
                 transactions.map(tx => {
                   const txUser = users.find(u => u.id === tx.user_id);
                   const timeStr = new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                   
                   return (
                     <div key={tx.id} className="flex flex-col md:flex-row justify-between md:items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5 hover:bg-white/[0.08] transition-all group">
                       <div className="flex flex-col gap-1">
                         <div className="flex items-center gap-3">
                           <span className="text-secondary font-black text-[11px]">TXID: {tx.id.slice(0,8)}</span>
                           <span className="text-slate-500 text-[9px] font-bold">{timeStr}</span>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-white text-[10px] font-black uppercase tracking-tight">
                             {txUser?.email || tx.user_id.slice(0, 12) + '...'}
                           </span>
                           <span className="text-slate-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded-md border border-white/5">
                             {tx.type} protocol
                           </span>
                           {tx.income_level && (
                             <span className="text-primary text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-primary/10 rounded-md border border-primary/20">
                               Level {tx.income_level}
                             </span>
                           )}
                         </div>
                       </div>
                       <div className="flex justify-between md:justify-end items-center gap-6">
                         <div className="text-right">
                           <p className="text-primary font-black text-sm">+$ {tx.amount.toFixed(2)} USDT</p>
                           <p className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em]">Volume Sync</p>
                         </div>
                         <div className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${
                           tx.status === 'completed' ? 'bg-green-500/10 border-green-500/20 text-green-500' : 
                           tx.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                           'bg-red-500/10 border-red-500/20 text-red-500'
                         }`}>
                           {tx.status}
                         </div>
                       </div>
                     </div>
                   );
                 })
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
                          onClick={() => setResetPasswordUserId(u.id)}
                          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-blue-500/10 text-blue-500 border border-blue-500/20 hover:bg-blue-500 hover:text-white transition-all"
                        >
                          Reset Pass
                        </button>
                        {!u.is_active && (
                          <button 
                            onClick={() => handleManualActivate(u.id)}
                            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-darker transition-all"
                          >
                            Activate
                          </button>
                        )}
                        <button 
                          onClick={() => handleToggleBlock(u.id, u.is_blocked)}
                          className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                            u.is_blocked ? 'bg-green-500 text-darker shadow-lg shadow-green-500/20' : 'bg-red-500 text-white shadow-lg shadow-red-500/20 hover:scale-105'
                          }`}
                        >
                          {u.is_blocked ? 'Restore' : 'Suspend'}
                        </button>
                        <button 
                          onClick={() => setDeleteConfirmId(u.id)}
                          className="px-4 py-2 rounded-xl text-[10px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-600 hover:text-white transition-all"
                        >
                          Delete
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
                        onClick={() => setResetPasswordUserId(u.id)}
                        className="p-3 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleToggleBlock(u.id, u.is_blocked)}
                        className={`p-3 rounded-xl ${u.is_blocked ? 'bg-green-500 text-darker' : 'bg-red-500 text-white'}`}
                      >
                        {u.is_blocked ? '✓' : '✕'}
                      </button>
                      <button 
                        onClick={() => setDeleteConfirmId(u.id)}
                        className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-6 border-t border-white/5 flex justify-center">
              <button 
                onClick={handleLoadMoreUsers}
                className="px-8 py-3 rounded-2xl bg-white/5 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
              >
                Load More Agents
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetPasswordUserId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-darker/80 backdrop-blur-md animate-in fade-in">
          <div className="glass w-full max-w-md p-8 rounded-[3rem] border-blue-500/20 shadow-2xl shadow-blue-500/10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-500/20 rounded-3xl mx-auto flex items-center justify-center text-3xl mb-4">🔑</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Reset Agent Password</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">Setting new credentials for Node ID: {resetPasswordUserId.slice(0, 12)}...</p>
            </div>
            
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">New Password</label>
                <input 
                  type="text" 
                  autoFocus
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-1 ring-white/5 focus:ring-blue-500"
                />
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => {
                    setResetPasswordUserId(null);
                    setNewPassword('');
                  }}
                  className="flex-1 py-4 bg-white/5 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all"
                >
                  Abort
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-500 text-white font-black rounded-2xl uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-darker/90 backdrop-blur-xl animate-in fade-in">
          <div className="glass w-full max-w-md p-8 rounded-[3rem] border-red-500/20 shadow-2xl shadow-red-500/10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-red-500/20 rounded-3xl mx-auto flex items-center justify-center text-3xl mb-4">⚠️</div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Purge Agent Data?</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-2">This action is irreversible. All wallet data and history will be lost for Node: {deleteConfirmId.slice(0, 12)}...</p>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                <input 
                  type="checkbox" 
                  id="confirm-delete"
                  checked={deleteChecked}
                  onChange={(e) => setDeleteChecked(e.target.checked)}
                  className="w-5 h-5 rounded border-white/10 bg-slate-900 text-red-500 focus:ring-red-500"
                />
                <label htmlFor="confirm-delete" className="text-[10px] font-bold text-slate-400 uppercase cursor-pointer select-none">
                  I understand that this data cannot be recovered.
                </label>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setDeleteConfirmId(null);
                    setDeleteChecked(false);
                  }}
                  className="flex-1 py-4 bg-white/5 text-slate-400 font-black rounded-2xl uppercase text-[11px] tracking-widest hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteUser(deleteConfirmId)}
                  disabled={!deleteChecked}
                  className="flex-2 py-4 bg-red-500 disabled:opacity-30 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-red-500/20"
                >
                  Purge Data
                </button>
              </div>
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
        <div className="space-y-4 animate-in fade-in">
          <div className="glass rounded-[2.5rem] overflow-hidden border-white/5">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-xl font-black uppercase italic">P2P Exchange Protocols</h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live P2P Stream</span>
                </div>
              </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="bg-slate-900/50 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-5">Protocol</th>
                    <th className="px-8 py-5">USDT / INR Volume</th>
                    <th className="px-8 py-5">Agent / Node</th>
                    <th className="px-8 py-5">Payment Details</th>
                    <th className="px-8 py-5 text-right">Authorization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {exchangeRequests.filter(r => r.type === 'buy' || r.type === 'sell').length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-20 text-center">
                        <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs italic">No active P2P protocols detected...</p>
                      </td>
                    </tr>
                  ) : (
                    exchangeRequests.filter(r => r.type === 'buy' || r.type === 'sell').map((ex) => (
                      <tr key={ex.id} className="hover:bg-white/5 transition-colors group">
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs ${ex.type === 'buy' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                              {ex.type === 'buy' ? 'B' : 'S'}
                            </div>
                            <span className={`font-black uppercase text-[10px] tracking-widest ${ex.type === 'buy' ? 'text-primary' : 'text-secondary'}`}>
                              {ex.type}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-xl font-black text-white">${ex.amount} USDT</span>
                            <span className="text-[10px] font-bold text-slate-500">₹{ex.inr_amount} INR</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs font-bold text-slate-300">{ex.user_id}</p>
                          <p className="text-[8px] text-slate-600 font-mono uppercase">Node ID: {ex.id.slice(0, 8)}</p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="space-y-1">
                            {ex.utr_number && (
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] text-slate-500 uppercase font-black">UTR:</span>
                                <span className="text-[10px] font-mono text-white tracking-widest">{ex.utr_number}</span>
                              </div>
                            )}
                            {ex.user_upi && (
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] text-slate-500 uppercase font-black">UPI:</span>
                                <span className="text-[10px] font-mono text-white">{ex.user_upi}</span>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(ex.user_upi!);
                                    showStatus('User UPI Copied!');
                                  }}
                                  className="p-1 bg-white/5 rounded hover:bg-white/10 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex justify-end gap-2">
                            {ex.status === 'pending' ? (
                              <>
                                <button 
                                  onClick={() => handleApproveExchange(ex.id, 'rejected')}
                                  disabled={processing === ex.id}
                                  className="px-4 py-2 rounded-xl bg-white/5 text-red-500 font-black uppercase text-[9px] tracking-widest hover:bg-red-500 hover:text-white transition-all"
                                >
                                  Deny
                                </button>
                                <button 
                                  onClick={() => handleApproveExchange(ex.id, 'approved')}
                                  disabled={processing === ex.id}
                                  className="px-6 py-2 rounded-xl bg-green-500 text-darker font-black uppercase text-[9px] tracking-widest hover:scale-105 transition-all shadow-lg shadow-green-500/20"
                                >
                                  {processing === ex.id ? 'Wait...' : 'Authorize'}
                                </button>
                              </>
                            ) : (
                              <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${ex.status === 'approved' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                {ex.status}
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
              {exchangeRequests.filter(r => r.type === 'buy' || r.type === 'sell').length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-slate-600 font-black uppercase tracking-widest text-[10px]">No active P2P protocols...</p>
                </div>
              ) : (
                exchangeRequests.filter(r => r.type === 'buy' || r.type === 'sell').map((ex) => (
                  <div key={ex.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm ${ex.type === 'buy' ? 'bg-primary/20 text-primary' : 'bg-secondary/20 text-secondary'}`}>
                          {ex.type === 'buy' ? 'B' : 'S'}
                        </div>
                        <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${ex.type === 'buy' ? 'text-primary' : 'text-secondary'}`}>{ex.type}</p>
                          <p className="text-2xl font-black text-white">${ex.amount}</p>
                          <p className="text-[10px] font-bold text-slate-500">₹{ex.inr_amount}</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${ex.status === 'approved' ? 'bg-green-500/10 text-green-500' : ex.status === 'pending' ? 'bg-amber-500/10 text-amber-500' : 'bg-red-500/10 text-red-500'}`}>
                        {ex.status}
                      </span>
                    </div>
                    
                    <div className="bg-white/5 p-4 rounded-2xl space-y-2">
                      <div className="flex justify-between text-[9px]">
                        <span className="text-slate-500 uppercase font-black">Agent</span>
                        <span className="text-slate-300 font-bold">{ex.user_id}</span>
                      </div>
                      {ex.utr_number && (
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-slate-500 uppercase font-black">UTR</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono">{ex.utr_number}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(ex.utr_number!);
                                showStatus('UTR Copied!');
                              }}
                              className="p-1 bg-white/5 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      {ex.user_upi && (
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-slate-500 uppercase font-black">User UPI</span>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-mono">{ex.user_upi}</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(ex.user_upi!);
                                showStatus('User UPI Copied!');
                              }}
                              className="p-1 bg-white/5 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {ex.status === 'pending' && (
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleApproveExchange(ex.id, 'rejected')}
                          disabled={processing === ex.id}
                          className="flex-1 py-3 bg-white/5 text-red-500 font-black rounded-xl uppercase text-[10px] tracking-widest"
                        >
                          Deny
                        </button>
                        <button 
                          onClick={() => handleApproveExchange(ex.id, 'approved')}
                          disabled={processing === ex.id}
                          className="flex-2 py-3 bg-green-500 text-darker font-black rounded-xl uppercase text-[10px] tracking-widest shadow-lg shadow-green-500/20"
                        >
                          {processing === ex.id ? 'Wait...' : 'Authorize'}
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

      {/* Deposits & Withdrawals View */}
      {activeSubTab === 'deposits' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="glass rounded-[2.5rem] overflow-hidden border-white/5">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div className="flex flex-col">
                <h3 className="text-xl font-black uppercase italic">Protocol Transfers</h3>
                <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-1">Direct Deposit & Withdrawal Stream</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={fetchData}
                  className="p-3 rounded-xl bg-white/5 text-primary hover:bg-primary/10 transition-all border border-white/5"
                  title="Refresh Stream"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
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
                          <div className="space-y-2">
                            {dep.network && (
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                dep.network === 'TRC20' ? 'bg-red-500/10 text-red-500' :
                                dep.network === 'BEP20' ? 'bg-amber-500/10 text-amber-500' :
                                'bg-blue-500/10 text-blue-500'
                              }`}>
                                {dep.network}
                              </span>
                            )}
                            {dep.address && (
                              <div className="flex items-center gap-2">
                                <p className="text-[8px] text-slate-400 font-mono truncate w-32" title={dep.address}>ADDR: {dep.address}</p>
                                <button 
                                  onClick={() => {
                                    navigator.clipboard.writeText(dep.address!);
                                    showStatus('Address Copied!');
                                  }}
                                  className="p-1 bg-white/5 rounded hover:bg-white/10 transition-colors"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            )}
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
                        <div className="flex justify-between items-center text-[9px]">
                          <span className="text-slate-500 uppercase font-black">Network</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                            dep.network === 'TRC20' ? 'bg-red-500/10 text-red-500' :
                            dep.network === 'BEP20' ? 'bg-amber-500/10 text-amber-500' :
                            'bg-blue-500/10 text-blue-500'
                          }`}>
                            {dep.network}
                          </span>
                        </div>
                      )}
                      {dep.address && (
                        <div className="flex flex-col gap-1 pt-1 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Wallet Address</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(dep.address!);
                                showStatus('Address Copied!');
                              }}
                              className="p-1 bg-white/5 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
                          <span className="text-[8px] text-slate-400 font-mono break-all">{dep.address}</span>
                        </div>
                      )}
                      {dep.hash_id && (
                        <div className="flex flex-col gap-1 pt-1 border-t border-white/5">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] text-slate-500 uppercase font-black">Hash ID</span>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(dep.hash_id!);
                                showStatus('Hash ID Copied!');
                              }}
                              className="p-1 bg-white/5 rounded"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </button>
                          </div>
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
                      placeholder="spiral@upi"
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

              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-amber-500/20 pb-2">System Marquee Announcement</h4>
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Marquee Text (Dashboard Top Bar)</label>
                    <textarea 
                      value={marqueeText} 
                      onChange={e => setMarqueeText(e.target.value)} 
                      placeholder="Enter announcement text here..."
                      rows={3}
                      className="w-full bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none ring-1 ring-white/5 focus:ring-amber-500 resize-none" 
                    />
                    <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Tip: Use emojis and | separator for a professional look.</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-amber-500/20 pb-2">Transaction Limits (USDT)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Min Deposit</label>
                       <input 
                         type="number" 
                         value={minDeposit} 
                         onChange={e => setMinDeposit(parseFloat(e.target.value))} 
                         className="w-full bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none ring-1 ring-white/5 focus:ring-amber-500" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Min Withdrawal</label>
                       <input 
                         type="number" 
                         value={minWithdrawal} 
                         onChange={e => setMinWithdrawal(parseFloat(e.target.value))} 
                         className="w-full bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none ring-1 ring-white/5 focus:ring-amber-500" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Max Withdrawal</label>
                       <input 
                         type="number" 
                         value={maxWithdrawal} 
                         onChange={e => setMaxWithdrawal(parseFloat(e.target.value))} 
                         className="w-full bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none ring-1 ring-white/5 focus:ring-amber-500" 
                       />
                    </div>
                 </div>
              </div>

              <div className="space-y-6">
                 <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-amber-500/20 pb-2">Deposit Addresses (USDT)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">TRC20 Address</label>
                       <input 
                         type="text" 
                         value={adminAddressTrc20} 
                         onChange={e => setAdminAddressTrc20(e.target.value)} 
                         placeholder="TRC20 Address..."
                         className="w-full bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none ring-1 ring-white/5 focus:ring-amber-500" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">BEP20 Address</label>
                       <input 
                         type="text" 
                         value={adminAddressBep20} 
                         onChange={e => setAdminAddressBep20(e.target.value)} 
                         placeholder="BEP20 Address..."
                         className="w-full bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none ring-1 ring-white/5 focus:ring-amber-500" 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">ERC20 Address</label>
                       <input 
                         type="text" 
                         value={adminAddressErc20} 
                         onChange={e => setAdminAddressErc20(e.target.value)} 
                         placeholder="ERC20 Address..."
                         className="w-full bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none ring-1 ring-white/5 focus:ring-amber-500" 
                       />
                    </div>
                 </div>
              </div>

              <div className="bg-amber-500/5 p-6 rounded-2xl border border-amber-500/10">
                 <p className="text-[10px] font-bold text-amber-500 uppercase leading-relaxed tracking-wider">
                    Note: Adjusting these rates will immediately affect the P2P Exchanger for all users. System updates take 3-5 seconds to propagate across all edge nodes.
                 </p>
              </div>

               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-amber-500/20 pb-2">Support & Community</h4>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Telegram Support Link</label>
                     <input 
                       type="text" 
                       value={telegramLink} 
                       onChange={e => setTelegramLink(e.target.value)} 
                       placeholder="https://t.me/your_channel"
                       className="w-full bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none ring-1 ring-white/5 focus:ring-amber-500" 
                     />
                  </div>
               </div>

               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest border-b border-amber-500/20 pb-2">Admin Security</h4>
                  <div className="space-y-4">
                     <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Change Admin Password</label>
                     <div className="flex gap-4">
                        <input 
                          type="password" 
                          value={adminNewPassword} 
                          onChange={e => setAdminNewPassword(e.target.value)} 
                          placeholder="Enter new admin password..."
                          className="flex-1 bg-slate-900 border-none rounded-xl py-3 px-4 text-xs font-bold outline-none ring-1 ring-white/5 focus:ring-amber-500" 
                        />
                        <button 
                          onClick={handleAdminPasswordChange}
                          className="px-6 py-3 bg-white/5 text-amber-500 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500 hover:text-darker transition-all"
                        >
                          Update
                        </button>
                     </div>
                  </div>
               </div>

               <div className="pt-10 border-t border-white/5 space-y-6">
                  <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-[2.5rem] space-y-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center text-2xl">☢️</div>
                        <div>
                           <h4 className="text-lg font-black text-red-500 uppercase italic">Danger Zone: System Reset</h4>
                           <p className="text-[9px] text-red-500/60 font-black uppercase tracking-widest">Wipe all users, wallets, and transaction history</p>
                        </div>
                     </div>
                     <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">
                        This action will permanently delete all agent data, wallet balances, and transaction logs from the database. This is irreversible.
                     </p>
                     <button 
                        onClick={() => setShowPurgeModal(true)}
                        className="w-full py-4 bg-red-500 text-white font-black rounded-2xl uppercase tracking-[0.2em] shadow-lg shadow-red-500/20 hover:scale-[1.02] transition-all text-xs"
                     >
                        Purge All System Data
                     </button>
                  </div>
               </div>

              <button onClick={handleUpdateRates} className="w-full py-5 bg-amber-500 text-darker font-black rounded-[2rem] uppercase tracking-[0.3em] shadow-2xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all">
                 Apply Global Updates
              </button>
           </div>
        </div>
      )}
      {/* Purge Confirmation Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-darker/95 backdrop-blur-2xl animate-in fade-in">
          <div className="glass w-full max-w-md p-10 rounded-[3.5rem] border-red-500/30 shadow-2xl shadow-red-500/20">
            <div className="text-center mb-10">
              <div className="w-20 h-20 bg-red-500/20 rounded-[2.5rem] mx-auto flex items-center justify-center text-4xl mb-6 animate-pulse">☢️</div>
              <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Total System Wipe</h3>
              <p className="text-red-500/60 text-[10px] font-black uppercase tracking-widest mt-3">All agent nodes and financial records will be destroyed.</p>
              <p className="text-green-500/80 text-[9px] font-black uppercase tracking-widest mt-2">🛡️ Admin accounts are safe and will not be deleted.</p>
              <p className="text-slate-500 text-[8px] font-bold uppercase mt-2 px-4">Note: Database documents will be cleared. Appwrite Auth users must be deleted manually from Appwrite Console if you want to reuse emails immediately.</p>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Type "PURGE" to confirm</label>
                <input 
                  type="text" 
                  value={purgeConfirmText}
                  onChange={(e) => setPurgeConfirmText(e.target.value.toUpperCase())}
                  placeholder="PURGE"
                  className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-xl font-black text-center text-red-500 outline-none ring-2 ring-red-500/20 focus:ring-red-500"
                />
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setShowPurgeModal(false);
                    setPurgeConfirmText('');
                  }}
                  className="flex-1 py-5 bg-white/5 text-slate-400 font-black rounded-2xl uppercase text-[11px] tracking-widest hover:bg-white/10 transition-all"
                >
                  Abort
                </button>
                <button 
                  onClick={handlePurgeAllData}
                  disabled={purgeConfirmText !== 'PURGE' || loading}
                  className="flex-2 py-5 bg-red-500 disabled:opacity-30 text-white font-black rounded-2xl uppercase text-[11px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-red-500/30"
                >
                  {loading ? 'Purging...' : 'Execute Wipe'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
