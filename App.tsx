
import React, { useState, useEffect, useCallback } from 'react';
import { User, Wallet } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import MatrixTree from './pages/MatrixTree';
import AutoPools from './pages/AutoPools';
import Exchanger from './pages/Exchanger';
import TaskCenter from './pages/TaskCenter';
import IncomeDetails from './pages/IncomeDetails';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import InstallPrompt from './components/InstallPrompt';
import { mockApi } from './lib/mockApi';
import { BRAND_CONFIG } from './brandConfig';

import { isAppwriteConfigured, APPWRITE_CONFIG } from './lib/appwrite';
import { AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [isLive, setIsLive] = useState(isAppwriteConfigured());
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const checkConnection = useCallback(async () => {
    if (isLive) {
      try {
        // Use account.get() via mockApi for more reliable connection check
        await mockApi.auth.getCurrentUser();
        setConnectionError(null);
      } catch (e: any) {
        console.error("Connection check failed:", e);
        // Only show error if it's a network failure (Failed to fetch)
        if (e.message?.includes('Failed to fetch') || e.message?.includes('Network Error')) {
          setConnectionError("Cannot reach Appwrite. Please add Hostname to 'Platforms' in Appwrite Console.");
        } else {
          // If we got a different error (like 401), the server IS reachable
          setConnectionError(null);
        }
      }
    }
  }, [isLive]);

  useEffect(() => {
    checkConnection();
    
    // Periodic check every 2 minutes
    const interval = setInterval(checkConnection, 120000);
    return () => clearInterval(interval);
  }, [checkConnection]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('spiral_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exchangerSubTab, setExchangerSubTab] = useState<'topup' | 'withdraw' | 'swap'>('topup');
  const [wallet, setWallet] = useState<Wallet>({ id: '', user_id: '', balance: 0, total_earned: 0, total_withdrawn: 0 });
  const [pools, setPools] = useState<any[]>([]);
  const [telegramLink, setTelegramLink] = useState('https://t.me/cryptospiral');

  const fetchUserData = useCallback(async (user: User) => {
    try {
      // Distribute ROI if applicable (non-blocking)
      mockApi.db.distributeROI(user.id).catch(err => console.error("ROI Distribution failed", err));

      const [walletData, freshUser, poolsData, settings] = await Promise.all([
        mockApi.db.getWallet(user.id),
        mockApi.auth.getCurrentUser?.(),
        mockApi.db.getPools(user.id),
        mockApi.db.getSettings()
      ]);
      
      if (walletData) {
        setWallet(walletData);
      }
      if (poolsData) {
        setPools(poolsData);
      }
      if (settings?.telegram_link) {
        setTelegramLink(settings.telegram_link);
      }
      if (freshUser) {
        setCurrentUser(freshUser);
        localStorage.setItem('spiral_user', JSON.stringify(freshUser));
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
      if (!currentUser) {
        try {
          const user = await mockApi.auth.getCurrentUser();
          if (user) {
            setCurrentUser(user);
            localStorage.setItem('spiral_user', JSON.stringify(user));
            return;
          }
        } catch (e) {
          console.error("Session check failed", e);
        }
        setLoading(false);
        return;
      }
      
      fetchUserData(currentUser);
    };

    init();

    const interval = setInterval(() => {
      if (currentUser) fetchUserData(currentUser);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser?.id]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('spiral_user', JSON.stringify(user));
  };

  const handleLogout = async () => {
    console.log("🚀 Initializing Logout Sequence...");
    try {
      // Clear local state immediately for better UX
      setCurrentUser(null);
      setWallet({ id: '', user_id: '', balance: 0, total_earned: 0, total_withdrawn: 0 });
      setActiveTab('dashboard');
      localStorage.removeItem('spiral_user');
      
      // Attempt server-side sign out
      await mockApi.auth.signOut();
      console.log("✅ Logout Successful");
    } catch (e) {
      console.error("⚠️ Logout API call failed, but local session cleared", e);
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
          <span className="font-black uppercase tracking-[0.3em] text-[10px] animate-pulse text-primary italic">Syncing with Spiral Mainframe</span>
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
      case 'dashboard': return <Dashboard user={currentUser} wallet={wallet} pools={pools} onExchangerNav={navigateToExchanger} onNavigate={setActiveTab} isLive={isLive} />;
      case 'matrix': return <MatrixTree user={currentUser} />;
      case 'pools': return <AutoPools user={currentUser} />;
      case 'exchanger': return <Exchanger user={currentUser} wallet={wallet} initialSubTab={exchangerSubTab} />;
      case 'tasks': return <TaskCenter user={currentUser} wallet={wallet} />;
      case 'income': return <IncomeDetails user={currentUser} />;
      case 'admin': return isUserAdmin ? <AdminPanel user={currentUser} onLogout={handleLogout} /> : <Dashboard user={currentUser} wallet={wallet} pools={pools} onExchangerNav={navigateToExchanger} onNavigate={setActiveTab} />;
      default: return <Dashboard user={currentUser} wallet={wallet} pools={pools} onExchangerNav={navigateToExchanger} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-darker text-slate-100 font-sans overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} userRole={currentUser.role as any} onLogout={handleLogout} />
      <main className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden custom-scrollbar">
        {connectionError && (
          <div className="bg-red-500/10 border-b border-red-500/20 p-2 text-center text-xs text-red-400 flex items-center justify-center gap-2 z-50">
            <AlertTriangle size={14} />
            <span>{connectionError}</span>
            <button 
              onClick={checkConnection} 
              className="underline hover:text-red-300 ml-2 font-bold"
            >
              Retry
            </button>
          </div>
        )}
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
               <a 
                 href={telegramLink}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="w-10 h-10 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/20 flex items-center justify-center text-[#0088cc] active:scale-90 transition-all"
                 title="Telegram Support"
               >
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.37-.48 1.02-.73 4-1.74 6.67-2.89 8.01-3.45 3.81-1.59 4.6-1.87 5.12-1.88.11 0 .37.03.53.17.14.12.18.28.19.45-.01.06-.01.12-.02.17z"/>
                 </svg>
               </a>
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
                 className="hidden md:block w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary p-[2px] shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95"
               >
                 <div className="w-full h-full bg-darker rounded-full flex items-center justify-center overflow-hidden font-black text-primary italic text-sm">
                   {BRAND_CONFIG.shortName[0]}
                 </div>
               </button>
             </div>
          </div>
        </header>
        <div className="p-4 sm:p-6 pb-24 sm:pb-6">{renderContent()}</div>
        <InstallPrompt />
      </main>
    </div>
  );
};

export default App;
