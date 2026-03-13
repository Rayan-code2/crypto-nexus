
import React, { useState, useMemo } from 'react';
import { User, Wallet, Transaction } from '../types';
import { mockApi } from '../lib/mockApi';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, LineChart, Line 
} from 'recharts';
import { 
  ArrowDownCircle, ArrowUpCircle, RefreshCcw, UserPlus, 
  Zap, Shield, Globe, Cpu 
} from 'lucide-react';

interface DashboardProps {
  user: User;
  wallet: Wallet;
  pools?: any[];
  onNavigate?: (tab: string) => void;
  onExchangerNav?: (subTab: 'topup' | 'withdraw' | 'swap') => void;
  isLive?: boolean;
}

const sparkData = [
  { v: 40 }, { v: 35 }, { v: 55 }, { v: 45 }, { v: 70 }, { v: 65 }, { v: 85 }
];

const Dashboard: React.FC<DashboardProps> = ({ user, wallet, pools = [], onNavigate, onExchangerNav, isLive }) => {
  const [copied, setCopied] = useState(false);
  const [liveBalance, setLiveBalance] = useState(wallet.balance);
  const [livePoolROI, setLivePoolROI] = useState(wallet.pool_roi_earned || 0);
  const [liveWalletROI, setLiveWalletROI] = useState(wallet.wallet_roi_earned || 0);
  const [marqueeText, setMarqueeText] = useState('⚡ NODE ACTIVE: SYSTEM ONLINE | 💎 USDT/INR: ₹92.45 (+0.4%) | 🔥 NETWORK VOLUME: $4.2M | 🚀 NEW POOL 5 ENTRY FROM ID #8291');
  const isAdmin = user.role?.toLowerCase() === 'admin';
  
  const activePool = useMemo(() => 
    pools.find(p => p.status === 'active') || pools[pools.length - 1], 
    [pools]
  );
  
  const referralLink = useMemo(() => 
    `${window.location.origin}/?ref=${user.id}`, 
    [user.id]
  );

  // Fetch settings for marquee
  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settings = await mockApi.db.getSettings();
        if (settings && settings.marquee_text) {
          setMarqueeText(settings.marquee_text);
        }
      } catch (e) {
        console.error("Failed to fetch marquee settings", e);
      }
    };
    fetchSettings();
  }, []);

  // Real-time Balance Growth Ticker (Dual ROI)
  React.useEffect(() => {
    const walletDailyRate = 0.002; // 0.20%
    const poolDailyRate = 0.005; // 0.50% on $10
    
    const walletRatePerSec = walletDailyRate / 86400;
    const poolRatePerSec = poolDailyRate / 86400;
    
    const interval = setInterval(() => {
      const now = Date.now();
      let walletAccrued = 0;
      let poolAccrued = 0;
      
      // Wallet Accrual (Only if balance > 0)
      if (wallet.balance > 0) {
        const lastWalletROI = wallet.last_roi_at ? new Date(wallet.last_roi_at).getTime() : now;
        const walletSecs = (now - lastWalletROI) / 1000;
        walletAccrued = wallet.balance * walletRatePerSec * walletSecs;
      }
      
      // Pool Accrual (Only if user is in Pool 1 and it's active)
      const pool1 = pools.find(p => p.pool_number === 1 && p.status === 'active');
      if (pool1) {
        const lastPoolROI = wallet.last_pool_roi_at ? new Date(wallet.last_pool_roi_at).getTime() : new Date(pool1.created_at).getTime();
        const poolSecs = (now - lastPoolROI) / 1000;
        poolAccrued = 10 * poolRatePerSec * poolSecs; // 0.5% of $10
      }
      
      setLiveBalance(wallet.balance + walletAccrued + poolAccrued);
      setLivePoolROI((wallet.pool_roi_earned || 0) + poolAccrued);
      setLiveWalletROI((wallet.wallet_roi_earned || 0) + walletAccrued);
    }, 1000);

    return () => clearInterval(interval);
  }, [wallet.balance, wallet.last_roi_at, wallet.last_pool_roi_at, user.is_active, pools]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickActions = [
    { icon: <ArrowDownCircle size={20} />, label: 'Topup', color: 'text-primary', glow: 'shadow-primary/20', action: () => onExchangerNav?.('topup') },
    { icon: <ArrowUpCircle size={20} />, label: 'Withdraw', color: 'text-secondary', glow: 'shadow-secondary/20', action: () => onExchangerNav?.('withdraw') },
    { icon: <RefreshCcw size={20} />, label: 'Swap', color: 'text-amber-500', glow: 'shadow-amber-500/20', action: () => onExchangerNav?.('swap') },
    { icon: <UserPlus size={20} />, label: 'Invite', color: 'text-green-500', glow: 'shadow-green-500/20', action: handleCopy },
  ];

  return (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* TICKER - OPTIMIZED WITH FADE EDGES */}
      <div className="w-[calc(100%+2rem)] -mx-4 sm:w-[calc(100%+3rem)] sm:-mx-6 overflow-hidden bg-primary/5 border-y border-white/5 py-2 mb-0 backdrop-blur-sm sticky top-[68px] z-30 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex whitespace-nowrap animate-marquee gap-12 text-[9px] font-black uppercase tracking-widest text-primary/80 px-4 sm:px-6">
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HERO CARD */}
        <section className="lg:col-span-7 relative">
          <div className="relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-darker to-slate-900 border border-white/10 shadow-2xl min-h-[220px] flex flex-col justify-between group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Elite Spiral Voyager</p>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Agent {user.email.split('@')[0]}</h2>
              </div>
              <div className="w-12 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-md opacity-80 flex items-center justify-center shadow-lg">
                <div className="w-8 h-6 border border-black/20 rounded-sm"></div>
              </div>
            </div>

            <div className="relative z-10 my-4">
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Live Vault Balance</p>
                  {isLive && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[7px] font-black animate-pulse">
                      LIVE
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {wallet.hold_balance > 0 && (
                    <div className="flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                      <span className="text-[7px] font-black text-amber-500 uppercase tracking-widest">Held for Pool: ${wallet.hold_balance}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[8px] font-black text-green-500 uppercase tracking-widest">Growth Active</span>
                  </div>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter text-white">${liveBalance?.toFixed(6) || '0.000000'}</span>
                <span className="text-primary font-black text-xs uppercase tracking-widest">USDT</span>
              </div>
              <p className="text-[8px] text-slate-600 font-bold uppercase mt-1">Daily Yield: 0.20% (Auto-Compounding)</p>
            </div>

            <div className="flex justify-between items-end relative z-10">
              <div className="font-mono text-[10px] text-slate-500 tracking-[0.2em]">
                {user.id.toUpperCase().slice(0, 4)} •••• •••• {user.id.toUpperCase().slice(-4)}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${user.is_active ? 'bg-primary/20' : 'bg-red-500/20'}`}>
                  <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-primary animate-pulse' : 'bg-red-500'}`}></div>
                </div>
                <span className={`text-[10px] font-black uppercase ${user.is_active ? 'text-primary' : 'text-red-500'}`}>
                  {user.is_active ? 'Active Node' : 'Inactive Node'}
                </span>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS - OPTIMIZED FOR MOBILE PERFORMANCE */}
          <div className="grid grid-cols-4 gap-2 sm:gap-3 mt-4">
             {quickActions.map((action, i) => (
               <button 
                key={i} 
                onClick={action.action}
                className={`group relative flex flex-col items-center justify-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-slate-900/60 border border-white/5 transition-all active:scale-95 hover:bg-slate-800/80 shadow-lg ${action.glow} will-change-transform`}
               >
                 {/* Simplified corner accents for performance */}
                 <div className="absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/20 rounded-tl-lg group-hover:border-primary transition-colors"></div>
                 
                 <div className={`p-2 rounded-xl bg-white/5 group-hover:bg-white/10 transition-all duration-200 ${action.color}`}>
                   {React.cloneElement(action.icon as React.ReactElement, { size: 18 })}
                 </div>
                 <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400 group-hover:text-white transition-colors truncate w-full px-1 text-center">
                   {action.label}
                 </span>
               </button>
             ))}
          </div>

          {/* MAIN STATS GRID - OPTIMIZED */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Wallet ROI', value: `$${liveWalletROI.toFixed(2)}`, trend: '0.20%', color: 'text-cyan-400', sparkColor: '#22d3ee' },
              { label: 'Pool ROI', value: `$${livePoolROI.toFixed(2)}`, trend: '0.50%', color: 'text-amber-400', sparkColor: '#fbbf24' },
              { label: 'Direct Income', value: `$${(wallet.direct_income || 0).toFixed(2)}`, trend: 'Active', color: 'text-secondary', sparkColor: '#a855f7' },
              { label: 'Level Income', value: `$${(wallet.level_income || 0).toFixed(2)}`, trend: 'Network', color: 'text-green-400', sparkColor: '#10b981' },
            ].map((stat, i) => (
              <div 
                key={i} 
                onClick={() => onNavigate?.('income')}
                className="bg-slate-900/60 p-4 rounded-3xl border border-white/5 relative overflow-hidden group hover:bg-slate-800/80 transition-all cursor-pointer will-change-transform"
              >
                <h3 className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
                <p className={`text-lg font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              </div>
            ))}
          </div>
        </section>

          {/* EVOLUTION STATUS CARD - REDESIGNED */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative group overflow-hidden rounded-[2.5rem] p-8 bg-slate-900/60 border border-white/5 backdrop-blur-md will-change-transform">
              {/* Background Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 blur-[60px] rounded-full group-hover:bg-secondary/20 transition-all duration-700"></div>
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary/5 blur-[80px] rounded-full"></div>
              
              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-white text-xs font-black uppercase tracking-[0.4em] mb-1">Evolution Protocol</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                      <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">System Sync: 98.4%</p>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                    <span className="text-[10px] font-black text-secondary italic">TIER 04</span>
                    <div className="w-[1px] h-3 bg-white/10"></div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Elite</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-8">
                  {/* Futuristic Progress Ring */}
                  <div className="relative w-32 h-32 flex-shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      {/* Outer Glow Ring */}
                      <circle cx="64" cy="64" r="58" stroke="rgba(168,85,247,0.05)" strokeWidth="8" fill="transparent" />
                      {/* Background Track */}
                      <circle cx="64" cy="64" r="52" stroke="rgba(255,255,255,0.03)" strokeWidth="12" fill="transparent" />
                      {/* Segmented Progress */}
                      <circle 
                        cx="64" cy="64" r="52" 
                        stroke="url(#grad-evolution)" 
                        strokeWidth="12" 
                        fill="transparent" 
                        strokeDasharray="326.7" 
                        strokeDashoffset="81.6" 
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                      />
                      <defs>
                        <linearGradient id="grad-evolution" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white italic tracking-tighter leading-none">75<span className="text-xs text-secondary">%</span></span>
                      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest mt-1">Sync Rate</span>
                    </div>
                  </div>

                  <div className="flex-1 w-full space-y-5">
                    <div>
                      <p className="text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500 uppercase leading-none mb-1">Spiral Voyager</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Next Phase:</span>
                        <span className="text-[10px] font-black text-secondary uppercase tracking-widest italic">Spiral Prime</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[8px] font-black uppercase tracking-widest text-slate-500">
                        <span>XP Progress</span>
                        <span className="text-white">1,250 / 2,000 XP</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full p-[2px] border border-white/5">
                        <div className="h-full bg-gradient-to-r from-secondary to-primary rounded-full w-[75%] relative">
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-white shadow-[0_0_10px_#fff] rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1 bg-white/5 rounded-xl p-2 border border-white/5 text-center">
                        <p className="text-[7px] font-bold text-slate-500 uppercase mb-0.5">Directs</p>
                        <p className="text-xs font-black text-white">{user.direct_count || 0}</p>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-xl p-2 border border-white/5 text-center">
                        <p className="text-[7px] font-bold text-slate-500 uppercase mb-0.5">Network</p>
                        <p className="text-xs font-black text-white">1.2K</p>
                      </div>
                      <div className="flex-1 bg-white/5 rounded-xl p-2 border border-white/5 text-center">
                        <p className="text-[7px] font-bold text-slate-500 uppercase mb-0.5">Uptime</p>
                        <p className="text-xs font-black text-white">14D</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* INVITE PROTOCOL CARD */}
            <div className="glass rounded-[2.5rem] p-6 border-white/5 bg-darker/40 relative overflow-hidden group">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">🔗</div>
                  <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Invite Protocol</h3>
                </div>
                <span className={`text-[8px] px-2 py-1 rounded-full font-black uppercase tracking-widest ${user.is_active ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                  {user.is_active ? 'Engine Online' : 'Engine Offline'}
                </span>
              </div>
              
              <div className="flex items-center gap-3 bg-black/20 rounded-2xl p-3 border border-white/5 group-hover:border-primary/30 transition-all">
                <div className="flex-1 overflow-hidden">
                  <p className="text-[7px] font-bold text-slate-600 uppercase tracking-widest mb-1">Your Unique Node Access</p>
                  <input readOnly value={referralLink} className="w-full bg-transparent border-none outline-none font-mono text-[10px] text-primary/70 truncate" />
                </div>
                <button 
                  onClick={handleCopy} 
                  className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all active:scale-90"
                >
                  {copied ? '✓' : '📋'}
                </button>
              </div>
              
              {copied && (
                <div className="absolute inset-0 bg-primary/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                  <span className="text-white font-black uppercase tracking-[0.3em] text-xs">Node Link Copied</span>
                </div>
              )}
            </div>

            {/* AUTOPOOL QUALIFICATION STATUS */}
            {!user.is_qualified && (
              <div className="glass rounded-[2.5rem] p-6 border-amber-500/20 bg-amber-500/5 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">AutoPool Qualification</h3>
                  <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Incomplete</span>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Progress to Pool 1</p>
                    <div className="text-right">
                      <p className="text-xs font-black text-white">{user.direct_count || 0} / 3 Directs</p>
                      <p className="text-[9px] font-black text-amber-500 uppercase mt-1">Pool Fund: ${wallet.hold_balance || 0} / $10</p>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 transition-all duration-1000" 
                      style={{ width: `${Math.min(((user.direct_count || 0) / 3) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`h-1 rounded-full ${user.direct_count >= 1 ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
                    <div className={`h-1 rounded-full ${user.direct_count >= 2 ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
                    <div className={`h-1 rounded-full ${user.direct_count >= 3 ? 'bg-amber-500' : 'bg-slate-800'}`}></div>
                  </div>
                  <p className="text-[8px] text-slate-500 uppercase leading-relaxed">
                    Sponsor 3 active members to qualify. <br/>
                    <span className="text-amber-500/80">1st & 3rd commissions ($10) fund your AutoPool entry.</span>
                  </p>
                </div>
              </div>
            )}

            {/* POOL PROGRESS TREE VIEW */}
            {user.is_qualified && activePool && (
              <div className="glass rounded-[2.5rem] p-6 border-primary/20 bg-primary/5 relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">Pool {activePool.pool_number} Voyager</h3>
                    <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest mt-1">Global FIFO Matrix</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">
                      {activePool.members_count} / {activePool.pool_number === 1 ? 4 : 6}
                    </span>
                    <p className="text-[8px] text-primary font-black uppercase tracking-widest">Members Filled</p>
                  </div>
                </div>

                {/* Visual Tree/Slots */}
                <div className="flex flex-col items-center gap-6 py-4">
                  {/* User Node */}
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] shadow-lg shadow-primary/20">
                      <div className="w-full h-full bg-darker rounded-full flex items-center justify-center font-black text-xs text-primary italic">
                        YOU
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-[2px] h-6 bg-gradient-to-b from-primary/50 to-transparent"></div>
                  </div>

                  {/* Member Slots */}
                  <div className="flex flex-wrap justify-center gap-4 mt-2">
                    {Array.from({ length: activePool.pool_number === 1 ? 4 : 6 }).map((_, i) => {
                      const isFilled = i < activePool.members_count;
                      return (
                        <div key={i} className="flex flex-col items-center gap-2">
                          <div className={`w-8 h-8 rounded-full border-2 transition-all duration-500 ${isFilled ? 'border-primary bg-primary/20 shadow-lg shadow-primary/20' : 'border-white/5 bg-white/5'}`}>
                            {isFilled && (
                              <div className="w-full h-full flex items-center justify-center text-[10px] font-black text-primary">
                                ✓
                              </div>
                            )}
                          </div>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${isFilled ? 'text-primary' : 'text-slate-700'}`}>
                            Slot {i + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-[8px] text-slate-500 uppercase font-black">Completion Reward</p>
                      <p className="text-lg font-black text-white">
                        {activePool.pool_number === 1 ? '$10 + Rebirth' : `$${(Math.pow(2, activePool.pool_number - 1) * 10 * 6 * 0.5).toFixed(0)} + Upgrade`}
                      </p>
                    </div>
                    <button 
                      onClick={() => onNavigate?.('pools')}
                      className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline"
                    >
                      View All Pools →
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
      </div>

      {/* ADMIN COMMAND CENTER QUICK ACCESS */}
      {isAdmin && (
        <section className="animate-in slide-in-from-top duration-700">
           <div className="glass p-6 rounded-[2rem] border-red-500/30 bg-red-500/5 relative overflow-hidden">
              <div className="absolute top-[-20%] right-[-5%] w-40 h-40 bg-red-500/10 blur-[60px] rounded-full"></div>
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                 <div>
                    <h3 className="text-xl font-black text-red-500 uppercase italic tracking-tighter">System Commander</h3>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Global Protocol Access Level 0 Verified</p>
                 </div>
                 <div className="flex flex-wrap justify-center gap-3">
                    <button onClick={() => onNavigate?.('admin')} className="px-6 py-3 bg-red-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 hover:scale-105 transition-all">
                       Open Control Room
                    </button>
                    <button onClick={() => onNavigate?.('admin')} className="px-6 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                       Manage Users
                    </button>
                    <button onClick={() => onNavigate?.('admin')} className="px-6 py-3 bg-white/5 border border-white/10 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                       Update Rates
                    </button>
                 </div>
              </div>
           </div>
        </section>
      )}

      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { display: inline-flex; animation: marquee 20s linear infinite; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Dashboard;
