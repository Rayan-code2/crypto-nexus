
import React from 'react';
import { Icons } from '../constants';
import { UserRole } from '../types';
import { BRAND_CONFIG } from '../brandConfig';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  userRole: UserRole;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, userRole, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Icons.Dashboard },
    { id: 'mining', label: 'Live Mining', icon: Icons.Pools },
    { id: 'matrix', label: 'Matrix Tree', icon: Icons.Network },
    { id: 'pools', label: 'Auto Pools', icon: Icons.Pools },
    { id: 'exchanger', label: 'Exchanger', icon: Icons.Exchanger },
    { id: 'tasks', label: 'Task Earning', icon: Icons.Tasks },
    { id: 'income', label: 'Income Details', icon: Icons.Income },
  ];

  // Robust check for admin status
  const isAdmin = userRole?.toString().toLowerCase() === 'admin';

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 glass border-r border-slate-800 h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center font-bold text-white italic">
              {BRAND_CONFIG.shortName[0]}
            </div>
            <span className="text-xl font-black tracking-tighter">
              {BRAND_CONFIG.name.slice(0, -BRAND_CONFIG.shortName.length)}
              <span className="text-primary">{BRAND_CONFIG.shortName}</span>
            </span>
          </div>
          
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-primary/10 text-primary border border-primary/20 neon-border' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                }`}
              >
                <item.icon />
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Tab Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-2xl border-t border-white/10 z-50 grid grid-cols-7 items-center py-3 px-1 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeTab === item.id ? 'text-primary scale-110' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-primary/10 shadow-[0_0_15px_rgba(6,182,212,0.2)]' : ''}`}>
              <item.icon />
            </div>
            <span className={`text-[8px] font-black whitespace-nowrap uppercase tracking-[0.1em] ${activeTab === item.id ? 'text-white' : 'text-slate-500'}`}>
              {item.id === 'dashboard' ? 'Home' : 
               item.id === 'mining' ? 'Mining' :
               item.id === 'matrix' ? 'Matrix' : 
               item.id === 'pools' ? 'Pools' : 
               item.id === 'exchanger' ? 'Swap' : 
               item.id === 'tasks' ? 'Tasks' : 'Income'}
            </span>
          </button>
        ))}
      </nav>
    </>
  );
};

export default Sidebar;
