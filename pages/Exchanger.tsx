
import React, { useState, useEffect } from 'react';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Copy, Check } from 'lucide-react';
import { User, Wallet, ExchangerRequest, Settings } from '../types';
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
  const [copied, setCopied] = useState<string | null>(null);
  const [topupAmount, setTopupAmount] = useState('');
  const [hashId, setHashId] = useState('');
  const [history, setHistory] = useState<ExchangerRequest[]>([]);
  const [wallet, setWallet] = useState<Wallet>(initialWallet);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [rates, setRates] = useState({ 
    buy: MLM_CONFIG.USDT_BUY_RATE, 
    sell: MLM_CONFIG.USDT_SELL_RATE,
    adminUpi: 'spiral@upi',
    adminQr: '',
    adminAddressTrc20: 'TYL5Hw7hQ8w7X9...trc20_demo',
    adminAddressBep20: '0x7hQ8w7X9...bep20_demo',
    adminAddressErc20: '0xERC20...erc20_demo',
    minDeposit: 10,
    minWithdrawal: 20,
    maxWithdrawal: 1000,
    depositFee: 0,
    withdrawalFee: 1
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
        mockApi.db.getSettings() as any
      ]);
      setHistory(historyData as any);
      setWallet(walletData as any);
      if (settingsData) {
        setRates({
          buy: settingsData.usdt_buy_rate || MLM_CONFIG.USDT_BUY_RATE,
          sell: settingsData.usdt_sell_rate || MLM_CONFIG.USDT_SELL_RATE,
          adminUpi: settingsData.admin_upi || 'spiral@upi',
          adminQr: settingsData.admin_qr || '',
          adminAddressTrc20: settingsData.admin_address_trc20 || 'TYL5Hw7hQ8w7X9...trc20_demo',
          adminAddressBep20: settingsData.admin_address_bep20 || '0x7hQ8w7X9...bep20_demo',
          adminAddressErc20: settingsData.admin_address_erc20 || '0xERC20...erc20_demo',
          minDeposit: settingsData.min_deposit || 10,
          minWithdrawal: settingsData.min_withdrawal || 20,
          maxWithdrawal: settingsData.max_withdrawal || 1000,
          depositFee: settingsData.deposit_fee || 0,
          withdrawalFee: settingsData.withdrawal_fee || 0
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
    const depositVal = parseFloat(topupAmount);
    if (depositVal < rates.minDeposit) {
      showStatus(`Minimum deposit is $${rates.minDeposit} USDT`, 'error');
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
        type: 'deposit',
        fee: rates.depositFee
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
    if (!user.is_active) {
      showStatus('Account activation required ($10) to withdraw', 'error');
      return;
    }
    if (!amount || !address) {
      showStatus('Please enter both amount and destination address', 'error');
      return;
    }
    const withdrawVal = parseFloat(amount);
    const calculatedFee = (withdrawVal * rates.withdrawalFee) / 100;
    
    if (withdrawVal < rates.minWithdrawal) {
      showStatus(`Minimum withdrawal is $${rates.minWithdrawal} USDT`, 'error');
      return;
    }
    if (withdrawVal > rates.maxWithdrawal) {
      showStatus(`Maximum withdrawal is $${rates.maxWithdrawal} USDT`, 'error');
      return;
    }
    if (withdrawVal + calculatedFee > wallet.balance) {
      showStatus('Insufficient balance (including fee)', 'error');
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
        type: 'withdraw',
        fee: calculatedFee
      });
      
      // Deduct balance immediately (amount + fee)
      await mockApi.db.updateWallet(user.id, wallet.balance - (parseFloat(amount) + calculatedFee));
      
      showStatus('Withdrawal request submitted successfully!');
      setAmount('');
      setAddress('');
      fetchHistory();
    } catch (e: any) {
      showStatus('Failed to submit withdrawal request: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateSwap = async () => {
    if (p2pType === 'sell' && !user.is_active) {
      showStatus('Account activation required ($10) to sell', 'error');
      return;
    }
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

  const getActiveAddress = () => {
    if (network === 'TRC20') return rates.adminAddressTrc20 || 'TYL5Hw7hQ8w7X9...trc20_demo';
    if (network === 'BEP20') return rates.adminAddressBep20 || '0x7hQ8w7X9...bep20_demo';
    if (network === 'ERC20') return rates.adminAddressErc20 || '0xERC20...erc20_demo';
    return 'TYL5Hw7hQ8w7X9...trc20_demo';
  };

  const renderTopup = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass p-6 rounded-3xl border-primary/20 text-center space-y-4">
        <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Deposit USDT via Crypto Gateway</p>
        <div className="space-y-2">
           <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
             {['TRC20', 'BEP20', 'ERC20'].map(net => (
               <button key={net} onClick={() => setNetwork(net)} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${network === net ? 'bg-primary text-darker' : 'text-slate-500'}`}>{net}</button>
             ))}
           </div>
           <div className="bg-slate-900/50 p-4 rounded-xl flex justify-between items-center border border-white/5">
             <span className="text-[10px] font-mono text-slate-400 truncate mr-4">{getActiveAddress()}</span>
             <button 
               onClick={() => {
                 navigator.clipboard.writeText(getActiveAddress());
                 setCopied('address');
                 setTimeout(() => setCopied(null), 2000);
               }} 
               className={`transition-colors p-1 ${copied === 'address' ? 'text-green-500' : 'text-primary hover:text-white'}`}
               title="Copy Address"
             >
               {copied === 'address' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
             </button>
           </div>
        </div>
      </div>
      <div className="glass p-6 rounded-3xl space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
            <span>Deposit Amount</span>
            <span className="text-primary/60">Min: ${rates.minDeposit} USDT</span>
          </label>
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
          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest px-1 flex justify-between">
            <span>Min: ${rates.minDeposit} USDT</span>
            <span>Fee: {rates.depositFee}% (${((parseFloat(topupAmount) || 0) * rates.depositFee / 100).toFixed(2)})</span>
          </p>
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

      <div className="bg-primary/10 border border-primary/20 p-4 rounded-2xl">
         <p className="text-[10px] text-primary font-bold leading-relaxed uppercase tracking-wider">
           ⚠️ IMPORTANT: Send only USDT to this address. Ensure you select the correct network ({network}). Deposits are usually credited after 3 network confirmations.
         </p>
      </div>
    </div>
  );

  const renderWithdraw = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass p-6 rounded-3xl space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Network (USDT)</label>
          <div className="flex gap-2 bg-slate-900 p-1 rounded-xl">
            {['TRC20', 'BEP20', 'ERC20'].map(net => (
              <button 
                key={net} 
                onClick={() => setNetwork(net)} 
                className={`flex-1 py-3 rounded-lg text-[10px] font-black transition-all ${network === net ? 'bg-secondary text-white shadow-lg shadow-secondary/20' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {net}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Destination Wallet ({network})</label>
          <input 
            type="text" 
            placeholder={`Enter your ${network} address...`} 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm outline-none ring-1 ring-slate-800 focus:ring-secondary"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex justify-between">
            <span>Amount to Payout</span>
            <span className="text-secondary/60">Limit: ${rates.minWithdrawal} - ${rates.maxWithdrawal}</span>
          </label>
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
            <span>Fee: {rates.withdrawalFee}% (${((parseFloat(amount) || 0) * rates.withdrawalFee / 100).toFixed(2)})</span>
          </p>
        </div>
        {!user.is_active && (
          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center">
            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">
              ⚠️ ACCOUNT INACTIVE: ACTIVATE WITH $10 TO ENABLE WITHDRAWALS
            </p>
          </div>
        )}
        <button 
          onClick={handleWithdrawal}
          disabled={loading || !amount || !address || !user.is_active}
          className="w-full py-4 bg-secondary text-white font-black rounded-2xl shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-all uppercase tracking-[0.2em] text-xs disabled:opacity-50"
        >
          {loading ? 'Transmitting...' : !user.is_active ? 'Activation Required' : 'Request Secure Withdrawal'}
        </button>

        {statusMsg && (
          <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in zoom-in ${
            statusMsg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
          }`}>
            {statusMsg.text}
          </div>
        )}
      </div>
    </div>
  );

  const renderSwap = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="glass p-8 rounded-[2.5rem] space-y-6 border-primary/20">
          <div className="flex p-1 bg-slate-900 rounded-2xl">
            <button 
              onClick={() => setP2pType('buy')}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${p2pType === 'buy' ? 'bg-primary text-darker' : 'text-slate-500'}`}
            >
              Buy with INR
            </button>
            <button 
              onClick={() => setP2pType('sell')}
              className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${p2pType === 'sell' ? 'bg-primary text-darker' : 'text-slate-500'}`}
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
                  className="w-full bg-slate-800 border-none rounded-2xl py-4 px-6 text-xl font-black outline-none ring-1 ring-slate-700 focus:ring-primary"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-primary font-black">USDT</span>
              </div>
            </div>

            <div className="flex justify-center -my-2 relative z-10">
              <div className="bg-slate-900 p-2 rounded-full border border-white/10 shadow-lg rotate-90">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <span className="text-primary">1 USDT = ₹{rate}</span>
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
                          setCopied('upi');
                          setTimeout(() => setCopied(null), 2000);
                        }}
                        className={`p-2 rounded-lg transition-all ${copied === 'upi' ? 'bg-green-500/20 text-green-500' : 'bg-white/5 text-primary hover:bg-white/10'}`}
                        title="Copy UPI ID"
                      >
                        {copied === 'upi' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
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
                    className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-1 ring-slate-800 focus:ring-primary" 
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
                    className="w-full bg-slate-900 border-none rounded-2xl py-4 px-6 text-sm font-bold outline-none ring-1 ring-slate-800 focus:ring-primary" 
                  />
                  <p className="text-[9px] text-slate-600 font-bold uppercase leading-relaxed">
                    Double check your UPI ID. Admin will send payment to this ID.
                  </p>
                </div>
              </div>
            )}

            {p2pType === 'sell' && !user.is_active && (
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-center">
                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">
                  ⚠️ ACCOUNT INACTIVE: ACTIVATE WITH $10 TO SELL USDT
                </p>
              </div>
            )}
            <button 
              onClick={handleInitiateSwap}
              disabled={loading || !amount || (p2pType === 'sell' && !user.is_active)}
              className="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl bg-primary text-darker hover:bg-primary/80 transition-all disabled:opacity-50"
            >
              {loading ? 'Transmitting...' : (p2pType === 'sell' && !user.is_active) ? 'Activation Required' : `Initiate ${p2pType} Protocol`}
            </button>

            {statusMsg && (
              <div className={`p-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in zoom-in ${
                statusMsg.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
              }`}>
                {statusMsg.text}
              </div>
            )}
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
        <div className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-1 gap-2 p-1 bg-darker/50 rounded-2xl border border-white/5">
           {[
             { id: 'topup', label: 'Topup', icon: <ArrowDownCircle className="w-5 h-5" /> },
             { id: 'withdraw', label: 'Withdraw', icon: <ArrowUpCircle className="w-5 h-5" /> },
             { id: 'swap', label: 'Swap', icon: <RefreshCw className="w-5 h-5" /> }
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`flex flex-col lg:flex-row items-center justify-center lg:justify-start gap-1 lg:gap-3 px-2 lg:px-6 py-3 lg:py-4 rounded-xl text-[8px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${
                 activeTab === tab.id ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' : 'text-slate-500 hover:text-slate-300'
               }`}
             >
               {tab.icon}
               <span className="text-center lg:text-left">{tab.label}</span>
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
                       {h.type} spiral
                     </span>
                     <span className="text-slate-500">{new Date(h.created_at).toLocaleDateString()}</span>
                     <span className="text-white">${h.amount}</span>
                     <span className={`
                       ${h.status === 'approved' ? 'text-primary' : ''}
                       ${h.status === 'rejected' ? 'text-red-500' : ''}
                       ${h.status === 'pending' ? 'text-primary opacity-50' : ''}
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
