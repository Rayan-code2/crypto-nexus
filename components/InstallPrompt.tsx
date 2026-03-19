import React, { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Show the install button
      setShowPrompt(true);
    };

    // Check if it's iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    
    if (isIOS && !isStandalone) {
      setShowPrompt(true);
    }

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Show the prompt for Android/Chrome
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      setDeferredPrompt(null);
      setShowPrompt(false);
    } else {
      // Show instructions for iOS
      alert('To install on iOS: Tap the Share button (square with arrow) and select "Add to Home Screen"');
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-darker border border-primary/30 rounded-2xl p-4 shadow-2xl shadow-primary/20 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center overflow-hidden">
            <img 
              src="https://cdn.jsdelivr.net/gh/atomiclabs/cryptocurrency-icons@1a635305444d75633144c18f02626cc28e271cf0/128/color/usdt.png" 
              alt="USDT" 
              className="w-6 h-6"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h4 className="text-white text-xs font-black uppercase tracking-tighter">Install App</h4>
            <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">Add to home screen for fast access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="bg-primary text-darker px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20"
          >
            Install
          </button>
          <button
            onClick={() => setShowPrompt(false)}
            className="p-2 text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallPrompt;
