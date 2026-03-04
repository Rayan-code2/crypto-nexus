
import React, { useState, useEffect } from 'react';
import { User, Wallet, ExchangerRequest } from '../types';
import { MLM_CONFIG } from '../constants';
import { mockApi } from '../lib/mockApi';
import { BRAND_CONFIG } from '../brandConfig';

interface ExchangerProps {
  user: User;
  wallet: Wallet;
  initialSubTab?: 'topup' | 'withdraw' | 'swap';
}

const Exchanger: React.FC<ExchangerProps> = ({ user, wallet: initialWallet, initialSubTab = 'topup' }) => {
  const [activeTab, setActiveTab] = useState<'topup' | 'withdraw' | 'swap'>(initialSubTab);
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [p2pType, setP2pType] = useState<'buy' | 'sell'>('buy');
  const [utrNumber, setUtrNumber] = useState('');
  const [userUpi, setUserUpi] = useState('');
  const [network, setNetwork] = useState('TRC20');
  const [topupAmount, setTopupAmount] = useState('');
  const [hashId, setHashId] = useState('');
  const [history, setHistory] = useState<ExchangerRequest[]>([]);
  const [wallet, setWallet] = useState<Wallet>(initialWallet);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [rates, setRates] = useState({ 
    buy: MLM_CONFIG.USDT_BUY_RATE, 
    sell: MLM_CONFIG.USDT_SELL_RATE,
    adminUpi: 'nexus@upi',
    adminQr: ''
  });

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg(null), 5000);
  };

  const fetchHistory = async () => {
    try {
      const [historyData, walletData, settingsData] = await Promise.all([
        mockApi.db.getExchangeRequests(user.id),
        mockApi.db.getWallet(user.id),
        mockApi.db.getSettings()
      ]);
      setHistory(historyData as any);
      setWallet(walletData as any);
      if (settingsData) {
        setRates({
          buy: settingsData.usdt_buy_rate || MLM_CONFIG.USDT_BUY_RATE,
          sell: settingsData.usdt_sell_rate || MLM_CONFIG.USDT_SELL_RATE,
          adminUpi: settingsData.admin_upi || 'nexus@upi',
          adminQr: settingsData.admin_qr || ''
        });
      }
    } catch (e) {
      console.error("Data fetch error:", e);
    }
  };

  useEffect(() => {
    setActiveTab(initialSubTab);
    fetchHistory();
  }, [initialSubTab, user.id]);

  const rate = p2pType === 'buy' ? rates.buy : rates.sell;
  const inrValue = amount ? (parseFloat(amount) * rate).toFixed(2) : '0.00';

  const handleSubmitDeposit = async () => {
    if (!topupAmount || !hashId) {
      showStatus('Please enter both amount and Hash ID', 'error');
      return;
    }
    setLoading(true);
    console.log("Initiating deposit request...", { topupAmount, hashId, network });
    try {
      const result = await mockApi.db.createExchangeRequest({
        user_id: user.id,
        amount: parseFloat(topupAmount),
        hash_id: hashId,
        network: network,
        status: 'pending',
        type: 'deposit'
      });
      
      console.log("Deposit success:", result);
      showStatus('Deposit request submitted successfully!');
      setTopupAmount('');
      setHashId('');
      fetchHistory();
    } catch (e: any) {
      console.error("Deposit error details:", e);
      showStatus(e.message || 'Failed to submit request.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawal = async () => {
    if (!amount || !address) {
      alert('Please enter both amount and destination address');
      return;
    }
    if (parseFloat(amount) > wallet.balance) {
      alert('Insufficient balance');
      return;
    }
    setLoading(true);
    try {
      await mockApi.db.createExchangeRequest({
        user_id: user.id,
        amount: parseFloat(amount),
        address: address,
        network: network,
        status: 'pending',
        type: 'withdraw'
      });
      
      // Deduct balance immediately
      await mockApi.db.updateWallet(user.id, wallet.balance - parseFloat(amount));
      
      alert('Withdrawal request submitted successfully!');
      setAmount('');
      setAddress('');
      fetchHistory();
    } catch (e: any) {
      alert('Failed to submit withdrawal request: ' + (e.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSwap = async () => {
    if (!amount) return;
    const usdtAmount = parseFloat(amount);
    
    if (p2pType === 'sell') {
      if (usdtAmount > wallet.balance) {
        showStatus('Insufficient balance', 'error');
        return;
      }
      if (!userUpi) {
        showStatus('Please enter your UPI ID to receive payment', 'error');
        return;
      }
    } else {
      if (!utrNumber) {
        showStatus('Please enter the UTR/Transaction ID after payment', 'error');
        return;
      }
    }

    setLoading(true);
    try {
      await mockApi.db.createExchangeRequest({
        user_id: user.id,
        type: p2pType,
        amount: usdtAmount,
        inr_amount: parseFloat(inrValue),
        rate: rate,
        utr_number: p2pType === 'buy' ? utrNumber : undefined,
        user_upi: p2pType === 'sell' ? userUpi : undefined,
        status: 'pending'
      });
      
      if (p2pType === 'sell') {
        await mockApi.db.updateWallet(user.id, wallet.balance - usdtAmount);
      }
      
      showStatus('P2P Swap request broadcasted!');
      setAmount('');
      setUtrNumber('');
      setUserUpi('');
      fetchHistory();
    } catch (e: any) {
      showStatus('Swap initiation failed: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const renderTopup = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass p-6 rounded-3xl border-primary/20 text-center space-y-4">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Deposit USDT via Crypto Gateway</p>
        <div className="w-48 h-48 bg-white p-2 mx-auto rounded-xl shadow-2xl shadow-primary/20">
          {/* Mock QR Code */}
          <div className="w-full h-full bg-slate-100 flex items-center justify-center relative overflow-hidden">
             <div className="w-full h-full flex flex-wrap opacity-20">
                {Array.from({length: 64}).map((_, i) => <div key={i} className={`w-1/8 h-1/8 ${Math.random() > 0.5 ? 'bg-black' : 'bg-transparent'}`}></div>)}
             </div>
             <span className="absolute text-slate-800 font-black italic">USDT</span>
          </div>
        </div>
        <div className="space-y-2">
           <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
             {['TRC20', 'BEP20', 'ERC20'].map(net => (
               <button key={net} onClick={() => setNetwork(net)} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${network === net ? 'bg-primary text-darker' : 'text-slate-500'}`}>{net}</button>
             ))}
           </div>
           <div className="bg-slate-900/50 p-4 rounded-xl flex justify-between items-center border border-white/5">
             <span className="text-[10px] font-mono text-slate-400 truncate mr-4">TYL5Hw7hQ8w7X9...demo_addr</span>
             <button onClick={() => alert("Copied!")} className="text-primary text-xs font-black uppercase tracking-widest border-b border-primary/20">Copy</button>
           </div>
        </div>
      </div>
      <div className="glass p-6 rounded-3xl space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Deposit Amount</label>
          <div className="relative">
            <input 
              type="number" 
              placeholder="0.00" 
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-xl font-black outline-none ring-1 ring-slate-800 focus:ring-primary"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black">USDT</span>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Transaction Hash ID</label>
          <input 
            type="text" 
            placeholder="Enter TxHash..." 
            value={hashId}
            onChange={(e) => setHashId(e.target.value)}
            className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm outline-none ring-1 ring-slate-800 focus:ring-primary"
          />
        </div>
        <button 
          onClick={handleSubmitDeposit}
          disabled={loading}
          className="w-full py-4 bg-primary text-darker font-black rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50"
        >
          {loading ? 'Transmitting...' : 'Submit Deposit Request'}
        </button>

        {statusMsg && (
          <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in zoom-in ${
            statusMsg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {statusMsg.text}
          </div>
        )}
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl">
         <p className="text-[10px] text-amber-500 font-bold leading-relaxed uppercase tracking-wider">
           ⚠️ IMPORTANT: Send only USDT to this address. Ensure you select the correct network ({network}). Deposits are usually credited after 3 network confirmations.
         </p>
      </div>
    </div>
  );

  const renderWithdraw = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass p-6 rounded-3xl space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Destination Wallet (USDT)</label>
          <input 
            type="text" 
            placeholder="0x... or T..." 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm outline-none ring-1 ring-slate-800 focus:ring-secondary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Amount to Payout</label>
          <div className="relative">
            <input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-xl font-black outline-none ring-1 ring-slate-800 focus:ring-secondary"
            />
            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-secondary font-black">USDT</span>
          </div>
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest px-1 flex justify-between">
            <span>Balance: ${wallet?.balance?.toFixed(2) || '0.00'}</span>
            <span>Fee: $1.00 USDT</span>
          </p>
        </div>
        <button 
          onClick={handleWithdrawal}
          disabled={loading || !amount || !address}
          className="w-full py-4 bg-secondary text-white font-black rounded-2xl shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50"
        >
          {loading ? 'Transmitting...' : 'Request Secure Withdrawal'}
        </button>
      </div>
    </div>
  );

  const renderSwap = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass p-8 rounded-[2.5rem] space-y-6 border-amber-500/20">
          <div className="flex p-1 bg-slate-900 rounded-2xl">
            <button 
              onClick={() => setP2pType('buy')}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${p2pType === 'buy' ? 'bg-amber-500 text-darker' : 'text-slate-500'}`}
            >
              Buy with INR
            </button>
            <button 
              onClick={() => setP2pType('sell')}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${p2pType === 'sell' ? 'bg-amber-500 text-darker' : 'text-slate-500'}`}
            >
              Sell for INR
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">USDT Volume</label>
              <div className="relative">
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full bg-slate-800 border-none rounded-2xl py-4 px-6 text-xl font-black outline-none ring-1 ring-slate-700 focus:ring-amber-500"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-amber-500 font-black">USDT</span>
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-slate-900 p-2 rounded-full border border-white/10 shadow-lg rotate-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Estimated INR</label>
              <div className="relative">
                <input 
                  type="text" 
                  readOnly
                  value={inrValue}
                  className="w-full bg-slate-900/80 border-none rounded-2xl py-4 px-6 text-xl font-black text-slate-400 outline-none ring-1 ring-slate-800"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 font-black">₹ INR</span>
              </div>
            </div>

            <div className="p-4 bg-slate-900/50 rounded-2xl flex justify-between items-center text-[10px] font-black uppercase tracking-widest border border-white/5">
              <span className="text-slate-500">P2P Conversion Rate</span>
              <span className="text-amber-500">1 USDT = ₹{rate}</span>
            </div>

            {p2pType === 'buy' && (
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-6 animate-in slide-in-from-bottom-4">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  {rates.adminQr && (
                    <div className="w-32 h-32 bg-white p-2 rounded-2xl shrink-0">
                      <img src={rates.adminQr} alt="Payment QR" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Admin UPI ID</p>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-black text-white">{rates.adminUpi}</p>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(rates.adminUpi);
                          showStatus('UPI ID Copied!');
                        }}
                        className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-[9px] text-slate-600 font-bold uppercase leading-relaxed">
                      Pay the exact INR amount to the UPI ID above, then enter the UTR number below to confirm.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">UTR / Transaction ID</label>
                  <input 
                    type="text" 
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter 12-digit UTR number" 
                    className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-1 ring-slate-800 focus:ring-amber-500" 
                  />
                </div>
              </div>
            )}

            {p2pType === 'sell' && (
              <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4 animate-in slide-in-from-bottom-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Your UPI ID (To Receive INR)</label>
                  <input 
                    type="text" 
                    value={userUpi}
                    onChange={(e) => setUserUpi(e.target.value)}
                    placeholder="e.g. yourname@upi" 
                    className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-1 ring-slate-800 focus:ring-amber-500" 
                  />
                  <p className="text-[9px] text-slate-600 font-bold uppercase leading-relaxed">
                    Double check your UPI ID. Admin will send payment to this ID.
                  </p>
                </div>
              </div>
            )}

            <button 
              onClick={handleInitiateSwap}
              disabled={loading || !amount}
              className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl bg-amber-500 text-darker hover:bg-amber-400 transition-all disabled:opacity-50"
            >
              {loading ? 'Transmitting...' : `Initiate ${p2pType} Protocol`}
            </button>
          </div>
      </div>
      <div className="text-center">
         <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Available only for Indian Agents with Verified KYC</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-right duration-500 pb-12">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black uppercase tracking-tighter">{BRAND_CONFIG.shortName} Liquidity Hub</h2>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest italic">{BRAND_CONFIG.tagline}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar for Exchanger */}
        <div className="lg:col-span-4 flex lg:flex-col gap-2 p-1 bg-darker/50 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
           {[
             { id: 'topup', label: 'Topup (Crypto)', icon: '📥' },
             { id: 'withdraw', label: 'Withdraw (Crypto)', icon: '📤' },
             { id: 'swap', label: 'Swap (INR P2P)', icon: '🔄' }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                 activeTab === tab.id ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' : 'text-slate-500 hover:text-slate-300'
               }`}
             >
               <span className="text-lg">{tab.icon}</span>
               {tab.label}
             </button>
           ))}
        </div>

        {/* Dynamic Content Area */}
        <div className="lg:col-span-8">
           {activeTab === 'topup' && renderTopup()}
           {activeTab === 'withdraw' && renderWithdraw()}
           {activeTab === 'swap' && renderSwap()}
           
           <div className="mt-8 glass p-6 rounded-[2rem]">
              <h3 className="text-xs font-black uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Recent Protocols</h3>
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest p-2 hover:bg-white/5 rounded-lg transition-colors">
                     <span className={`
                       ${h.type === 'buy' ? 'text-green-400' : ''}
                       ${h.type === 'sell' ? 'text-red-400' : ''}
                       ${h.type === 'deposit' ? 'text-primary' : ''}
                       ${h.type === 'withdraw' ? 'text-secondary' : ''}
                     `}>
                       {h.type} nexus
                     </span>
                     <span className="text-slate-500">{new Date(h.created_at).toLocaleDateString()}</span>
                     <span className="text-white">${h.amount}</span>
                     <span className={`
                       ${h.status === 'approved' ? 'text-primary' : ''}
                       ${h.status === 'rejected' ? 'text-red-500' : ''}
                       ${h.status === 'pending' ? 'text-amber-500 opacity-50' : ''}
                     `}>
                       {h.status}
                     </span>
                  </div>
                ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Exchanger;
