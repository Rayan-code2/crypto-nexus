import React, { useState, useEffect } from 'react';
import { User, Transaction } from '../types';
import { mockApi } from '../lib/mockApi';
import { 
  TrendingUp, 
  Users, 
  Zap, 
  ArrowUpRight, 
  Filter,
  Calendar,
  Search,
  Copy,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface IncomeDetailsProps {
  user: User;
}

const IncomeDetails: React.FC<IncomeDetailsProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getLevelFromTx = (tx: Transaction) => {
    // Check various possible property names for level
    const level = tx.income_level ?? (tx as any).level ?? (tx as any).incomeLevel;
    if (level !== undefined && level !== null && level !== '') return level;
    
    // Fallback: Try to extract from ID if it follows a pattern
    if (tx.type === 'level' && tx.id.toLowerCase().includes('level')) {
      const match = tx.id.match(/level_?(\d+)/i);
      if (match) return match[1];
    }
    return null;
  };

  const incomeTypes = [
    { id: 'all', label: 'All Income', icon: <Filter size={14} /> },
    { id: 'roi', label: 'ROI Income', icon: <TrendingUp size={14} /> },
    { id: 'pool', label: 'Pool Income', icon: <Zap size={14} /> },
    { id: 'level', label: 'Level Income', icon: <Users size={14} /> },
    { id: 'direct', label: 'Direct Income', icon: <ArrowUpRight size={14} /> },
  ];

  const filteredTransactions = transactions.filter(tx => {
    const matchesFilter = filter === 'all' ? ['roi', 'pool', 'level', 'direct', 'pool_payout'].includes(tx.type) : (tx.type === filter || (filter === 'pool' && tx.type === 'pool_payout'));
    const matchesSearch = tx.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         tx.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tx.from_user_id && tx.from_user_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (getLevelFromTx(tx) && `l${getLevelFromTx(tx)} level ${getLevelFromTx(tx)}`.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const stats = {
    roi: transactions.filter(t => t.type === 'roi').reduce((acc, t) => acc + t.amount, 0),
    pool: transactions.filter(t => t.type === 'pool' || t.type === 'pool_payout').reduce((acc, t) => acc + t.amount, 0),
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
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Search by ID or Source..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-darker border border-white/5 rounded-xl py-2 pl-9 pr-4 text-[10px] font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-primary/30 transition-all"
            />
          </div>
          <div className="flex gap-2 bg-darker p-1 rounded-xl border border-white/5 overflow-x-auto no-scrollbar">
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
      <div className="glass rounded-[2.5rem] border-white/5 overflow-hidden shadow-2xl shadow-black/20">
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Income Ledger</h3>
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{filteredTransactions.length} Entries Found</span>
        </div>
        
        <div className="divide-y divide-white/5">
          {filteredTransactions.length === 0 ? (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search size={24} className="text-slate-700" />
              </div>
              <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs italic">No matching income streams detected...</p>
            </div>
          ) : (
            filteredTransactions.map((tx) => (
              <div key={tx.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-white/[0.03] transition-all group relative">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${
                    tx.type === 'roi' ? 'bg-cyan-400/10 text-cyan-400' :
                    (tx.type === 'pool' || tx.type === 'pool_payout') ? 'bg-amber-400/10 text-amber-400' :
                    tx.type === 'level' ? 'bg-secondary/10 text-secondary' :
                    'bg-green-400/10 text-green-400'
                  }`}>
                    {tx.type === 'roi' ? <TrendingUp size={24} /> :
                     (tx.type === 'pool' || tx.type === 'pool_payout') ? <Zap size={24} /> :
                     tx.type === 'level' ? <Users size={24} /> :
                     <ArrowUpRight size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-white uppercase tracking-tight">
                        {tx.type === 'level' 
                          ? (getLevelFromTx(tx) ? `LEVEL ${getLevelFromTx(tx)} INCOME` : 'LEVEL INCOME')
                          : tx.type === 'pool_payout' ? 'Pool Payout' : `${tx.type} Income`}
                      </p>
                      {getLevelFromTx(tx) && (
                        <span className="text-[10px] px-3 py-1 rounded-lg bg-primary text-darker font-black uppercase tracking-widest shadow-lg shadow-primary/20">
                          LEVEL {getLevelFromTx(tx)}
                        </span>
                      )}
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20">
                        <CheckCircle2 size={8} className="text-green-500" />
                        <span className="text-[7px] text-green-500 font-black uppercase tracking-widest">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar size={10} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">
                          {new Date(tx.created_at).toLocaleDateString()} {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      {tx.from_user_id && (
                        <div className="flex items-center gap-1.5 text-primary/60">
                          <Users size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">From: {tx.from_user_id.slice(0, 8)}...</span>
                        </div>
                      )}

                      {getLevelFromTx(tx) && (
                        <div className="flex items-center gap-1.5 text-secondary">
                          <Users size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-widest">LEVEL: {getLevelFromTx(tx)}</span>
                        </div>
                      )}

                      <button 
                        onClick={() => copyToClipboard(tx.id)}
                        className="flex items-center gap-1.5 text-slate-600 hover:text-slate-400 transition-colors"
                      >
                        {copiedId === tx.id ? <CheckCircle2 size={10} className="text-green-500" /> : <Copy size={10} />}
                        <span className="text-[9px] font-mono uppercase tracking-tighter">ID: {tx.id.slice(0, 12)}</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 sm:mt-0 text-left sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="text-primary font-black text-sm">$</span>
                    <p className="text-2xl font-black text-white tracking-tighter">+{tx.amount.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">USDT Protocol</p>
                    <div className="w-1 h-1 rounded-full bg-slate-800 hidden sm:block"></div>
                    <button className="text-[8px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                      Details <ExternalLink size={8} />
                    </button>
                  </div>
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
