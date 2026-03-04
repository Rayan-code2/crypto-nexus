
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDownline = async () => {
      try {
        const data = await mockApi.db.getMatrixDownline(user.id);
        setDownline(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchDownline();
  }, [user.id]);

  // Simple logic to assign left/right for level 1
  const leftNode = downline[0] || null;
  const rightNode = downline[1] || null;

  return (
    <div className="flex flex-col items-center space-y-12 animate-in slide-in-from-bottom duration-500">
      <div className="text-center max-w-xl">
        <h2 className="text-2xl font-bold mb-2 text-primary">Binary Matrix Tree</h2>
        <p className="text-slate-400 text-sm">Visualizing your 2x2 forced matrix structure. Direct referrals are automatically placed left-to-right to fill gaps.</p>
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
            <p className="text-xs text-slate-500">Total Referrals</p>
            <p className="text-xl font-bold">{downline.length}</p>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-xs text-slate-500">Active Nodes</p>
            <p className="text-xl font-bold">{downline.filter(u => !u.is_blocked).length}</p>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-xs text-slate-500">Matrix Level</p>
            <p className="text-xl font-bold text-amber-500">1</p>
          </div>
          <div className="glass p-4 rounded-xl text-center">
            <p className="text-xs text-slate-500">Direct Bonus</p>
            <p className="text-xl font-bold text-primary">${downline.length * 10}</p>
          </div>
      </div>
    </div>
  );
};

export default MatrixTree;
