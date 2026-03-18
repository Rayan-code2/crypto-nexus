
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { mockApi } from '../lib/mockApi';
import { POOL_NAMES } from '../constants';

const AutoPools: React.FC<{ user: User }> = ({ user }) => {
  const [userPools, setUserPools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isQualified, setIsQualified] = useState(user.is_qualified || user.direct_count >= 3);

  const fetchPools = async () => {
    try {
      const data = await mockApi.db.getPools(user.id);
      setUserPools(data || []);
      // Force qualification if we have any pool data (demo mode)
      if (data && data.length > 0) {
        setIsQualified(true);
      }
    } catch (e) {
      console.error("Error fetching pools:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, [user.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary italic uppercase tracking-tighter">Spiral AutoPool Core</h2>
          <p className="text-slate-400 text-sm font-medium">Global FIFO Matrix. No manual entry. Qualify via Direct Referrals.</p>
        </div>
        <div className="flex items-center gap-4">
          {!isQualified && (
            <div className="glass px-4 py-2 rounded-xl border border-primary/20 bg-primary/5">
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">Qualification Pending</p>
              <p className="text-sm font-bold text-white">{isQualified ? 3 : (user.direct_count || 0)} / 3 Directs Required</p>
            </div>
          )}
          {isQualified && (
            <div className="glass px-4 py-2 rounded-xl border border-green-500/20 bg-green-500/5">
              <p className="text-[10px] text-green-500 font-black uppercase tracking-widest">Qualified</p>
              <p className="text-sm font-bold text-white">3 / 3 Directs Achieved</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {POOL_NAMES.map((name, index) => {
          const poolNum = index + 1;
          const requiredMembers = poolNum === 1 ? 4 : 6;
          
          // Find all entries for this pool number (could be rebirths)
          const entries = userPools.filter(p => p.pool_number === poolNum);
          const activeEntry = entries.find(p => p.status === 'active');
          const completedEntries = entries.filter(p => p.status === 'completed');
          const isCompleted = completedEntries.length > 0 && !activeEntry;
          const isLocked = !isQualified || (poolNum > 1 && !userPools.some(p => p.pool_number >= poolNum));
          
          // Calculate rewards based on plan
          const entryValue = poolNum === 1 ? 10 : 
                            poolNum === 2 ? 20 : 
                            Math.pow(2.4, poolNum - 2) * 20;
          
          const totalFund = entryValue * requiredMembers;
          let walletAmount = 0;
          let upgradeAmount = 0;

          if (poolNum === 1) {
            walletAmount = 10;
            upgradeAmount = 20;
          } else if (poolNum <= 9) {
            walletAmount = totalFund * 0.5;
            upgradeAmount = totalFund * 0.4;
          } else {
            walletAmount = totalFund * 0.9;
            upgradeAmount = 0;
          }

          return (
            <div key={poolNum} className={`glass p-6 rounded-[2.5rem] border-white/5 relative overflow-hidden transition-all duration-500 ${
              isLocked ? 'opacity-40 grayscale' : 'bg-slate-900/40 shadow-xl shadow-primary/5'
            }`}>
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className={`text-[9px] uppercase font-black tracking-[0.2em] px-3 py-1 rounded-full mb-2 inline-block ${
                    isCompleted ? 'bg-green-500/10 text-green-500' : 
                    !isLocked ? 'bg-primary/10 text-primary' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? 'Completed' : isLocked ? 'Locked' : 'Active'}
                  </span>
                  <h3 className="text-xl font-black italic uppercase text-white">{name}</h3>
                  <div className="flex items-center gap-2">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Tier {poolNum}</p>
                    {completedEntries.length > 0 && (
                      <span className="text-[7px] bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">
                        {completedEntries.length} Cycle(s) Done
                      </span>
                    )}
                    {activeEntry && completedEntries.length > 0 && (
                      <span className="text-[7px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">
                        Re-entry Active
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Total Fund</p>
                  <p className="text-sm font-black text-white">${totalFund.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-darker/40 p-4 rounded-2xl border border-white/5">
                  <div>
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">You Get</p>
                    <p className="text-sm font-black text-primary">${walletAmount.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Next Upgrade</p>
                    <p className="text-sm font-black text-secondary">${upgradeAmount.toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                    <span className="text-slate-500">
                      {entries.filter(p => p.status === 'completed').length > 0 ? `Cycle ${entries.filter(p => p.status === 'completed').length + 1} Filling` : 'Global Filling'}
                    </span>
                    <span className="text-white">
                      {activeEntry ? activeEntry.members_count : isCompleted ? requiredMembers : 0} / {requiredMembers} Slots
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-primary to-secondary'}`} 
                      style={{ width: `${Math.min(((activeEntry ? activeEntry.members_count : isCompleted ? requiredMembers : 0) / requiredMembers) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Array.from({ length: requiredMembers }).map((_, i) => {
                    const isFilled = activeEntry ? i < activeEntry.members_count : isCompleted;
                    return (
                      <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all duration-500 ${
                        isFilled ? 'bg-primary text-darker shadow-lg shadow-primary/20' : 'bg-slate-800 text-slate-600'
                      }`}>
                        {isFilled ? '✓' : i + 1}
                      </div>
                    );
                  })}
                </div>

                <div className="pt-4 border-t border-white/5">
                  {isLocked ? (
                    <p className="text-[9px] text-center font-bold text-slate-500 uppercase tracking-widest">
                      {poolNum === 1 ? 'Qualify with 3 directs to enter' : `Complete ${POOL_NAMES[index-1]} to unlock`}
                    </p>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-primary animate-pulse'}`}></div>
                      <p className={`text-[9px] font-black uppercase tracking-widest ${isCompleted ? 'text-green-500' : 'text-primary'}`}>
                        {isCompleted ? 'Cycle Finished' : 'Global Filling Active'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {activeEntry?.id?.includes('rebirth') && (
                <div className="absolute -right-8 -top-8 w-24 h-24 bg-secondary/10 rounded-full flex items-end justify-center pb-4 rotate-45">
                  <span className="text-[8px] font-black text-secondary uppercase tracking-tighter">Rebirth ID</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AutoPools;
