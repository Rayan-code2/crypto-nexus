
import React from 'react';
import { User } from '../types';

const AutoPools: React.FC<{ user: User }> = ({ user }) => {
  const pools = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `Pool ${i + 1}`,
    entryFee: (i + 1) * 10,
    progress: i === 0 ? 75 : i < 3 ? 100 : 0,
    status: i < 3 ? 'Completed' : i === 3 ? 'Active' : 'Locked',
    reward: (i + 1) * 25,
  }));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">10-Tier AutoPool System</h2>
          <p className="text-slate-400 text-sm">Progress through pools as new members join globally. Earn passive rewards automatically.</p>
        </div>
        <div className="glass px-4 py-2 rounded-xl flex items-center gap-3">
          <span className="text-amber-500 text-xl">🏆</span>
          <div>
            <p className="text-xs text-slate-500">Current Rank</p>
            <p className="font-bold">Pool 4 Contender</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {pools.map((pool) => (
          <div key={pool.id} className={`glass p-6 rounded-3xl relative overflow-hidden transition-all duration-300 ${
            pool.status === 'Locked' ? 'opacity-50 grayscale' : 'neon-border scale-[1.02]'
          }`}>
            {pool.status === 'Locked' && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-darker/40 backdrop-blur-[2px]">
                <div className="bg-slate-800 p-3 rounded-full">🔒</div>
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full mb-1 inline-block ${
                  pool.status === 'Completed' ? 'bg-green-500/10 text-green-500' : 
                  pool.status === 'Active' ? 'bg-primary/10 text-primary' : 'bg-slate-700 text-slate-400'
                }`}>
                  {pool.status}
                </span>
                <h3 className="text-xl font-bold">{pool.name}</h3>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Potential Reward</p>
                <p className="font-bold text-primary">${pool.reward} USDT</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">Cycle Progress</span>
                  <span className="text-slate-100">{pool.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 bg-gradient-to-r from-primary to-secondary`} 
                    style={{ width: `${pool.progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((slot) => (
                  <div key={slot} className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                    pool.progress >= slot * 25 ? 'bg-primary text-darker' : 'bg-slate-800 text-slate-600'
                  }`}>
                    M{slot}
                  </div>
                ))}
              </div>

              <button 
                disabled={pool.status === 'Locked'}
                className={`w-full py-3 rounded-xl font-bold transition-all ${
                  pool.status === 'Completed' ? 'bg-green-500/20 text-green-500 cursor-default' :
                  pool.status === 'Active' ? 'bg-primary text-darker hover:bg-cyan-500' :
                  'bg-slate-800 text-slate-500'
                }`}
              >
                {pool.status === 'Completed' ? 'Rewards Collected' : pool.status === 'Active' ? 'Auto Progressing...' : 'Complete Pool 3 to Unlock'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AutoPools;
