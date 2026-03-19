
import React, { useState, useEffect } from 'react';
import { User, Wallet } from '../types';
import { MLM_CONFIG } from '../constants';
import { Cpu, Zap, TrendingUp, Shield, Clock, ArrowUpRight, Activity } from 'lucide-react';

interface MiningProps {
  user: User;
  wallet: Wallet;
  pools: any[];
}

const Mining: React.FC<MiningProps> = ({ user, wallet, pools }) => {
  const [liveBalance, setLiveBalance] = useState(wallet.balance);
  const [liveWalletROI, setLiveWalletROI] = useState(wallet.wallet_roi_earned || 0);
  const [livePoolROI, setLivePoolROI] = useState(wallet.pool_roi_earned || 0);
  const [hashRate, setHashRate] = useState(98.4);
  const [uptime, setUptime] = useState('99.99%');

  useEffect(() => {
    const walletDailyRate = MLM_CONFIG.WALLET_DAILY_ROI;
    const poolDailyRate = MLM_CONFIG.POOL_DAILY_ROI;
    const walletRatePerSec = walletDailyRate / 86400;
    const poolRatePerSec = poolDailyRate / 86400;
    const tickerStartTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      let walletAccrued = 0;
      let poolAccrued = 0;
      
      if (wallet.balance > 0 && user.is_active) {
        const lastWalletROI = wallet.last_roi_at ? new Date(wallet.last_roi_at).getTime() : tickerStartTime;
        const walletSecs = (now - lastWalletROI) / 1000;
        walletAccrued = wallet.balance * walletRatePerSec * walletSecs;
      }
      
      const pool1 = pools.find(p => p.pool_number === 1 && p.status === 'active');
      if (pool1 && user.is_active) {
        const lastPoolROI = wallet.last_pool_roi_at ? new Date(wallet.last_pool_roi_at).getTime() : new Date(pool1.created_at).getTime();
        const poolSecs = (now - lastPoolROI) / 1000;
        poolAccrued = 10 * poolRatePerSec * poolSecs;
      }
      
      setLiveBalance(wallet.balance + walletAccrued + poolAccrued);
      setLiveWalletROI((wallet.wallet_roi_earned || 0) + walletAccrued);
      setLivePoolROI((wallet.pool_roi_earned || 0) + poolAccrued);
      
      // Randomly fluctuate hash rate for visual effect
      setHashRate(prev => Math.max(95, Math.min(99.9, prev + (Math.random() - 0.5))));
    }, 100);

    return () => clearInterval(interval);
  }, [wallet.balance, wallet.last_roi_at, wallet.last_pool_roi_at, user.is_active, pools]);

  const sessionEarnings = liveWalletROI + livePoolROI - (wallet.wallet_roi_earned || 0) - (wallet.pool_roi_earned || 0);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Mining Protocol</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Real-time ROI Accrual Engine</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">System Online</span>
        </div>
      </div>

      {/* Main Mining Display */}
      <div className="glass rounded-[3rem] p-8 sm:p-12 border-primary/20 bg-[#0a0a0c] relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.3),transparent_70%)]"></div>
        
        {/* Animated Core */}
        <div className="relative mb-10">
          <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse"></div>
          <div className="w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-darker border-2 border-primary/30 flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-[conic-gradient(from_0deg,transparent_0%,rgba(6,182,212,0.4)_50%,transparent_100%)] animate-spin-slow"></div>
            <div className="absolute inset-4 rounded-full border border-white/5 bg-darker flex items-center justify-center">
              <Cpu className="w-12 h-12 sm:w-20 sm:h-20 text-primary animate-pulse" />
            </div>
          </div>
        </div>

        <div className="space-y-2 relative z-10">
          <p className="text-slate-500 text-xs font-black uppercase tracking-[0.5em]">Live Accrual Balance</p>
          <div className="flex items-baseline justify-center gap-3">
            <span className="text-5xl sm:text-8xl font-black text-white italic tracking-tighter tabular-nums drop-shadow-[0_0_30px_rgba(6,182,212,0.3)]">
              ${liveBalance.toFixed(4)}
            </span>
            <span className="text-xl sm:text-2xl font-black text-primary italic uppercase tracking-tighter">USDT</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-emerald-400 font-black text-sm uppercase tracking-widest mt-4">
            <TrendingUp size={16} />
            <span>+0.20% - 0.50% APY Protocol</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mt-12 pt-12 border-t border-white/5">
          {[
            { label: 'Hash Rate', value: `${hashRate.toFixed(1)} MH/s`, icon: <Zap size={14} />, color: 'text-amber-400' },
            { label: 'Uptime', value: uptime, icon: <Clock size={14} />, color: 'text-emerald-400' },
            { label: 'Session Yield', value: `+$${sessionEarnings.toFixed(6)}`, icon: <TrendingUp size={14} />, color: 'text-primary' },
            { label: 'Network Load', value: 'Low', icon: <Activity size={14} />, color: 'text-secondary' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-1">
              <div className={`p-1.5 rounded-lg bg-white/5 mb-1 ${stat.color}`}>
                {stat.icon}
              </div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
              <span className={`text-xs font-black uppercase tracking-tighter ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Secondary Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-darker/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Shield size={20} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Protocol Security</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Encryption</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase">SHA-256 Active</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Node Status</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase">Verified</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Latency</span>
              <span className="text-[10px] font-black text-primary uppercase">12ms</span>
            </div>
          </div>
        </div>

        <div className="glass p-8 rounded-[2.5rem] border-white/5 bg-darker/40">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-secondary/10 text-secondary">
              <ArrowUpRight size={20} />
            </div>
            <h3 className="text-sm font-black text-white uppercase tracking-widest">Yield Distribution</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Wallet ROI</span>
              <span className="text-sm font-black text-white">${liveWalletROI.toFixed(4)}</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary" style={{ width: '65%' }}></div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Pool ROI</span>
              <span className="text-sm font-black text-white">${livePoolROI.toFixed(4)}</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-secondary" style={{ width: '35%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mining;
