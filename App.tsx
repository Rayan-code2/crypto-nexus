
import React, { useState, useEffect, useCallback } from 'react';
import { User, Wallet } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import MatrixTree from './pages/MatrixTree';
import AutoPools from './pages/AutoPools';
import Exchanger from './pages/Exchanger';
import TaskCenter from './pages/TaskCenter';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import { mockApi } from './lib/mockApi';
import { BRAND_CONFIG } from './brandConfig';

const App: React.FC = () => {
  console.log("App component mounted (Mock Mode)");
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('nexus_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exchangerSubTab, setExchangerSubTab] = useState<'topup' | 'withdraw' | 'swap'>('topup');
  const [wallet, setWallet] = useState<Wallet>({ id: '', user_id: '', balance: 0, total_earned: 0, total_withdrawn: 0 });

  const fetchUserData = useCallback(async (user: User) => {
    try {
      const walletData = await mockApi.db.getWallet(user.id);
      if (walletData) {
        setWallet(walletData);
      }
      if (user.role === 'admin') setActiveTab('admin');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        // 1. Check for Appwrite session first
        const user = await mockApi.auth.getCurrentUser?.();
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('nexus_user', JSON.stringify(user));
          await fetchUserData(user);
        } else if (currentUser) {
          // 2. If no Appwrite but local user exists, fetch their data
          await fetchUserData(currentUser);
        }
      } catch (e) {
        console.error("Initialization failed", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [currentUser, fetchUserData]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('nexus_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    try {
      await mockApi.auth.signOut();
      setCurrentUser(null);
      setWallet({ id: '', user_id: '', balance: 0, total_earned: 0, total_withdrawn: 0 });
      setActiveTab('dashboard');
      localStorage.removeItem('nexus_user');
    } catch (e) {
      console.error("Logout failed", e);
      // Fallback
      setCurrentUser(null);
      setWallet({ id: '', user_id: '', balance: 0, total_earned: 0, total_withdrawn: 0 });
      localStorage.removeItem('nexus_user');
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen bg-darker flex flex-col items-center justify-center gap-6 text-primary">
        <div className="relative">
          <div className="w-16 h-16 border-2 border-primary/20 rounded-full"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="font-black uppercase tracking-[0.3em] text-[10px] animate-pulse text-primary italic">Syncing with Nexus Mainframe</span>
          <span className="text-slate-500 font-bold text-[9px] uppercase tracking-widest">Initializing Protocol...</span>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Login onLogin={handleLogin} onDemoMode={() => {}} />;

  const isUserAdmin = currentUser.role?.toLowerCase() === 'admin';

  const navigateToExchanger = (subTab: 'topup' | 'withdraw' | 'swap') => {
    setExchangerSubTab(subTab);
    setActiveTab('exchanger');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard user={currentUser} wallet={wallet} onExchangerNav={navigateToExchanger} onNavigate={setActiveTab} />;
      case 'matrix': return <MatrixTree user={currentUser} />;
      case 'pools': return <AutoPools user={currentUser} />;
      case 'exchanger': return <Exchanger user={currentUser} wallet={wallet} initialSubTab={exchangerSubTab} />;
      case 'tasks': return <TaskCenter user={currentUser} wallet={wallet} />;
      case 'admin': return isUserAdmin ? <AdminPanel /> : <Dashboard user={currentUser} wallet={wallet} onExchangerNav={navigateToExchanger} onNavigate={setActiveTab} />;
      default: return <Dashboard user={currentUser} wallet={wallet} onExchangerNav={navigateToExchanger} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-darker text-slate-100 font-sans overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={currentUser.role as any} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col relative overflow-y-auto custom-scrollbar">
        <header className={`sticky top-0 z-40 glass border-b border-white/5 px-6 py-4 flex justify-between items-center transition-all`}>
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent uppercase tracking-tighter truncate">
              {activeTab === 'admin' ? 'System Console' : activeTab}
            </h1>
            {isUserAdmin && (
              <button 
                onClick={() => setActiveTab('admin')}
                className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all opacity-0 hover:opacity-100"
                title="System Console"
              >
                <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden xs:block">
                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Vault Balance</p>
                <p className="text-lg font-black text-primary">${wallet?.balance?.toFixed(2) || '0.00'}</p>
             </div>
             <div className="flex items-center gap-2">
               <button 
                 onClick={handleLogout}
                 className="md:hidden w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 active:scale-90 transition-all"
                 title="Logout"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                 </svg>
               </button>
               <button 
                 onClick={() => isUserAdmin ? setActiveTab(activeTab === 'admin' ? 'dashboard' : 'admin') : setActiveTab('dashboard')} 
                 className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95"
               >
                 <div className="w-full h-full bg-darker rounded-full flex items-center justify-center overflow-hidden font-black text-primary italic text-sm">
                   {BRAND_CONFIG.shortName[0]}
                 </div>
               </button>
             </div>
          </div>
        </header>
        <div className="p-4 sm:p-6 pb-24 sm:pb-6">{renderContent()}</div>
      </main>
    </div>
  );
};

export default App;
