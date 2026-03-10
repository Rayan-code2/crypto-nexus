
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { mockApi } from '../lib/mockApi';

interface MatrixNodeProps {
  user: { id: string; email: string; label: string } | null;
  level: number;
}

const MatrixNode: React.FC<MatrixNodeProps> = ({ user, level }) => {
  return (
    <div className="flex flex-col items-center">
      <div className={`
        relative w-16 h-16 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center p-2 transition-all duration-300
        ${user ? 'bg-primary/20 border-2 border-primary neon-border cursor-pointer hover:scale-105' : 'bg-slate-800/50 border-2 border-dashed border-slate-600'}
      `}>
        {user ? (
          <>
            <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-primary flex items-center justify-center text-darker font-bold mb-1">
              {user.email[0].toUpperCase()}
            </div>
            <span className="text-[10px] sm:text-xs font-bold text-white truncate max-w-full">{user.label}</span>
          </>
        ) : (
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Empty</span>
        )}
      </div>
    </div>
  );
};

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
        
        // Calculate level stats (Matrix-based)
        const stats: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
        const parentToChildren: { [key: string]: string[] } = {};
        
        allUsersData.forEach(u => {
          if (u.matrix_parent_id) {
            if (!parentToChildren[u.matrix_parent_id]) parentToChildren[u.matrix_parent_id] = [];
            parentToChildren[u.matrix_parent_id].push(u.id);
          }
        });

        // BFS to find levels
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

  // Matrix Tree visualization uses matrix_parent_id (downline)
  const leftNode = downline.find(u => u.matrix_position === 'left') || downline[0] || null;
  const rightNode = downline.find(u => u.matrix_position === 'right') || (downline.length > 1 ? downline[1] : null);

  return (
    <div className="flex flex-col items-center space-y-12 animate-in slide-in-from-bottom duration-500">
      <div className="text-center max-w-xl">
        <h2 className="text-2xl font-bold mb-2 text-primary italic uppercase tracking-tighter">Binary Matrix Tree</h2>
        <p className="text-slate-400 text-xs font-medium uppercase tracking-widest">Visualizing your 2×2 forced matrix structure. Direct referrals are automatically placed left-to-right to fill gaps.</p>
      </div>

      <div className="relative w-full max-w-4xl overflow-x-auto pb-12 custom-scrollbar flex flex-col items-center">
        {/* Root */}
        <MatrixNode user={{ id: user.id, email: user.email, label: 'Me (Root)' }} level={0} />

        {/* Connector Layer 1 */}
        <div className="h-12 w-0.5 bg-slate-700 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[200px] sm:w-[350px] h-0.5 bg-slate-700"></div>
        </div>

        {/* Level 1 Nodes */}
        <div className="flex justify-between w-[200px] sm:w-[350px]">
          <div className="flex flex-col items-center">
            <div className="h-6 w-0.5 bg-slate-700"></div>
            <MatrixNode 
              user={leftNode ? { id: leftNode.id, email: leftNode.email, label: leftNode.email.split('@')[0] } : null} 
              level={1} 
            />
            
            {/* Connector Layer 2 (Left) */}
            <div className="h-8 w-0.5 bg-slate-800">
                <div className="absolute left-1/2 -translate-x-1/2 w-[100px] h-0.5 bg-slate-800"></div>
            </div>
            <div className="flex justify-between w-[100px]">
               <div className="flex flex-col items-center">
                 <div className="h-4 w-0.5 bg-slate-800"></div>
                 <MatrixNode user={null} level={2} />
               </div>
               <div className="flex flex-col items-center">
                 <div className="h-4 w-0.5 bg-slate-800"></div>
                 <MatrixNode user={null} level={2} />
               </div>
            </div>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="h-6 w-0.5 bg-slate-700"></div>
            <MatrixNode 
              user={rightNode ? { id: rightNode.id, email: rightNode.email, label: rightNode.email.split('@')[0] } : null} 
              level={1} 
            />

            {/* Connector Layer 2 (Right) */}
            <div className="h-8 w-0.5 bg-slate-800">
                <div className="absolute left-1/2 -translate-x-1/2 w-[100px] h-0.5 bg-slate-800"></div>
            </div>
            <div className="flex justify-between w-[100px]">
               <div className="flex flex-col items-center">
                 <div className="h-4 w-0.5 bg-slate-800"></div>
                 <MatrixNode user={null} level={2} />
               </div>
               <div className="flex flex-col items-center">
                 <div className="h-4 w-0.5 bg-slate-800"></div>
                 <MatrixNode user={null} level={2} />
               </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Team</p>
            <p className="text-xl font-black text-white">{Object.values(levelStats).reduce((a: number, b: number) => a + b, 0)}</p>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Nodes</p>
            <p className="text-xl font-black text-white">{directs.filter(u => u.is_active).length}</p>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Matrix Level</p>
            <p className="text-xl font-black text-amber-500 italic">1</p>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Direct Bonus</p>
            <p className="text-xl font-black text-primary italic">${directs.filter(u => u.is_active).length * 5}</p>
          </div>
      </div>

      {/* Level-wise Distribution Section */}
      <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white italic uppercase tracking-wider">Level-wise Team Distribution</h3>
          <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-full uppercase tracking-widest">7 Levels Depth</span>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7].map((lvl) => (
            <div key={lvl} className="glass p-4 rounded-2xl border border-white/5 flex items-center justify-between hover:border-primary/30 transition-all group">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 group-hover:bg-primary group-hover:text-darker transition-colors">
                  L{lvl}
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Level {lvl}</p>
                  <p className="text-xs font-bold text-white">Generation {lvl}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-primary">{levelStats[lvl] || 0}</p>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Members</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatrixTree;
