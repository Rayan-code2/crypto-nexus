
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { mockApi } from '../lib/mockApi';
import { isAppwriteConfigured } from '../lib/appwrite';
import { BRAND_CONFIG } from '../brandConfig';

interface LoginProps {
  onLogin: (user: User) => void;
  onDemoMode: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onDemoMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [sponsorId, setSponsorId] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setSponsorId(ref);
      setIsSignUp(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await mockApi.auth.signUp(email, password, sponsorId);
        setError("Node Registered! Please Login.");
        setIsSignUp(false);
      } else {
        const { user } = await mockApi.auth.signIn(email, password);
        onLogin(user as any);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-darker px-4 py-12 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-[450px] relative z-10">
        <div className="glass p-8 sm:p-12 rounded-[40px] shadow-2xl neon-border border-white/5 backdrop-blur-2xl">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-3xl mx-auto flex items-center justify-center font-black text-white text-4xl italic mb-6 shadow-lg shadow-primary/20 rotate-3">
              {BRAND_CONFIG.shortName[0]}
            </div>
            <h2 className="text-3xl font-black tracking-tighter mb-2 text-white">
              {BRAND_CONFIG.name.slice(0, -BRAND_CONFIG.shortName.length)}
              <span className="text-primary">{BRAND_CONFIG.shortName}</span>
            </h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em]">
              {isSignUp ? 'Initialize Node Connection' : `Access your ${BRAND_CONFIG.shortName} Account`}
            </p>
          </div>

          {error && (
            <div className="space-y-3 mb-6">
              <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border ${
                error.includes("Success") || error.includes("Registered") ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
              } transition-all animate-in fade-in slide-in-from-top-2 text-center`}>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Terminal ID</label>
              <div className="relative">
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="agent@nexus.io"
                  className="w-full bg-slate-900/80 border border-white/5 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/40 transition-all text-white placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>

            {isSignUp && (
              <div className="space-y-2 animate-in slide-in-from-left duration-300">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Uplink ID (Sponsor)</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={sponsorId}
                    onChange={(e) => setSponsorId(e.target.value)}
                    placeholder="Optional Sponsor ID"
                    className="w-full bg-slate-900/80 border border-white/5 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/40 transition-all text-white placeholder:text-slate-600 font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-1">Access Key</label>
              <div className="relative">
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-white/5 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary/40 transition-all text-white placeholder:text-slate-600"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-primary to-cyan-500 hover:scale-[1.02] active:scale-95 text-darker font-black rounded-2xl transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-sm uppercase tracking-widest disabled:opacity-50 mt-4 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-darker border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>{isSignUp ? 'Sync New Node' : 'Establish Link'}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 flex flex-col items-center gap-5">
            <div className="text-[11px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
              <span>{isSignUp ? 'System ID exists?' : "New Node?"}</span>
              <button 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-primary hover:text-cyan-300 transition-colors border-b border-primary/20 font-black"
              >
                {isSignUp ? 'Sign In' : 'Register Now'}
              </button>
            </div>
            
            {/* Nexus Uplink Status - Appwrite Mode */}
            <div className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] text-slate-400 font-mono leading-relaxed">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-primary font-black uppercase tracking-widest">
                  <div className={`w-1.5 h-1.5 rounded-full ${isAppwriteConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                  <span>{BRAND_CONFIG.shortName} Uplink Status</span>
                </div>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isAppwriteConfigured() ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {isAppwriteConfigured() ? 'Appwrite Cloud' : 'Local Mode'}
                </span>
              </div>
              
              <p>• Gateway: {isAppwriteConfigured() ? 'cloud.appwrite.io' : 'Local Storage'}</p>
              <p>• Region: {isAppwriteConfigured() ? 'Global (Live)' : 'Client-Side (Offline)'}</p>
              <p className={`${isAppwriteConfigured() ? 'text-emerald-500/80' : 'text-amber-500/80'} mt-1`}>
                • Status: {isAppwriteConfigured() ? 'CONNECTED' : 'READY FOR TESTING'}
              </p>
              <p className="text-slate-500 italic mt-2 leading-tight">
                {isAppwriteConfigured() 
                  ? 'System is live on Appwrite Cloud. No VPN required.' 
                  : 'Note: In local mode, data is saved only in your browser.'}
              </p>
              
              <div className="flex gap-2 mt-4">
                <button 
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex-1 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border border-primary/20"
                >
                  Refresh System
                </button>
              </div>
            </div>
            
            <div className="w-full h-px bg-white/5 my-2"></div>

            <button 
              onClick={onDemoMode}
              className="group flex flex-col items-center gap-2 transition-all"
            >
              <span className="text-[10px] font-black text-slate-500 group-hover:text-primary uppercase tracking-[0.3em] transition-colors">Emergency Bypass</span>
              <span className="text-[9px] font-bold text-slate-700 uppercase tracking-widest group-hover:text-slate-400">Enter Demo Mode (Read-Only)</span>
            </button>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[9px] font-black text-slate-600 uppercase tracking-[0.4em]">{BRAND_CONFIG.shortName} Core v4.2.0 • Local Testing Protocol</p>
      </div>
    </div>
  );
};

export default Login;
