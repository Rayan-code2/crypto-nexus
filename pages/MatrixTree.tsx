
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { mockApi } from '../lib/mockApi';
import { Zap, Shield, Target, Award, Users, ChevronDown } from 'lucide-react';

interface MatrixNodeProps {
  user: { id: string; email: string; label: string; is_active?: boolean } | null;
  level: number;
  position?: 'left' | 'right' | 'root';
}

const MatrixTree: React.FC<{ user: User }> = ({ user }) => {
  const [downline, setDownline] = useState<any[]>([]);
  const [directs, setDirects] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [levelStats, setLevelStats] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    const fetchDownline = async () => {
      try {
        const [matrixData, directData, allUsersData] = await Promise.all([
          mockApi.db.getMatrixDownline(user.id),
          mockApi.db.getDirectReferrals(user.id),
          mockApi.db.getAllUsers()
        ]);
        setDownline(matrixData);
        setDirects(directData);
        setAllUsers(allUsersData);
        
        const stats: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
        const parentToChildren: { [key: string]: string[] } = {};
        
        allUsersData.forEach(u => {
          if ((u as any).matrix_parent_id) {
            if (!parentToChildren[(u as any).matrix_parent_id]) parentToChildren[(u as any).matrix_parent_id] = [];
            parentToChildren[(u as any).matrix_parent_id].push(u.id);
          }
        });

        let currentLevelUsers = [user.id];
        for (let l = 1; l <= 7; l++) {
          const nextLevelUsers: string[] = [];
          currentLevelUsers.forEach(pid => {
            const children = parentToChildren[pid] || [];
            nextLevelUsers.push(...children);
          });
          stats[l] = nextLevelUsers.length;
          currentLevelUsers = nextLevelUsers;
          if (currentLevelUsers.length === 0) break;
        }
        setLevelStats(stats);

      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDownline();
  }, [user.id]);

  if (loading) return <div className="flex items-center justify-center h-96"><div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="space-y-12 animate-in fade-in zoom-in duration-1000 relative">
      {/* BACKGROUND TOPOLOGY EFFECT */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-30">
        <svg className="w-full h-full" viewBox="0 0 1000 1000">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(6,182,212,0.15)" strokeWidth="0.5"/>
            </pattern>
            <radialGradient id="grad-radial" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(6,182,212,0.1)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <circle cx="500" cy="400" r="500" fill="url(#grad-radial)" />
        </svg>
      </div>

      {/* Header Section */}
      <div className="relative p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3.5rem] bg-darker border border-primary/20 overflow-hidden group shadow-[0_0_50px_rgba(6,182,212,0.1)]">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 blur-[120px] rounded-full group-hover:bg-primary/10 transition-all duration-1000"></div>
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary/5 blur-[100px] rounded-full"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 sm:gap-8">
          <div className="space-y-2 sm:space-y-3 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 text-primary shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Target size={20} className="animate-pulse sm:w-[22px] sm:h-[22px]" />
              </div>
              <span className="text-[9px] sm:text-[11px] font-black text-primary uppercase tracking-[0.4em] sm:tracking-[0.6em]">Network Analytics v4.0</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white italic uppercase tracking-tighter">Network <span className="text-primary">Intelligence</span></h2>
            <p className="text-slate-500 text-xs sm:text-sm font-medium max-w-xl">Comprehensive overview of your direct referrals and multi-level network performance.</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 w-full">
          {[
            { label: 'Total Direct', value: directs.length, icon: Users },
            { label: 'Active Nodes', value: directs.filter(u => u.is_active).length, icon: Zap },
            { label: 'Network Value', value: `$${directs.filter(u => u.is_active).length * 5}`, icon: Target },
          ].map((stat, i) => (
            <div key={i} className="glass p-3 sm:p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/5 to-transparent relative overflow-hidden group hover:border-amber-400/50 transition-all flex flex-col items-center justify-center text-center">
              <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:opacity-10 transition-opacity text-amber-400">
                <stat.icon size={24} className="sm:w-[32px] sm:h-[32px]" />
              </div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="p-1.5 sm:p-2 rounded-lg bg-amber-500/10 text-amber-400 mb-2 group-hover:scale-110 transition-transform">
                  <stat.icon size={16} className="sm:w-[20px] sm:h-[20px]" />
                </div>
                <p className="text-[7px] sm:text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] mb-1">{stat.label}</p>
                <p className="text-sm sm:text-2xl font-black text-amber-400 italic tracking-tighter drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">{stat.value}</p>
              </div>
              {/* Gold Shine Effect */}
              <div className="absolute -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shine_1.5s_ease-in-out_infinite]" />
            </div>
          ))}
      </div>

      {/* Direct Referrals List */}
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Direct Referrals Status</h3>
          <span className="text-[10px] font-bold text-primary/60">{directs.length} Total</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {directs.map((direct) => (
            <div key={direct.id} className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:border-primary/30 transition-all relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg transition-all duration-500 ${
                  direct.is_active 
                    ? 'bg-primary/20 text-primary shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {direct.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-black text-white italic tracking-tight">{direct.email.split('@')[0]}</p>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">ID: {direct.id.slice(0, 8)}...</p>
                </div>
              </div>
              <div className="flex flex-col items-end relative z-10">
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                  direct.is_active 
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                }`}>
                  <div className={`w-1 h-1 rounded-full ${direct.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                  {direct.is_active ? 'Active' : 'Inactive'}
                </div>
                <p className="text-[7px] font-bold text-slate-600 mt-1 uppercase tracking-tighter">
                  {direct.is_active ? 'Generating Income' : 'Pending Activation'}
                </p>
              </div>
            </div>
          ))}
          {directs.length === 0 && (
            <div className="col-span-full glass p-8 rounded-2xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center">
              <Users size={32} className="text-slate-700 mb-2" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No direct referrals yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Level Distribution Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6, 7].map((lvl) => (
          <div key={lvl} className="glass p-5 rounded-[2rem] border border-white/5 flex items-center justify-between hover:border-primary/40 transition-all group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-white/5 flex items-center justify-center text-xs font-black text-slate-500 group-hover:bg-primary group-hover:text-darker group-hover:border-primary transition-all duration-500">
                G{lvl}
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Generation {lvl}</p>
                <p className="text-sm font-black text-white italic">Total Members</p>
              </div>
            </div>
            <div className="text-right relative z-10">
              <p className="text-2xl font-black text-primary italic tracking-tighter">{levelStats[lvl] || 0}</p>
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Active Nodes</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MatrixTree;
