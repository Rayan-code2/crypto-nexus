
import React, { useState, useMemo } from 'react';
import { User, Wallet, Transaction } from '../types';
import { mockApi } from '../lib/mockApi';
import { POOL_NAMES } from '../constants';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, LineChart, Line 
} from 'recharts';
import { 
  ArrowDownCircle, ArrowUpCircle, RefreshCcw, UserPlus, 
  Zap, Shield, Globe, Cpu, Trophy 
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
        const [offer, achievers] = await Promise.all([
          mockApi.db.getWeeklyOffer(),
          mockApi.db.getWeeklyAchievers()
        ]);
        setWeeklyOffer(offer);
        setWeeklyAchievers(achievers);
      } catch (e) {
        console.error("Failed to fetch weekly offer data", e);
      }
    };
    fetchOfferData();
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
        
        {/* HERO CARD - GLOSSY THEMED VAULT */}
        <section className="lg:col-span-7 relative group">
          <div className="relative overflow-hidden rounded-[3rem] p-8 sm:p-10 bg-darker border border-primary/20 shadow-[0_0_40px_rgba(6,182,212,0.15)] min-h-[320px] flex flex-col justify-between transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_60px_rgba(6,182,212,0.25)]">
            
            {/* GLOSSY OVERLAY EFFECT */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary/5 opacity-50"></div>
            
            {/* DYNAMIC THEMED BACKGROUND ELEMENTS */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 blur-[130px] rounded-full group-hover:bg-primary/20 transition-all duration-1000"></div>
            
            {/* SCANNING LINE EFFECT */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(6,182,212,0.05),rgba(6,182,212,0.02),rgba(6,182,212,0.05))] bg-[length:100%_2px,3px_100%]"></div>
            
            {/* TOP SECTION: USER INFO & UNIQUE CHIP */}
            <div className="flex justify-between items-start relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_#06b6d4]"></div>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Voyager Protocol v2.0</p>
                </div>
                <h2 className="text-lg font-black text-white tracking-tighter uppercase italic">
                  Agent <span className="text-primary">{user.email.split('@')[0]}</span>
                </h2>
                <div className="flex items-center gap-2 opacity-60">
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Access Level: Elite</span>
                  <div className="w-1 h-1 rounded-full bg-primary/30"></div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Node: {user.id.slice(0, 6)}</span>
                </div>
              </div>

              {/* UNIQUE FUTURISTIC CHIP */}
              <div className="w-14 h-9 sm:w-16 sm:h-10 bg-gradient-to-br from-amber-200 via-amber-500 to-amber-700 rounded-xl shadow-[0_0_40px_rgba(251,191,36,0.4)] border border-white/30 flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform duration-500 relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="absolute inset-0 opacity-40">
                  <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/20"></div>
                  <div className="absolute top-0 left-1/2 w-[1px] h-full bg-black/20"></div>
                </div>
                <div className="w-10 h-6 sm:w-12 sm:h-8 border border-white/40 rounded-lg bg-black/10 backdrop-blur-md relative flex items-center justify-center">
                  <div className="w-3 h-3 bg-amber-300 rounded-full blur-[4px] animate-pulse"></div>
                </div>
              </div>
            </div>

            {/* MIDDLE SECTION: CENTERED BALANCE & POOL BADGE */}
            <div className="relative z-10 my-6 flex flex-col items-center text-center">
              <div className="flex flex-col items-center gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Vault Liquidity</p>
                  {isLive && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black animate-pulse tracking-widest">
                      SYNCED
                    </span>
                  )}
                </div>
                
                {wallet.hold_balance > 0 && (
                  <div className="group/pool relative">
                    <div className="absolute inset-0 bg-amber-500/20 blur-md rounded-full animate-pulse"></div>
                    <div className="relative flex items-center gap-2 bg-black/40 px-4 py-1.5 rounded-full border border-amber-500/30 backdrop-blur-md">
                      <Zap size={10} className="text-amber-500" />
                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Pool Reserve: ${wallet.hold_balance}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="absolute -inset-8 bg-gradient-to-r from-primary/10 to-secondary/10 blur-3xl rounded-full animate-pulse"></div>
                <div className="relative flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                    ${liveBalance?.toFixed(6) || '0.000000'}
                  </span>
                  <span className="text-primary font-black text-[10px] italic tracking-widest">USDT</span>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                  <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Yield: 0.20%</span>
                </div>
                <div className="w-[1px] h-3 bg-white/10"></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Auto-Compounding</span>
              </div>
            </div>

            {/* BOTTOM SECTION: ID & ACTIVE STATUS - SYMMETRICAL LAYOUT */}
            <div className="grid grid-cols-2 gap-4 relative z-10 pt-5 border-t border-white/10">
              {/* NODE SIGNATURE BOX */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Node Signature</span>
                <div className="flex items-center gap-2 bg-white/5 px-3 h-11 rounded-xl border border-white/5 backdrop-blur-sm group/node hover:border-primary/30 transition-all">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover/node:bg-primary transition-colors shrink-0"></div>
                  <span className="font-mono text-[9px] sm:text-[10px] text-slate-300 tracking-[0.1em] truncate">
                    {user.id.toUpperCase().slice(0, 4)} •••• {user.id.toUpperCase().slice(-4)}
                  </span>
                </div>
              </div>

              {/* ACTIVE STATUS BOX */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">System Status</span>
                <div className="flex items-center gap-3 bg-white/5 px-3 h-11 rounded-xl border border-white/5 group/status hover:bg-white/10 transition-all cursor-default">
                  <div className="relative flex items-center justify-center shrink-0">
                    <div className={`absolute inset-0 blur-md rounded-full transition-all duration-700 ${user.is_active ? 'bg-primary/30 group-hover/status:bg-primary/50' : 'bg-red-500/30'}`}></div>
                    <div className={`w-2.5 h-2.5 rounded-full border border-white/20 relative z-10 ${user.is_active ? 'bg-primary animate-pulse shadow-[0_0_8px_#06b6d4]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`}></div>
                  </div>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-black uppercase tracking-widest truncate ${user.is_active ? 'text-white' : 'text-red-500'}`}>
                        {user.is_active ? 'Active' : 'Offline'}
                      </span>
                      {user.is_active && <div className="w-1 h-1 rounded-full bg-primary animate-ping shrink-0"></div>}
                    </div>
                    <span className="text-[6px] font-bold text-slate-600 uppercase tracking-widest truncate">Protocol: Secure</span>
                  </div>
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
        </section>

        {/* WEEKLY OFFER WALL - THEME-ALIGNED PREMIUM DESIGN */}
        <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="relative group overflow-hidden rounded-[2.5rem] p-0 bg-slate-900/40 border border-white/5 shadow-xl shadow-primary/5 transition-all duration-700 hover:shadow-[0_0_80px_rgba(6,182,212,0.15)]">
              {/* Luxury Background Elements */}
              <div className="absolute top-0 right-0 w-48 md:w-64 h-48 md:h-64 bg-primary/5 blur-[80px] md:blur-[100px] rounded-full group-hover:bg-primary/10 transition-all duration-1000"></div>
              
              {/* Header: Premium Badge */}
              <div className="bg-white/5 border-b border-white/5 px-5 md:px-8 py-4 md:py-5 flex justify-between items-center">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Trophy className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-[8px] md:text-[10px] font-black text-primary uppercase tracking-[0.2em] md:tracking-[0.3em] block">Top 5 Achiever with 5+ Direct</span>
                    <h3 className="text-white font-black text-sm md:text-lg italic uppercase tracking-tighter leading-none mt-0.5">Weekly Championship</h3>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2 md:px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[7px] md:text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                </div>
              </div>

              <div className="p-4 md:p-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  {/* Left Side: The Trophy & Progress */}
                  <div className="flex flex-col items-center md:items-start space-y-4 md:space-y-6">
                    <div className="relative">
                      {/* Glowing Aura for Trophy */}
                      <div className="absolute inset-0 bg-primary/10 blur-xl md:blur-2xl rounded-full animate-pulse"></div>
                      
                      <div className="relative w-28 h-28 md:w-36 md:h-36 flex items-center justify-center">
                        {/* Progress Ring */}
                        <svg className="absolute inset-0 w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
                          <circle
                            cx="64" cy="64" r="60"
                            fill="transparent"
                            stroke="rgba(255,255,255,0.03)"
                            strokeWidth="4"
                          />
                          <circle
                            cx="64" cy="64" r="60"
                            fill="transparent"
                            stroke="url(#themeGradient)"
                            strokeWidth="6"
                            strokeDasharray="377"
                            strokeDashoffset={377 - (Math.min(user.weekly_directs || 0, 5) / 5) * 377}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                          />
                          <defs>
                            <linearGradient id="themeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#06b6d4" />
                              <stop offset="100%" stopColor="#a855f7" />
                            </linearGradient>
                          </defs>
                        </svg>

                        {/* Large Trophy Icon */}
                        <div className="relative z-10 flex flex-col items-center">
                          <Trophy className="w-10 h-10 md:w-12 md:h-12 text-primary mb-0.5 md:mb-1" />
                          <div className="flex flex-col items-center">
                            <span className="text-2xl md:text-3xl font-black text-white italic leading-none tracking-tighter">
                              {user.weekly_directs || 0}<span className="text-xs md:text-sm text-slate-500 not-italic">/5</span>
                            </span>
                            <span className="text-[7px] md:text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] md:tracking-[0.3em] mt-0.5">Directs</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 md:gap-3">
                    {/* Reward & Status in a row on mobile */}
                    <div className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-3">
                      {/* Reward Card */}
                      <div className="relative overflow-hidden bg-darker/40 border border-white/5 rounded-[1.2rem] md:rounded-[1.5rem] p-3 md:p-4 transition-all hover:border-primary/20 group/card flex flex-col items-center text-center">
                        <div className="absolute top-0 right-0 p-2 md:p-3 opacity-5 md:opacity-10 group-hover/card:opacity-20 transition-opacity">
                          <Zap className="w-6 h-6 md:w-8 md:h-8 text-primary" />
                        </div>
                        <span className="text-[6px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Reward</span>
                        <div className="flex items-baseline gap-0.5 md:gap-1">
                          <span className="text-xl md:text-2xl font-black text-primary italic tracking-tighter">${weeklyOffer?.reward_amount || 0}</span>
                          <span className="text-white/40 font-bold text-[7px] md:text-[10px] uppercase">USDT</span>
                        </div>
                      </div>

                      {/* Status Card */}
                      <div className="bg-darker/40 border border-white/5 rounded-[1.2rem] md:rounded-[1.5rem] p-3 md:p-4 flex flex-col items-center text-center gap-2 md:gap-3 transition-all hover:bg-white/5">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center shadow-inner ${
                          (user.weekly_directs || 0) >= 5 
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                          : "bg-primary/10 text-primary border border-primary/20"
                        }`}>
                          <Shield className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <div className="hidden sm:block">
                          <span className="text-[6px] md:text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-0.5">Status</span>
                          <p className={`text-xs md:text-sm font-black italic uppercase leading-none ${
                            (user.weekly_directs || 0) >= 5 ? "text-emerald-500" : "text-white"
                          }`}>
                            {(user.weekly_directs || 0) >= 5 ? "Qualified" : "Pending"}
                          </p>
                        </div>
                        <div className="sm:hidden">
                           <p className={`text-[10px] font-black italic uppercase leading-none ${
                            (user.weekly_directs || 0) >= 5 ? "text-emerald-500" : "text-white"
                          }`}>
                            {(user.weekly_directs || 0) >= 5 ? "Done" : "Wait"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Countdown Card */}
                    <div className="bg-primary rounded-[1.2rem] md:rounded-[1.5rem] p-3 md:p-4 shadow-lg shadow-primary/10 relative overflow-hidden group/timer flex flex-col items-center text-center">
                      <div className="absolute -right-3 -bottom-3 opacity-10 group-hover/timer:scale-110 transition-transform duration-700">
                        <RefreshCcw className="w-12 h-12 md:w-16 md:h-16 text-black" />
                      </div>
                      <div className="relative z-10 flex flex-col items-center">
                        <span className="text-[6px] md:text-[8px] font-black text-black/60 uppercase tracking-widest block mb-0.5">Cycle Ends In</span>
                        <p className="text-sm md:text-lg font-black text-darker italic uppercase tracking-tighter">
                          {weeklyOffer?.end_date ? new Date(weeklyOffer.end_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : 'Calculating...'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Elite Achievers Marquee - Refined */}
                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-white/10">
                  <div className="flex items-center justify-between mb-2 md:mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-1 md:w-1.5 md:h-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(6,182,212,0.8)]"></div>
                      <span className="text-[7px] md:text-[9px] font-black text-white uppercase tracking-[0.3em] md:tracking-[0.4em]">Hall of Fame</span>
                    </div>
                    <span className="text-[6px] md:text-[8px] font-bold text-primary/60 uppercase tracking-widest">Live</span>
                  </div>
                  
                  <div className="relative overflow-hidden h-8 md:h-10 flex items-center bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-lg md:rounded-xl border-x border-white/5">
                    <div className="flex gap-6 md:gap-10 animate-marquee whitespace-nowrap px-4 md:px-6">
                      <span className="text-[9px] font-black text-primary uppercase tracking-widest italic mr-4">
                        {hallOfFameMarquee}
                      </span>
                      {weeklyAchievers.length > 0 ? (
                        weeklyAchievers.map((achiever, i) => (
                          <div key={i} className="flex items-center gap-2 group/achiever bg-white/5 px-3 py-1 rounded-full border border-white/5">
                            <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[7px] md:text-[9px] font-black text-primary italic">
                              {i+1}
                            </div>
                            <span className="text-white font-bold text-[9px] md:text-[11px] tracking-tight">{achiever.email.split('@')[0]}</span>
                            <div className="px-1 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-black text-[6px] md:text-[8px] uppercase">
                              {achiever.count}
                            </div>
                          </div>
                        ))
                      ) : (
                        <span className="text-slate-600 text-[7px] md:text-[9px] font-bold uppercase tracking-[0.1em] md:tracking-[0.2em] italic">Awaiting champions...</span>
                      )}
                      {/* Duplicate for seamless loop */}
                      {weeklyAchievers.length > 0 && weeklyAchievers.map((achiever, i) => (
                        <div key={`dup-${i}`} className="flex items-center gap-2 md:gap-3 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                          <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-[7px] md:text-[9px] font-black text-primary italic">
                            {i+1}
                          </div>
                          <span className="text-white font-bold text-[9px] md:text-[11px] tracking-tight">{achiever.email.split('@')[0]}</span>
                          <div className="px-1 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-black text-[6px] md:text-[8px] uppercase">
                            {achiever.count}
                          </div>
                        </div>
                      ))}
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
                          <div className={`w-10 h-10 rounded-2xl border-2 rotate-45 flex items-center justify-center transition-all duration-700 ${
                            isFilled 
                              ? activePool.pool_number === 1 
                                ? 'border-amber-500 bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                                : 'border-primary bg-primary/20 shadow-lg shadow-primary/20' 
                              : 'border-white/5 bg-white/5 hover:border-white/20'
                          }`}>
                            <div className="-rotate-45">
                              {isFilled ? (
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center ${activePool.pool_number === 1 ? 'bg-amber-500' : 'bg-primary'}`}>
                                  <span className="text-darker text-[10px] font-black">✓</span>
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded-full border border-white/10 flex items-center justify-center">
                                  <div className="w-1 h-1 rounded-full bg-white/5"></div>
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
