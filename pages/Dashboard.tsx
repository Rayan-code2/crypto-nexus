
import React, { useState, useMemo } from 'react';
import { User, Wallet, Transaction } from '../types';
import { mockApi } from '../lib/mockApi';
import { MLM_CONFIG, POOL_NAMES } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, LineChart, Line 
} from 'recharts';
import { 
  ArrowDownCircle, ArrowUpCircle, RefreshCcw, UserPlus, 
  Zap, Shield, Globe, Cpu, Trophy, TrendingUp, ShieldCheck, Clock, Check 
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
  const [marqueeText, setMarqueeText] = useState('⚡ NODE ACTIVE: SYSTEM ACTIVE | 💎 USDT/INR: ₹92.45 (+0.4%) | 🔥 NETWORK VOLUME: $4.2M | 🚀 NEW POOL 5 ENTRY FROM ID #8291');
  const [hallOfFameMarquee, setHallOfFameMarquee] = useState('🏆 CONGRATULATIONS TO OUR ELITE ACHIEVERS! KEEP PUSHING FOR THE TOP! 🚀');
  const [weeklyOffer, setWeeklyOffer] = useState<any>(null);
  const [weeklyAchievers, setWeeklyAchievers] = useState<any[]>([]);
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
        const settings = await mockApi.db.getSettings() as any;
        if (settings && settings.marquee_text) {
          setMarqueeText(settings.marquee_text);
        }
        if (settings && settings.hall_of_fame_marquee) {
          setHallOfFameMarquee(settings.hall_of_fame_marquee);
        }
      } catch (e) {
        console.error("Failed to fetch marquee settings", e);
      }
    };
    fetchSettings();
  }, []);

  // Fetch Weekly Offer & Achievers
  React.useEffect(() => {
    const fetchOfferData = async () => {
      try {
        console.log('Dashboard starting to fetch weekly offer data...');
        const [offer, achievers] = await Promise.all([
          mockApi.db.getWeeklyOffer(),
          mockApi.db.getWeeklyAchievers()
        ]);
        console.log('Dashboard fetched weekly offer:', offer);
        console.log('Dashboard fetched weekly achievers count:', achievers?.length || 0);
        setWeeklyOffer(offer);
        setWeeklyAchievers(achievers);
      } catch (e) {
        console.error("Failed to fetch weekly offer data in Dashboard", e);
      }
    };
    fetchOfferData();
  }, []);

  // Real-time Balance Growth Ticker (Dual ROI)
  React.useEffect(() => {
    const walletDailyRate = MLM_CONFIG.WALLET_DAILY_ROI;
    const poolDailyRate = MLM_CONFIG.POOL_DAILY_ROI;
    
    const walletRatePerSec = walletDailyRate / 86400;
    const poolRatePerSec = poolDailyRate / 86400;
    
    // Capture start time to prevent "now - now" bug if last_roi_at is missing
    const tickerStartTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      let walletAccrued = 0;
      let poolAccrued = 0;
      
      // Wallet Accrual (Only if balance > 0 and user is active)
      if (wallet.balance > 0 && user.is_active) {
        const lastWalletROI = wallet.last_roi_at ? new Date(wallet.last_roi_at).getTime() : tickerStartTime;
        const walletSecs = (now - lastWalletROI) / 1000;
        walletAccrued = wallet.balance * walletRatePerSec * walletSecs;
      }
      
      // Pool Accrual (Only if user is in Pool 1, it's active, and user is active)
      const pool1 = pools.find(p => p.pool_number === 1 && p.status === 'active');
      if (pool1 && user.is_active) {
        const lastPoolROI = wallet.last_pool_roi_at ? new Date(wallet.last_pool_roi_at).getTime() : new Date(pool1.created_at).getTime();
        const poolSecs = (now - lastPoolROI) / 1000;
        poolAccrued = 10 * poolRatePerSec * poolSecs; // 0.5% of $10
      }
      
      setLiveBalance(wallet.balance + walletAccrued + poolAccrued);
      setLivePoolROI((wallet.pool_roi_earned || 0) + poolAccrued);
      setLiveWalletROI((wallet.wallet_roi_earned || 0) + walletAccrued);
    }, 100);

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
      <div className="w-[calc(100%+2rem)] -mx-4 sm:w-[calc(100%+3rem)] sm:-mx-6 -mt-4 sm:-mt-6 overflow-hidden bg-primary/5 border-y border-white/5 py-2 mb-0 backdrop-blur-sm sticky top-[68px] z-30 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex whitespace-nowrap animate-marquee gap-12 text-[9px] font-black uppercase tracking-widest text-primary/80 px-4 sm:px-6">
          <span>{marqueeText}</span>
          <span>{marqueeText}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HERO CARD - CYBER-VAULT REDESIGN */}
        <section className="lg:col-span-7 relative group">
          <div className="relative overflow-hidden rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-10 bg-[#0a0a0c] border-2 border-primary/30 shadow-[0_0_50px_rgba(6,182,212,0.2)] min-h-[320px] sm:min-h-[350px] flex flex-col justify-between transition-all duration-500 hover:border-primary/60 hover:shadow-[0_0_80px_rgba(6,182,212,0.3)]">
            
            {/* HOLOGRAPHIC MESH BACKGROUND */}
            <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.15),transparent_70%)]"></div>
            <div className="absolute inset-0 opacity-[0.05] pointer-events-none bg-[linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
            
            {/* DYNAMIC NEON GLOWS */}
            <div className="absolute -top-24 -right-24 w-80 h-80 bg-primary/30 blur-[100px] rounded-full"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/20 blur-[80px] rounded-full"></div>
            
            {/* TOP BAR: BRANDING & CHIP */}
            <div className="flex justify-between items-center relative z-10">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_15px_#06b6d4]"></div>
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.5em] italic">Spiral Protocol</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">v2.0.4-Stable</span>
                  <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                  <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Encrypted</span>
                </div>
              </div>

              {/* THE "CORE" CHIP */}
              <div className="relative group/chip">
                <div className="absolute -inset-2 bg-primary/20 blur-lg rounded-full opacity-0 group-hover/chip:opacity-100 transition-opacity"></div>
                <div className="w-14 h-10 sm:w-18 sm:h-12 bg-gradient-to-br from-slate-800 to-slate-950 rounded-xl border border-white/10 flex items-center justify-center relative overflow-hidden shadow-2xl">
                  <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%] animate-[shimmer_3s_infinite]"></div>
                  <div className="grid grid-cols-3 gap-1 opacity-40">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary/50 rounded-sm"></div>
                    ))}
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 sm:w-6 sm:h-6 bg-primary/20 rounded-full blur-md"></div>
                    <Cpu size={14} className="text-primary relative z-10" />
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN CONTENT: BALANCE DISPLAY */}
            <div className="relative z-10 flex flex-col items-center sm:items-start mt-4 sm:mt-0">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-slate-600 hidden sm:block"></div>
                <p className="text-slate-400 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.3em]">Available Liquidity</p>
                <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-slate-600 hidden sm:block"></div>
              </div>

              <div className="flex flex-col items-center sm:items-start gap-1">
                <div className="relative flex items-baseline">
                  <span className="text-5xl sm:text-7xl font-black tracking-tighter text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]">
                    ${liveBalance?.toFixed(2) || '0.00'}
                  </span>
                  <div className="ml-2 flex flex-col items-start">
                    <span className="text-[#FFD700] font-black text-xs sm:text-sm italic tracking-tighter">USDT</span>
                    <span className="text-[#FFD700]/80 text-[10px] sm:text-[12px] font-mono tracking-tighter tabular-nums">
                      {liveBalance?.toFixed(6).split('.')[1] || '000000'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md">
                    <TrendingUp size={12} className="text-emerald-400" />
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">+0.20% Daily</span>
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping ml-1"></div>
                  </div>
                  {wallet.hold_balance > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
                      <ShieldCheck size={12} className="text-amber-400" />
                      <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Reserve: ${wallet.hold_balance}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FOOTER: SYSTEM SPECS */}
            <div className="relative z-10 grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-primary rounded-full"></div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Node Signature</span>
                </div>
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center justify-between group/sig hover:bg-white/10 transition-all">
                  <span className="font-mono text-[10px] text-slate-300 tracking-widest">
                    {user.id.toUpperCase().slice(0, 8)}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-primary/40 group-hover/sig:bg-primary transition-all"></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-3 bg-secondary rounded-full"></div>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">System Status</span>
                </div>
                <div className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${user.is_active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${user.is_active ? 'text-emerald-400' : 'text-red-400'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                    <span className="text-[6px] font-bold text-slate-600 uppercase">Protocol Secure</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${user.is_active ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-red-500 shadow-[0_0_10px_#ef4444]'}`}></div>
                </div>
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
                className="bg-slate-900/60 p-4 rounded-3xl border border-white/5 relative overflow-hidden group hover:bg-slate-800/80 transition-all cursor-pointer will-change-transform text-center"
              >
                <h3 className="text-slate-500 text-[8px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
                <p className={`text-lg font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
              </div>
            ))}
          </div>

          {/* LIVE MINING PROTOCOL - FUTURISTIC REDESIGN */}
          <div className="mt-6 relative group">
            {/* Outer Glow & Border */}
            <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/50 via-secondary/50 to-primary/50 rounded-[2.5rem] blur-[2px] opacity-70 group-hover:opacity-100 transition-opacity duration-700"></div>
            
            <div className="relative glass rounded-[2.5rem] p-1 border border-white/10 bg-[#0a0a0c] overflow-hidden">
              {/* Background Grid Pattern */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px]"></div>
              
              <div className="flex flex-col lg:flex-row items-stretch relative z-10">
                {/* Left Section: Visual Core */}
                <div className="lg:w-1/3 p-8 flex flex-col items-center justify-center border-b lg:border-b-0 lg:border-r border-white/5 bg-white/[0.02]">
                  <div className="relative mb-6">
                    {/* Scanning Line Animation */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary/40 blur-sm animate-scan z-20"></div>
                    
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-darker border border-primary/20 flex items-center justify-center relative overflow-hidden group-hover:border-primary/40 transition-colors duration-500">
                      {/* Rotating Rings */}
                      <div className="absolute inset-0 border-2 border-dashed border-primary/10 rounded-full animate-spin-slow"></div>
                      <div className="absolute inset-4 border border-secondary/20 rounded-full animate-reverse-spin"></div>
                      
                      <div className="relative z-10 flex flex-col items-center">
                        <Cpu className="w-10 h-10 sm:w-14 sm:h-14 text-primary animate-pulse" />
                        <div className="mt-2 flex items-center gap-1">
                          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-ping"></div>
                          <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-black text-white italic uppercase tracking-tighter leading-none mb-1">ROI Protocol</h3>
                    <p className="text-slate-500 text-[8px] font-bold uppercase tracking-[0.3em]">Neural Accrual Engine</p>
                  </div>
                </div>

                {/* Middle Section: Real-time Data */}
                <div className="flex-1 p-8 flex flex-col justify-center items-center lg:items-start">
                  <div className="flex flex-col items-center lg:items-start w-full">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 flex items-center gap-1.5">
                        <Zap size={10} className="text-primary" />
                        <span className="text-[8px] font-black text-primary uppercase tracking-widest">Real-time Stream</span>
                      </div>
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Session: {Math.random().toString(36).substring(7).toUpperCase()}</span>
                    </div>

                    <div className="relative">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] block mb-1">Current Session Yield</span>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl sm:text-6xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                          +${(liveWalletROI + livePoolROI - (wallet.wallet_roi_earned || 0) - (wallet.pool_roi_earned || 0)).toFixed(6)}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-primary/60 uppercase italic tracking-tighter">USDT</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mt-8 w-full max-w-sm">
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Efficiency</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 w-[99.9%]"></div>
                          </div>
                          <span className="text-[10px] font-black text-emerald-400 italic">99.9%</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Node Load</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[12%]"></div>
                          </div>
                          <span className="text-[10px] font-black text-primary italic">Minimal</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section: Actions */}
                <div className="lg:w-1/4 p-8 flex flex-col justify-center items-center lg:items-end border-t lg:border-t-0 lg:border-l border-white/5 bg-white/[0.01]">
                  <button 
                    onClick={() => onNavigate?.('income')}
                    className="group/btn relative w-full h-14 rounded-2xl overflow-hidden active:scale-95 transition-transform"
                  >
                    <div className="absolute inset-0 bg-primary group-hover/btn:bg-primary/90 transition-colors"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%] animate-shimmer"></div>
                    <div className="relative z-10 flex items-center justify-center gap-3 px-6 h-full">
                      <TrendingUp size={18} className="text-darker" />
                      <span className="text-xs font-black text-darker uppercase tracking-widest">View Ledger</span>
                    </div>
                  </button>
                  
                  <p className="mt-4 text-[7px] font-black text-slate-600 uppercase tracking-[0.3em] text-center lg:text-right">
                    Secured by Quantum Protocol v1.0
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MISSION CENTER: WEEKLY ARENA - COMPACT & HIGH-DENSITY REDESIGN */}
        <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative group overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] p-0 bg-slate-950/90 border-2 border-primary/20 shadow-2xl transition-all duration-700 hover:border-primary/50">
              
              {/* CYBER BACKGROUND ELEMENTS */}
              <div className="absolute top-0 right-0 w-full h-full opacity-20 pointer-events-none">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-primary/20 blur-[80px] rounded-full"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_70%)]"></div>
              </div>

              {/* HEADER: COMPACT MISSION CONTROL */}
              <div className="relative z-10 bg-white/5 border-b border-white/5 px-5 py-4 sm:px-8 sm:py-6 flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-primary/30 blur-lg rounded-full"></div>
                    <div className="relative w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-900 border border-primary/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                      <Trophy className="w-5 h-5 sm:w-7 sm:h-7 text-primary" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                      <span className="text-[8px] sm:text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Live Arena</span>
                    </div>
                    <h3 className="text-white font-black text-lg sm:text-2xl italic uppercase tracking-tighter leading-none">Weekly Arena</h3>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[7px] sm:text-[8px] font-black text-primary uppercase tracking-widest mb-0.5">Prize Pool</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl sm:text-3xl font-black text-amber-400 italic tracking-tighter drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]">
                      ${weeklyOffer?.reward_amount || 0}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold uppercase">USDT</span>
                  </div>
                </div>
              </div>

              <div className="p-5 sm:p-8 relative z-10">
                {/* COMPACT PROGRESS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  
                  {/* PROGRESS RING - SCALED FOR MOBILE */}
                  <div className="bg-white/5 rounded-3xl p-4 sm:p-6 border border-white/10 flex flex-row sm:flex-col items-center justify-between sm:justify-center gap-4 relative overflow-hidden group/card">
                    <div className="relative w-20 h-20 sm:w-32 sm:h-32 flex items-center justify-center shrink-0">
                      <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
                        <circle cx="64" cy="64" r="58" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                        <circle
                          cx="64" cy="64" r="58"
                          fill="transparent"
                          stroke="url(#arenaGradient)"
                          strokeWidth="10"
                          strokeDasharray="364"
                          strokeDashoffset={364 - (Math.min(user.weekly_directs || 0, 5) / 5) * 364}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="flex flex-col items-center">
                        <span className="text-2xl sm:text-4xl font-black text-white italic tracking-tighter">{user.weekly_directs || 0}</span>
                        <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest">Directs</span>
                      </div>
                    </div>
                    <div className="text-right sm:text-center flex-1">
                      <p className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Mission Progress</p>
                      <p className="text-[11px] sm:text-sm font-black text-white italic uppercase tracking-tighter">
                        {5 - (user.weekly_directs || 0) > 0 
                          ? `${5 - (user.weekly_directs || 0)} More to Qualify` 
                          : "Mission Accomplished!"}
                      </p>
                    </div>
                  </div>

                  {/* STATUS & TIMER - STACKED COMPACTLY */}
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className={`rounded-3xl p-4 border flex items-center gap-4 transition-all ${
                      (user.weekly_directs || 0) >= 5 
                        ? 'bg-emerald-500/10 border-emerald-500/20' 
                        : 'bg-white/5 border-white/10'
                    }`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        (user.weekly_directs || 0) >= 5 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-primary/20 text-primary'
                      }`}>
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">Status</span>
                        <h4 className={`text-sm sm:text-lg font-black italic uppercase tracking-tighter ${
                          (user.weekly_directs || 0) >= 5 ? 'text-emerald-500' : 'text-white'
                        }`}>
                          {(user.weekly_directs || 0) >= 5 ? "Elite Qualified" : "In Progress"}
                        </h4>
                      </div>
                    </div>

                    <div className="bg-amber-500/10 rounded-3xl p-4 border border-amber-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <div>
                          <span className="text-[8px] font-black text-amber-500/60 uppercase tracking-widest block">Arena Closes</span>
                          <span className="text-[11px] sm:text-xs font-black text-amber-400 italic uppercase">
                            {weeklyOffer?.end_date ? new Date(weeklyOffer.end_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Syncing...'}
                          </span>
                        </div>
                      </div>
                      <RefreshCcw className="w-4 h-4 text-amber-500/30 animate-spin-slow" />
                    </div>
                  </div>
                </div>

                {/* MISSION OBJECTIVES - FILLS THE "EMPTY" FEELING */}
                <div className="mt-6 p-4 bg-white/5 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap size={10} className="text-primary" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Mission Objectives</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.weekly_directs >= 1 ? 'bg-primary' : 'bg-slate-800'}`}></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Recruit 5 Nodes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Top 5 Ranking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-primary' : 'bg-slate-800'}`}></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Active Protocol</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Weekly Reset</span>
                    </div>
                  </div>
                </div>

                {/* ELITE ACHIEVERS: HALL OF FAME - COMPACT MARQUEE */}
                <div className="mt-6 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-primary rounded-full"></div>
                      <h4 className="text-[9px] sm:text-[10px] font-black text-white uppercase tracking-[0.3em]">Hall of Fame</h4>
                    </div>
                    <span className="text-[7px] font-black text-primary uppercase tracking-widest">Live Feed</span>
                  </div>

                  <div className="relative overflow-hidden h-12 flex items-center bg-slate-900/40 rounded-2xl border border-white/5">
                    <div className="flex gap-6 animate-marquee whitespace-nowrap">
                      {weeklyAchievers.length > 0 ? (
                        [...weeklyAchievers, ...weeklyAchievers].map((achiever, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5 hover:border-primary/30 transition-all cursor-default group/item">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-[10px] font-black text-white italic shadow-lg">
                              {i % weeklyAchievers.length + 1}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-white uppercase tracking-tighter leading-none">{achiever.email.split('@')[0]}</span>
                              <span className="text-[7px] font-bold text-primary uppercase tracking-widest mt-0.5">{achiever.count} Directs</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic px-6">Arena is heating up... Be the first to qualify!</span>
                      )}
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
                  {user.is_active ? 'Engine Active' : 'Engine Inactive'}
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

            {/* POOL PROGRESS TREE VIEW - MLM INSPIRED STYLE */}
            {user.is_qualified && activePool && (
              <div className={`glass rounded-[2.5rem] p-6 relative overflow-hidden transition-all duration-300 ${
                activePool.pool_number === 1 
                  ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-darker to-darker shadow-[0_0_50px_rgba(245,158,11,0.15)]' 
                  : 'border-primary/20 bg-primary/5'
              }`}>
                {/* MLM DECORATION - GOLD THEME FOR POOL 1 */}
                {activePool.pool_number === 1 && (
                  <>
                    <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-[60px] rounded-full -mr-20 -mt-20"></div>
                    <div className="absolute top-4 right-4 flex flex-col items-end z-20">
                      <div className="bg-amber-500 text-darker text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                        Rank: Voyager
                      </div>
                      <span className="text-[6px] text-amber-500/60 font-bold uppercase tracking-[0.3em] mt-1">Elite Tier</span>
                    </div>
                    
                    {/* DECORATIVE CORNER ACCENT */}
                    <div className="absolute bottom-0 left-0 w-16 h-16 border-l-2 border-b-2 border-amber-500/20 rounded-bl-[2.5rem] pointer-events-none"></div>
                  </>
                )}

                <div className="flex justify-between items-center mb-8 relative z-10">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${activePool.pool_number === 1 ? 'bg-amber-500/20 text-amber-500' : 'bg-primary/20 text-primary'}`}>
                        <Zap size={12} fill="currentColor" />
                      </div>
                      <h3 className={`text-[11px] font-black uppercase tracking-[0.2em] ${activePool.pool_number === 1 ? 'text-amber-400' : 'text-primary'}`}>
                        {POOL_NAMES[activePool.pool_number - 1] || `Pool ${activePool.pool_number}`}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Global Matrix Cycle</span>
                      <div className={`h-1 w-8 rounded-full ${activePool.pool_number === 1 ? 'bg-amber-500/30' : 'bg-primary/30'}`}>
                        <div className={`h-full rounded-full ${activePool.pool_number === 1 ? 'bg-amber-500' : 'bg-primary'}`} style={{ width: '40%' }}></div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline justify-end gap-1">
                      <span className="text-sm font-black text-white leading-none">
                        {activePool.members_count}
                      </span>
                      <span className="text-[9px] font-bold text-slate-500">/ {activePool.pool_number === 1 ? 4 : 6}</span>
                    </div>
                    <p className={`text-[7px] font-black uppercase tracking-widest ${activePool.pool_number === 1 ? 'text-amber-500' : 'text-primary'}`}>Network Filled</p>
                  </div>
                </div>

                {/* Visual Tree/Slots - MLM STYLE */}
                <div className="flex flex-col items-center gap-8 py-4 relative z-10">
                  {/* User Node - THE LEADER */}
                  <div className="relative">
                    <div className={`w-14 h-14 rounded-full p-[3px] shadow-2xl transition-all duration-700 ${
                      activePool.pool_number === 1 
                        ? 'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-amber-500/30 scale-110' 
                        : 'bg-gradient-to-br from-primary to-secondary shadow-primary/20'
                    }`}>
                      <div className="w-full h-full bg-darker rounded-full flex flex-col items-center justify-center overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent"></div>
                        <span className={`font-black text-[10px] italic tracking-tighter ${activePool.pool_number === 1 ? 'text-amber-400' : 'text-primary'}`}>YOU</span>
                        <div className={`w-4 h-[1px] mt-0.5 ${activePool.pool_number === 1 ? 'bg-amber-500/50' : 'bg-primary/50'}`}></div>
                      </div>
                    </div>
                    {/* CONNECTION LINES */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 w-[1px] h-8 bg-gradient-to-b from-amber-500/50 to-transparent"></div>
                  </div>

                  {/* Member Slots - DOWNLINES */}
                  <div className="flex flex-wrap justify-center gap-5 mt-2">
                    {Array.from({ length: activePool.pool_number === 1 ? 4 : 6 }).map((_, i) => {
                      const isFilled = i < activePool.members_count;
                      return (
                        <div key={i} className="flex flex-col items-center gap-2 group/slot">
                          <div className={`w-12 h-12 rounded-full p-[2px] transition-all duration-700 ${
                            isFilled 
                              ? activePool.pool_number === 1 
                                ? 'bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 shadow-amber-500/30' 
                                : 'bg-gradient-to-br from-primary to-secondary shadow-primary/20' 
                              : 'bg-white/5 border border-white/10'
                          }`}>
                            <div className="w-full h-full bg-darker rounded-full flex items-center justify-center overflow-hidden relative">
                              {isFilled ? (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${activePool.pool_number === 1 ? 'bg-amber-500' : 'bg-primary'}`}>
                                  <Check size={12} className="text-darker" strokeWidth={4} />
                                </div>
                              ) : (
                                <div className="w-5 h-5 rounded-full border border-white/5 flex items-center justify-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-white/5"></div>
                                </div>
                              )}
                            </div>
                          </div>
                          <span className={`text-[7px] font-black uppercase tracking-widest mt-1 ${isFilled ? activePool.pool_number === 1 ? 'text-amber-500' : 'text-primary' : 'text-slate-700'}`}>
                            Lvl {i + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* BOTTOM REWARD SECTION - MLM STYLE */}
                <div className={`mt-8 pt-6 border-t relative z-10 ${activePool.pool_number === 1 ? 'border-amber-500/20' : 'border-white/5'}`}>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest">Cycle Payout</p>
                      <div className="flex items-baseline gap-2">
                        <p className={`text-xl font-black italic tracking-tighter ${activePool.pool_number === 1 ? 'text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.3)]' : 'text-white'}`}>
                          {activePool.pool_number === 1 ? '$10.00' : `$${(Math.pow(2, activePool.pool_number - 1) * 10 * 6 * 0.5).toFixed(0)}`}
                        </p>
                        <span className={`text-[9px] font-black uppercase ${activePool.pool_number === 1 ? 'text-amber-600' : 'text-primary'}`}>
                          + {activePool.pool_number === 1 ? 'Rebirth' : 'Upgrade'}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => onNavigate?.('pools')}
                      className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                        activePool.pool_number === 1 
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-darker' 
                          : 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-white'
                      }`}
                    >
                      Matrix View
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
