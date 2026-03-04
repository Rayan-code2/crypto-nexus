
import React, { useState, useMemo } from 'react';
import { User, Wallet, Transaction } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, LineChart, Line 
} from 'recharts';

interface DashboardProps {
  user: User;
  wallet: Wallet;
  onNavigate?: (tab: string) => void;
  onExchangerNav?: (subTab: 'topup' | 'withdraw' | 'swap') => void;
}

const sparkData = [
  { v: 40 }, { v: 35 }, { v: 55 }, { v: 45 }, { v: 70 }, { v: 65 }, { v: 85 }
];

const Dashboard: React.FC<DashboardProps> = ({ user, wallet, onNavigate, onExchangerNav }) => {
  const [copied, setCopied] = useState(false);
  const isAdmin = user.role?.toLowerCase() === 'admin';
  
  const referralLink = useMemo(() => 
    `${window.location.origin}/?ref=${user.id}`, 
    [user.id]
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const quickActions = [
    { icon: '📥', label: 'Topup', color: 'bg-primary/10 text-primary border-primary/20', action: () => onExchangerNav?.('topup') },
    { icon: '📤', label: 'Withdraw', color: 'bg-secondary/10 text-secondary border-secondary/20', action: () => onExchangerNav?.('withdraw') },
    { icon: '🔄', label: 'Swap', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', action: () => onExchangerNav?.('swap') },
    { icon: '🔗', label: 'Invite', color: 'bg-green-500/10 text-green-500 border-green-500/20', action: handleCopy },
  ];

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
      
      {/* TICKER */}
      <div className="w-full overflow-hidden bg-primary/5 border-y border-white/5 py-2 -mx-6 px-6 mb-2 backdrop-blur-sm sticky top-[68px] z-30">
        <div className="flex whitespace-nowrap animate-marquee gap-12 text-[9px] font-black uppercase tracking-widest text-primary/80">
          <span>⚡ NODE ACTIVE: {user.email.split('@')[0].toUpperCase()}</span>
          <span>💎 USDT/INR: ₹92.45 (+0.4%)</span>
          <span>🔥 NETWORK VOLUME: $4.2M</span>
          <span>🚀 NEW POOL 5 ENTRY FROM ID #8291</span>
          <span>⚡ NODE ACTIVE: {user.email.split('@')[0].toUpperCase()}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* HERO CARD */}
        <section className="lg:col-span-7 relative">
          <div className="relative overflow-hidden rounded-[2.5rem] p-6 sm:p-8 bg-gradient-to-br from-slate-900 via-darker to-slate-900 border border-white/10 shadow-2xl min-h-[220px] flex flex-col justify-between group">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/30 transition-all"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-secondary/20 blur-[100px] rounded-full"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-1">Elite Nexus Voyager</p>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Agent {user.email.split('@')[0]}</h2>
              </div>
              <div className="w-12 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-md opacity-80 flex items-center justify-center shadow-lg">
                <div className="w-8 h-6 border border-black/20 rounded-sm"></div>
              </div>
            </div>

            <div className="relative z-10 my-4">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Main Vault Balance</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black tracking-tighter text-white">${wallet?.balance?.toFixed(2) || '0.00'}</span>
                <span className="text-primary font-black text-xs uppercase tracking-widest">USDT</span>
              </div>
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

          {/* QUICK ACTIONS */}
          <div className="grid grid-cols-4 gap-3 mt-4">
             {quickActions.map((action, i) => (
               <button 
                key={i} 
                onClick={action.action}
                className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl border transition-all active:scale-90 ${action.color}`}
               >
                 <span className="text-xl">{action.icon}</span>
                 <span className="text-[10px] font-bold uppercase tracking-widest">{action.label}</span>
               </button>
             ))}
          </div>
        </section>

        {/* STATS */}
        <div className="lg:col-span-5 glass rounded-[2.5rem] p-6 border-white/5 flex flex-col justify-between gap-6">
          <div className="flex justify-between items-center">
             <h3 className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Evolution Status</h3>
             <span className="bg-secondary/20 text-secondary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">Tier 4 Elite</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
               <svg className="w-full h-full transform -rotate-90">
                <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-900" />
                <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray="263.8" strokeDashoffset="66" className="text-secondary drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-xl italic">P4</div>
            </div>
            <div className="flex-1 space-y-2">
               <p className="text-lg font-black italic text-white uppercase leading-none">Nexus Voyager</p>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Next Rank: <span className="text-secondary">Nexus Prime</span></p>
               <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-[75%]"></div>
               </div>
            </div>
          </div>
          
          <div className="bg-darker/60 rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2">
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Referral Engine</span>
                 <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${user.is_active ? 'bg-primary/10 text-primary' : 'bg-red-500/10 text-red-500'}`}>
                   {user.is_active ? 'ID Active' : 'ID Inactive'}
                 </span>
               </div>
               {copied && <span className="text-[8px] text-primary font-black animate-bounce tracking-widest">COPIED!</span>}
            </div>
            <div className="flex gap-2">
              <input readOnly value={referralLink} className="flex-1 bg-transparent border-none outline-none font-mono text-[10px] text-slate-400" />
              <button onClick={handleCopy} className="text-primary text-xs hover:scale-110 active:scale-90 transition-all">📋</button>
            </div>
          </div>
        </div>
      </div>

      {/* SWIPEABLE STATS */}
      <div className="flex overflow-x-auto gap-4 pb-2 -mx-2 px-2 no-scrollbar">
        {[
          { label: 'Revenue', value: `$${wallet.total_earned}`, trend: '+12%', color: 'text-green-400', sparkColor: '#10b981' },
          { label: 'Directs', value: '42 Active', trend: '+2', color: 'text-primary', sparkColor: '#06b6d4' },
          { label: 'Team', value: '1,204', trend: '+18', color: 'text-secondary', sparkColor: '#a855f7' },
          { label: 'Rewards', value: '$840', trend: 'Claim', color: 'text-amber-400', sparkColor: '#fbbf24' },
        ].map((stat, i) => (
          <div key={i} className="glass min-w-[160px] flex-shrink-0 p-5 rounded-[2rem] border-white/5 relative overflow-hidden">
            <h3 className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{stat.label}</h3>
            <p className={`text-xl font-black tracking-tighter mb-4 ${stat.color}`}>{stat.value}</p>
            <div className="h-8 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <Line type="monotone" dataKey="v" stroke={stat.sparkColor} strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}
      </div>

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
