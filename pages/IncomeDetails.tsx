
import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { mockApi } from '../lib/mockApi';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  RefreshCcw, 
  ArrowUpRight, 
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react';

interface IncomeDetailsProps {
  user: User;
}

const IncomeDetails: React.FC<IncomeDetailsProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const data = await mockApi.db.getTransactions(user.id);
        setTransactions(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, [user.id]);

  const incomeTypes = [
    { id: 'all', label: 'All Income', icon: <Filter size={14} /> },
    { id: 'roi', label: 'ROI Income', icon: <TrendingUp size={14} /> },
    { id: 'pool', label: 'Pool Income', icon: <Zap size={14} /> },
    { id: 'level', label: 'Level Income', icon: <Users size={14} /> },
    { id: 'direct', label: 'Direct Income', icon: <ArrowUpRight size={14} /> },
  ];

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return ['roi', 'pool', 'level', 'direct'].includes(tx.type);
    return tx.type === filter;
  });

  const stats = {
    roi: transactions.filter(t => t.type === 'roi').reduce((acc, t) => acc + t.amount, 0),
    pool: transactions.filter(t => t.type === 'pool').reduce((acc, t) => acc + t.amount, 0),
    level: transactions.filter(t => t.type === 'level').reduce((acc, t) => acc + t.amount, 0),
    direct: transactions.filter(t => t.type === 'direct').reduce((acc, t) => acc + t.amount, 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Earnings Protocol</h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em]">Detailed Income Stream Analysis</p>
        </div>
        
        <div className="flex gap-2 bg-darker p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar w-full md:w-auto">
          {incomeTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setFilter(type.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filter === type.id ? 'bg-primary text-darker shadow-lg shadow-primary/20' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {type.icon}
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'ROI Yield', value: stats.roi, color: 'text-cyan-400', icon: <TrendingUp size={16} />, bg: 'bg-cyan-400/10' },
          { label: 'Pool Rewards', value: stats.pool, color: 'text-amber-400', icon: <Zap size={16} />, bg: 'bg-amber-400/10' },
          { label: 'Level Bonus', value: stats.level, color: 'text-secondary', icon: <Users size={16} />, bg: 'bg-secondary/10' },
          { label: 'Direct Bonus', value: stats.direct, color: 'text-green-400', icon: <ArrowUpRight size={16} />, bg: 'bg-green-400/10' },
        ].map((stat, i) => (
          <div key={i} className="glass p-5 rounded-3xl border border-white/5 relative overflow-hidden group">
            <div className={`absolute -right-2 -top-2 w-12 h-12 ${stat.bg} rounded-full blur-xl opacity-50 group-hover:opacity-100 transition-opacity`}></div>
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                {stat.icon}
              </div>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{stat.label}</p>
            </div>
            <p className={`text-2xl font-black tracking-tighter ${stat.color}`}>${stat.value.toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Transactions List */}
      <div className="glass rounded-[2.5rem] border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 flex justify-between items-center">
          <h3 className="text-xs font-black uppercase tracking-widest text-white">Income Ledger</h3>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{filteredTransactions.length} Entries Found</span>
        </div>
        
        <div className="divide-y divide-white/5">
          {filteredTransactions.length === 0 ? (
            <div className="p-20 text-center">
              <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs italic">No income streams detected for this filter...</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    tx.type === 'roi' ? 'bg-cyan-400/10 text-cyan-400' :
                    tx.type === 'pool' ? 'bg-amber-400/10 text-amber-400' :
                    tx.type === 'level' ? 'bg-secondary/10 text-secondary' :
                    'bg-green-400/10 text-green-400'
                  }`}>
                    {tx.type === 'roi' ? <TrendingUp size={20} /> :
                     tx.type === 'pool' ? <Zap size={20} /> :
                     tx.type === 'level' ? <Users size={20} /> :
                     <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white capitalize">{tx.type} Income</p>
                      <span className="text-[8px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 font-black uppercase tracking-widest">
                        {tx.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Calendar size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                          {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-800"></div>
                      <span className="text-[9px] font-mono text-slate-600 uppercase tracking-tighter">ID: {tx.id.slice(0, 12)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <span className="text-primary font-black text-xs">$</span>
                    <p className="text-xl font-black text-white tracking-tighter">+{tx.amount.toFixed(2)}</p>
                  </div>
                  <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1">USDT Protocol</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomeDetails;
