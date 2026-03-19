
import React, { useState, useEffect, useCallback } from 'react';
import { User, Wallet } from './types';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import MatrixTree from './pages/MatrixTree';
import AutoPools from './pages/AutoPools';
import Exchanger from './pages/Exchanger';
import TaskCenter from './pages/TaskCenter';
import IncomeDetails from './pages/IncomeDetails';
import Mining from './pages/Mining';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import InstallPrompt from './components/InstallPrompt';
import { mockApi } from './lib/mockApi';
import { BRAND_CONFIG } from './brandConfig';
import { MLM_CONFIG } from './constants';

import { isAppwriteConfigured, APPWRITE_CONFIG } from './lib/appwrite';
import { AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

const App: React.FC = () => {
  const [isLive] = useState(isAppwriteConfigured());
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
        if (e.message?.includes('Failed to fetch') || e.message?.includes('Network Error') || e.message?.includes('Could not connect')) {
          setConnectionError("Cannot reach Appwrite. Please check your endpoint or add this domain to 'Platforms' in Appwrite Console.");
        } else {
          // If we got a different error (like 401), the server IS reachable
          setConnectionError(null);
        }
      }
    } else {
      setConnectionError("CRITICAL: Appwrite is not configured. Please set VITE_APPWRITE_PROJECT_ID and VITE_APPWRITE_DATABASE_ID in environment variables.");
    }
  }, [isLive]);

  useEffect(() => {
    checkConnection();
    
    // Periodic check every 2 minutes
    const interval = setInterval(checkConnection, 120000);

    // Request notification permission if not granted
    if ('Notification' in window && Notification.permission === 'default') {
      setTimeout(() => {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            console.log('Notification permission granted.');
          }
        });
      }, 5000); // Wait 5 seconds before asking
    }

    return () => clearInterval(interval);
  }, [checkConnection]);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('spiral_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [exchangerSubTab, setExchangerSubTab] = useState<'topup' | 'withdraw' | 'swap'>('topup');
  const [wallet, setWallet] = useState<Wallet>({ id: '', user_id: '', balance: 0, total_earned: 0, total_withdrawn: 0 });
  const [liveBalance, setLiveBalance] = useState(0);
  const [pools, setPools] = useState<any[]>([]);
  const [telegramLink, setTelegramLink] = useState('https://t.me/cryptospiral');

  // Real-time Balance Growth Ticker (Global)
  useEffect(() => {
    if (!currentUser || !wallet.id || !currentUser.is_active) {
      setLiveBalance(wallet.balance || 0);
      return;
    }

    const walletDailyRate = MLM_CONFIG.WALLET_DAILY_ROI;
    const poolDailyRate = MLM_CONFIG.POOL_DAILY_ROI;
    const walletRatePerSec = walletDailyRate / 86400;
    const poolRatePerSec = poolDailyRate / 86400;
    const tickerStartTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      let walletAccrued = 0;
      let poolAccrued = 0;
      
      // Wallet Accrual
      if (wallet.balance > 0) {
        const lastWalletROI = wallet.last_roi_at ? new Date(wallet.last_roi_at).getTime() : tickerStartTime;
        const walletSecs = (now - lastWalletROI) / 1000;
        walletAccrued = wallet.balance * walletRatePerSec * walletSecs;
      }
      
      // Pool Accrual (Pool 1)
      const pool1 = pools.find(p => p.pool_number === 1 && p.status === 'active');
      if (pool1) {
        const lastPoolROI = wallet.last_pool_roi_at ? new Date(wallet.last_pool_roi_at).getTime() : new Date(pool1.created_at).getTime();
        const poolSecs = (now - lastPoolROI) / 1000;
        poolAccrued = 10 * poolRatePerSec * poolSecs;
      }
      
      setLiveBalance(wallet.balance + walletAccrued + poolAccrued);
    }, 100);

    return () => clearInterval(interval);
  }, [wallet.balance, wallet.last_roi_at, wallet.last_pool_roi_at, currentUser?.id, currentUser?.is_active, pools]);

  const fetchUserData = useCallback(async (user: User) => {
    try {
      // Distribute ROI if applicable (non-blocking)
      mockApi.db.distributeROI(user.id).catch(err => console.error("ROI Distribution failed", err));

      const [walletData, freshUser, poolsData, settings] = await Promise.all([
        mockApi.db.getWallet(user.id),
        mockApi.auth.getCurrentUser?.(),
        mockApi.db.getPools(user.id),
        mockApi.db.getSettings() as any
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
      // If we are logging out, don't try to re-fetch the user
      if (isLoggingOut) return;

      if (!currentUser) {
        try {
          const user = await mockApi.auth.getCurrentUser();
          if (user) {
            setCurrentUser(user);
            localStorage.setItem('spiral_user', JSON.stringify(user));
            await fetchUserData(user);
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
      if (currentUser && !isLoggingOut) fetchUserData(currentUser);
    }, 30000);

    return () => clearInterval(interval);
  }, [currentUser?.id, isLoggingOut]);

  const showNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(title, {
          body,
          icon: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a635305444d75633144c18f02626cc28e271cf0/128/color/usdt.png',
          badge: 'https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a635305444d75633144c18f02626cc28e271cf0/128/color/usdt.png',
          vibrate: [100, 50, 100],
          data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
          }
        } as any);
      });
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('spiral_user', JSON.stringify(user));
    showNotification('Access Granted', `Welcome back to ${BRAND_CONFIG.shortName} Protocol.`);
  };

  const handleLogout = async () => {
    console.log("🚀 Initializing Logout Sequence...");
    setIsLoggingOut(true);
    setLoading(true);
    try {
      // 1. Attempt server-side sign out first to ensure session is cleared
      await mockApi.auth.signOut();
      
      // 2. Clear local state only after server confirmation
      setCurrentUser(null);
      setWallet({ id: '', user_id: '', balance: 0, total_earned: 0, total_withdrawn: 0 });
      setActiveTab('dashboard');
      localStorage.removeItem('spiral_user');
      
      console.log("✅ Logout Successful");
    } catch (e) {
      console.error("⚠️ Logout API call failed, forcing local clear", e);
      // Force clear even if API fails
      setCurrentUser(null);
      localStorage.removeItem('spiral_user');
    } finally {
      setIsLoggingOut(false);
      setLoading(false);
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

  if (!currentUser) return <Login onLogin={handleLogin} />;

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
      case 'mining': return <Mining user={currentUser} wallet={wallet} pools={pools} />;
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
        <header className={`sticky top-0 z-40 glass border-b border-white/5 px-4 sm:px-6 py-4 flex justify-between items-center transition-all`}>
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {activeTab === 'admin' ? (
              <h1 className="text-xl sm:text-4xl font-black text-cyan-400 sm:bg-gradient-to-r sm:from-cyan-400 sm:to-purple-500 sm:bg-clip-text sm:text-transparent uppercase tracking-tighter italic leading-tight py-1 whitespace-nowrap block">
                System Console
              </h1>
            ) : (
              <div className="flex items-center gap-3 group cursor-default">
                <div className="relative hidden xs:flex items-center justify-center w-10 h-10">
                  <div className="absolute inset-0 bg-primary/20 blur-md rounded-lg rotate-45 group-hover:rotate-90 transition-transform duration-700"></div>
                  <div className="relative z-10 w-6 h-6 border-2 border-primary/40 rounded-md flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(6,182,212,1)]"></div>
                  </div>
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[7px] font-black text-primary uppercase tracking-[0.4em] leading-none">Protocol v1.0</span>
                    <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                  </div>
                  <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tighter italic bg-gradient-to-r from-white via-primary to-secondary bg-clip-text text-transparent leading-none drop-shadow-[0_0_15px_rgba(6,182,212,0.3)] relative group-hover:animate-pulse">
                    Dashboard
                    <div className="absolute -inset-1 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  </h1>
                </div>
              </div>
            )}
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
                <p className="text-lg font-black text-primary">${liveBalance?.toFixed(2) || '0.00'}</p>
             </div>
             <div className="flex items-center gap-2 sm:gap-4">
               <a 
                 href={telegramLink}
                 target="_blank"
                 rel="noopener noreferrer"
                 className="px-3 h-10 rounded-xl bg-[#0088cc]/10 border border-[#0088cc]/20 flex items-center gap-2 text-[#0088cc] active:scale-90 transition-all"
                 title="Telegram Support"
               >
                 <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.07-.2-.08-.06-.19-.04-.27-.02-.11.02-1.93 1.23-5.46 3.62-.51.35-.98.52-1.4.51-.46-.01-1.35-.26-2.01-.48-.81-.27-1.45-.42-1.39-.88.03-.24.37-.48 1.02-.73 4-1.74 6.67-2.89 8.01-3.45 3.81-1.59 4.6-1.87 5.12-1.88.11 0 .37.03.53.17.14.12.18.28.19.45-.01.06-.01.12-.02.17z"/>
                 </svg>
                 <span className="text-[9px] font-black uppercase tracking-widest hidden sm:block">Support</span>
               </a>
               <button 
                 onClick={handleLogout}
                 className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 active:scale-90 transition-all"
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
