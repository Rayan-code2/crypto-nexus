
import { User, Wallet, ExchangerRequest, Task, Transaction, TaskSubmission } from '../types';
import { appwriteService } from './appwriteService';
import { isAppwriteConfigured } from './appwrite';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getStorage = (key: string) => JSON.parse(localStorage.getItem(`spiral_mock_${key}`) || '[]');
const setStorage = (key: string, data: any) => localStorage.setItem(`spiral_mock_${key}`, JSON.stringify(data));

export const mockApi = {
  auth: {
    signUp: async (email: string, pass: string, sponsorId?: string) => {
      const normalizedEmail = email.toLowerCase().trim();
      if (isAppwriteConfigured()) return await appwriteService.auth.signUp(normalizedEmail, pass, sponsorId);
      
      await delay(800);
      const users = getStorage('users');
      if (users.find((u: any) => u.email === normalizedEmail)) throw new Error("Terminal ID already registered");
      
      const newUser = {
        id: 'node_' + Math.random().toString(36).slice(2, 9),
        email: normalizedEmail,
        role: email.includes('admin') ? 'admin' : 'user',
        level: 1,
        sponsor_id: sponsorId || null,
        matrix_parent_id: null,
        matrix_position: null,
        is_blocked: false,
        is_active: true,
        is_qualified: true,
        direct_count: 5,
        children_count: 0,
        created_at: new Date().toISOString()
      };
      
      setStorage('users', [...users, newUser]);
      return { user: newUser };
    },
    signIn: async (email: string, pass: string) => {
      const normalizedEmail = email.toLowerCase().trim();
      if (isAppwriteConfigured()) return await appwriteService.auth.signIn(normalizedEmail, pass);

      await delay(800);
      const users = getStorage('users');
      const user = users.find((u: any) => u.email === normalizedEmail);
      if (!user) throw new Error("Terminal ID not found. Please register.");
      return { user };
    },
    getCurrentUser: async () => {
      if (isAppwriteConfigured()) return await appwriteService.auth.getCurrentUser();
      const saved = localStorage.getItem('spiral_user');
      return saved ? JSON.parse(saved) : null;
    },
    signOut: async () => {
      if (isAppwriteConfigured()) await appwriteService.auth.signOut();
      localStorage.removeItem('spiral_user');
    }
  },
  
  db: {
    getWallet: async (userId: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.getWallet(userId);

      const wallets = getStorage('wallets');
      let wallet = wallets.find((w: any) => w.user_id === userId);
      
      if (!wallet) {
        // Create a demo wallet for new users to see visuals immediately
        wallet = { 
          id: 'w_' + userId, 
          user_id: userId, 
          balance: 125.50, 
          total_earned: 45.20, 
          roi_earned: 12.40, 
          wallet_roi_earned: 8.20,
          pool_roi_earned: 4.20,
          direct_income: 25.00,
          level_income: 15.50,
          hold_balance: 5.00,
          total_withdrawn: 0,
          last_roi_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
          last_pool_roi_at: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        };
        setStorage('wallets', [...wallets, wallet]);

        // Add some demo transactions for visuals
        const txs = getStorage('transactions');
        const demoTxs = [
          { id: 'tx1', user_id: userId, type: 'roi', amount: 0.25, status: 'completed', created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: 'tx2', user_id: userId, type: 'direct', amount: 5.00, status: 'completed', created_at: new Date(Date.now() - 172800000).toISOString() },
          { id: 'tx3', user_id: userId, type: 'level', income_level: 1, amount: 0.50, status: 'completed', created_at: new Date(Date.now() - 259200000).toISOString() },
          { id: 'tx4', user_id: userId, type: 'level', income_level: 2, amount: 0.50, status: 'completed', created_at: new Date(Date.now() - 345600000).toISOString() },
          { id: 'tx5', user_id: userId, type: 'level', income_level: 3, amount: 0.50, status: 'completed', created_at: new Date(Date.now() - 432000000).toISOString() },
          { id: 'tx6', user_id: userId, type: 'pool_payout', amount: 10.00, status: 'completed', created_at: new Date(Date.now() - 518400000).toISOString() },
        ];
        setStorage('transactions', [...txs, ...demoTxs]);
      } else {
        // Ensure new fields exist for existing demo wallets
        if (wallet.direct_income === undefined) wallet.direct_income = 25.00;
        if (wallet.level_income === undefined) wallet.level_income = 15.50;
        if (wallet.hold_balance === undefined) wallet.hold_balance = 5.00;
      }
      return wallet;
    },
    
    getPools: async (userId: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.getPools(userId);
      
      let pools = getStorage('pools');
      let userPools = pools.filter((p: any) => p.user_id === userId);
      
      // If user has no pools or only 1, let's reset/add demo data for this visual test
      if (userPools.length < 3) {
        // Remove old ones to avoid duplicates
        pools = pools.filter((p: any) => p.user_id !== userId);
        
        const demoPools = [
          {
            id: 'pool_demo_1_' + userId,
            user_id: userId,
            pool_number: 1,
            status: 'completed',
            members_count: 4,
            created_at: new Date(Date.now() - 1209600000).toISOString()
          },
          {
            id: 'pool_demo_1_rebirth_' + userId,
            user_id: userId,
            pool_number: 1,
            status: 'active',
            members_count: 2,
            created_at: new Date(Date.now() - 604800000).toISOString()
          },
          {
            id: 'pool_demo_2_' + userId,
            user_id: userId,
            pool_number: 2,
            status: 'active',
            members_count: 5,
            created_at: new Date(Date.now() - 604800000).toISOString()
          }
        ];
        setStorage('pools', [...pools, ...demoPools]);
        userPools = demoPools;

        // Also force qualification
        const users = getStorage('users');
        const userIndex = users.findIndex((u: any) => u.id === userId);
        if (userIndex !== -1) {
          users[userIndex].is_qualified = true;
          users[userIndex].direct_count = 3;
          setStorage('users', users);
        }
      }
      
      return userPools;
    },

    getTransactions: async (userId: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.getTransactions(userId);
      const txs = getStorage('transactions');
      return txs.filter((tx: any) => tx.user_id === userId).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    getAllTransactions: async (limit = 20) => {
      if (isAppwriteConfigured()) return await appwriteService.db.getAllTransactions(limit);
      const txs = getStorage('transactions');
      return txs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, limit);
    },

    distributeROI: async (userId: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.distributeROI(userId);

      const wallets = getStorage('wallets');
      const wallet = wallets.find((w: any) => w.user_id === userId);
      if (!wallet) return;

      const now = Date.now();
      const txs = getStorage('transactions');
      let walletUpdated = false;

      // 1. Wallet ROI (0.20% Daily)
      const lastROI = wallet.last_roi_at ? new Date(wallet.last_roi_at).getTime() : 0;
      const diffHoursROI = (now - lastROI) / (1000 * 60 * 60);

      if (diffHoursROI >= 24) {
        const days = Math.floor(diffHoursROI / 24);
        const dailyRate = 0.002; // 0.20%
        const roi = wallet.balance * dailyRate * days;
        
        if (roi > 0) {
          wallet.balance += roi;
          wallet.total_earned += roi;
          wallet.wallet_roi_earned = (wallet.wallet_roi_earned || 0) + roi;
          wallet.roi_earned = (wallet.roi_earned || 0) + roi; // For legacy
          wallet.last_roi_at = new Date().toISOString();
          walletUpdated = true;
          
          txs.push({
            id: 'tx_roi_wallet_' + Date.now() + Math.random(),
            user_id: userId,
            type: 'roi',
            amount: roi,
            status: 'completed',
            created_at: new Date().toISOString()
          });
        }
      }

      // 2. AutoPool ROI (1% Daily on $10)
      // Only if in Pool 1 and status is active
      const pools = getStorage('pools');
      const pool1 = pools.find((p: any) => p.user_id === userId && p.pool_number === 1 && p.status === 'active');
      
      if (pool1) {
        const lastPoolROI = wallet.last_pool_roi_at ? new Date(wallet.last_pool_roi_at).getTime() : new Date(pool1.created_at).getTime();
        const diffHoursPool = (now - lastPoolROI) / (1000 * 60 * 60);

        if (diffHoursPool >= 24) {
          const days = Math.floor(diffHoursPool / 24);
          const poolROI = 10 * 0.01 * days; // 1% of $10

          if (poolROI > 0) {
            wallet.balance += poolROI;
            wallet.total_earned += poolROI;
            wallet.pool_roi_earned = (wallet.pool_roi_earned || 0) + poolROI;
            wallet.last_pool_roi_at = new Date().toISOString();
            walletUpdated = true;

            txs.push({
              id: 'tx_roi_pool_' + Date.now() + Math.random(),
              user_id: userId,
              type: 'roi',
              amount: poolROI,
              status: 'completed',
              created_at: new Date().toISOString()
            });
          }
        }
      }

      if (walletUpdated) {
        setStorage('wallets', wallets.map((w: any) => w.user_id === userId ? wallet : w));
        setStorage('transactions', txs);
      }

      return wallet;
    },
    
    getMatrixDownline: async (userId: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.getMatrixDownline(userId);

      const users = getStorage('users');
      // Find users where this user is the matrix parent
      return users.filter((u: any) => u.matrix_parent_id === userId);
    },

    getDirectReferrals: async (userId: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.getDirectReferrals(userId);

      const users = getStorage('users');
      // Find users where this user is the sponsor
      return users.filter((u: any) => u.sponsor_id === userId);
    },
    
    getTasks: async () => {
      if (isAppwriteConfigured()) return await appwriteService.db.getTasks();

      let tasks = getStorage('tasks');
      if (tasks.length === 0) {
        tasks = [
          { id: 't1', title: 'Follow Twitter', description: 'Join our community', reward: 5, link: '#', is_active: true },
          { id: 't2', title: 'Join Telegram', description: 'Get daily updates', reward: 2, link: '#', is_active: true }
        ];
        setStorage('tasks', tasks);
      }
      return tasks;
    },

    submitTask: async (userId: string, taskId: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.submitTask(userId, taskId);

      const subs = getStorage('task_submissions');
      setStorage('task_submissions', [...subs, { user_id: userId, task_id: taskId, status: 'pending', id: Date.now().toString() }]);
    },

    getExchangeRequests: async (userId?: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.getExchangeRequests(userId);

      const reqs = getStorage('exchange_requests');
      const filtered = userId ? reqs.filter((r: any) => r.user_id === userId) : reqs;
      return filtered.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },

    getExchangeRequest: async (requestId: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.getExchangeRequest(requestId);
      const reqs = getStorage('exchange_requests');
      return reqs.find((r: any) => r.id === requestId);
    },

    createExchangeRequest: async (data: any) => {
      if (isAppwriteConfigured()) return await appwriteService.db.createExchangeRequest(data);

      const users = getStorage('users');
      const user = users.find((u: any) => u.id === data.user_id);
      if ((data.type === 'withdraw' || data.type === 'sell') && (!user || !user.is_active)) {
        throw new Error("Account activation required ($10) for this operation");
      }

      const reqs = getStorage('exchange_requests');
      const newReq = { ...data, id: 'ex_' + Date.now(), created_at: new Date().toISOString() };
      setStorage('exchange_requests', [...reqs, newReq]);
      return newReq;
    },

    updateExchangeRequest: async (id: string, data: any) => {
      if (isAppwriteConfigured()) return await appwriteService.db.updateExchangeRequest(id, data);

      const reqs = getStorage('exchange_requests');
      setStorage('exchange_requests', reqs.map((r: any) => r.id === id ? { ...r, ...data } : r));
    },

    // Admin Methods
    getAllUsers: async (limit = 50, offset = 0) => {
      if (isAppwriteConfigured()) return await appwriteService.db.getAllUsers(limit, offset);

      const users = getStorage('users');
      const wallets = getStorage('wallets');
      const sorted = users.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      const paginated = sorted.slice(offset, offset + limit);
      
      return paginated.map((u: any) => ({ ...u, wallets: [wallets.find((w: any) => w.user_id === u.id)] }));
    },

    updateUser: async (id: string, data: any) => {
      if (isAppwriteConfigured()) return await appwriteService.db.updateUser(id, data);

      const users = getStorage('users');
      setStorage('users', users.map((u: any) => u.id === id ? { ...u, ...data } : u));
    },

    updateWallet: async (userId: string, amount: number) => {
      if (isAppwriteConfigured()) return await appwriteService.db.updateWallet(userId, amount);

      const wallets = getStorage('wallets');
      setStorage('wallets', wallets.map((w: any) => w.user_id === userId ? { ...w, balance: amount } : w));
    },

    deleteUser: async (userId: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.deleteUser(userId);

      const users = getStorage('users');
      setStorage('users', users.filter((u: any) => u.id !== userId));
      
      const wallets = getStorage('wallets');
      setStorage('wallets', wallets.filter((w: any) => w.user_id !== userId));
      
      const txs = getStorage('transactions');
      setStorage('transactions', txs.filter((tx: any) => tx.user_id !== userId));
      
      const reqs = getStorage('exchange_requests');
      setStorage('exchange_requests', reqs.filter((r: any) => r.user_id !== userId));

      const pools = getStorage('pools');
      setStorage('pools', pools.filter((p: any) => p.user_id !== userId));

      const subs = getStorage('task_submissions');
      setStorage('task_submissions', subs.filter((s: any) => s.user_id !== userId));
    },

    purgeAllData: async () => {
      if (isAppwriteConfigured()) return await appwriteService.db.purgeAllData();

      const users = getStorage('users');
      const admins = users.filter((u: any) => u.role === 'admin');
      const adminIds = admins.map((a: any) => a.id);

      setStorage('users', admins);
      
      const wallets = getStorage('wallets');
      setStorage('wallets', wallets.filter((w: any) => adminIds.includes(w.user_id)));
      
      setStorage('transactions', []);
      setStorage('exchange_requests', []);
      setStorage('tasks', []);
      setStorage('task_submissions', []);
      setStorage('pools', []);
    },

    activateUser: async (userId: string, amount: number) => {
      if (isAppwriteConfigured()) return await appwriteService.db.activateUser(userId, amount);

      const users = getStorage('users');
      const user = users.find((u: any) => u.id === userId);
      if (!user) return;

      const wallet = await mockApi.db.getWallet(userId);

      // Case 1: User is already active, just add balance
      if (user.is_active) {
        const currentBalance = Number(wallet.balance) || 0;
        const addAmount = Number(amount) || 0;
        await mockApi.db.updateWallet(userId, currentBalance + addAmount);
        
        const txs = getStorage('transactions');
        txs.push({
          id: 'tx_deposit_' + Date.now(),
          user_id: userId,
          type: 'exchange',
          amount: addAmount,
          status: 'completed',
          created_at: new Date().toISOString()
        });
        setStorage('transactions', txs);
        return;
      }

      // Case 2: User is inactive but deposit is less than $10
      if (Number(amount) < 10) {
        const currentBalance = Number(wallet.balance) || 0;
        const addAmount = Number(amount) || 0;
        await mockApi.db.updateWallet(userId, currentBalance + addAmount);
        
        const txs = getStorage('transactions');
        txs.push({
          id: 'tx_partial_' + Date.now(),
          user_id: userId,
          type: 'exchange',
          amount: addAmount,
          status: 'completed',
          created_at: new Date().toISOString()
        });
        setStorage('transactions', txs);
        return;
      }

      // Case 3: User is inactive and deposit is $10 or more (Activation)
      user.is_active = true;
      const remainingBalance = (Number(amount) || 0) - 10; // Deduct $10 activation fee
      const currentBalance = Number(wallet.balance) || 0;

      if (remainingBalance > 0) {
        await mockApi.db.updateWallet(userId, currentBalance + remainingBalance);
      } else {
        // Even if amount is exactly 10, we ensure wallet balance doesn't increase by 10
        await mockApi.db.updateWallet(userId, currentBalance);
      }

      // Log Activation Transaction
      const txs = getStorage('transactions');
      txs.push({
        id: 'tx_activation_' + Date.now(),
        user_id: userId,
        type: 'exchange',
        amount: Number(amount),
        status: 'completed',
        created_at: new Date().toISOString()
      });
      setStorage('transactions', txs);

      // REMOVED: Automatic Pool 1 Entry here. It now happens via sponsor's direct count.
      
      // 2. Find Matrix Parent (Global Forced Matrix 2xN)
      const activeUsers = users.filter((u: any) => u.is_active && u.id !== userId)
        .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      let parent = null;
      let position: 'left' | 'right' = 'left';

      for (const u of activeUsers) {
        const children = users.filter((child: any) => child.matrix_parent_id === u.id);
        if (children.length === 0) {
          parent = u;
          position = 'left';
          break;
        } else if (children.length === 1) {
          parent = u;
          position = 'right';
          break;
        }
      }

      if (parent) {
        user.matrix_parent_id = parent.id;
        user.matrix_position = position;
      }

      setStorage('users', users);

      // 3. Distribute Direct Commission ($5) to Sponsor (ONLY IF SPONSOR IS ACTIVE)
      if (user.sponsor_id) {
        const sponsor = users.find((u: any) => u.id === user.sponsor_id);
        if (sponsor && sponsor.is_active) {
          sponsor.direct_count = (sponsor.direct_count || 0) + 1;
          const sponsorWallet = await mockApi.db.getWallet(sponsor.id);
          
          if (sponsor.direct_count === 1 || sponsor.direct_count === 3) {
            sponsorWallet.hold_balance = (sponsorWallet.hold_balance || 0) + 5;
            
            // Trigger AutoPool Entry if hold balance reaches $10
            if (sponsorWallet.hold_balance >= 10) {
              const pools = getStorage('pools');
              if (!pools.find((p: any) => p.user_id === sponsor.id && p.pool_number === 1)) {
                const newPoolEntry = {
                  id: 'pool_' + Date.now(),
                  user_id: sponsor.id,
                  pool_number: 1,
                  status: 'active',
                  members_count: 0,
                  created_at: new Date().toISOString()
                };
                setStorage('pools', [...pools, newPoolEntry]);
                sponsor.is_qualified = true;
                
                // IMPORTANT: Only now we trigger filling for the global pool
                // because a new person has actually entered Pool 1
                await mockApi.db.processPoolFilling(sponsor.id, 1);
              }
            }
          } else {
            sponsorWallet.balance += 5;
            sponsorWallet.total_earned += 5;
            
            const txs = getStorage('transactions');
            txs.push({
              id: 'tx_direct_' + Date.now() + Math.random(),
              user_id: sponsor.id,
              from_user_id: userId,
              type: 'direct',
              amount: 5,
              status: 'completed',
              created_at: new Date().toISOString()
            });
            setStorage('transactions', txs);
          }

          const wallets = getStorage('wallets');
          setStorage('wallets', wallets.map((w: any) => w.user_id === sponsor.id ? sponsorWallet : w));
          setStorage('users', users);
        }
      }

      // 4. Distribute Level Commission ($0.50) to Matrix Parents (6 levels) (ONLY IF PARENT IS ACTIVE)
      let currentParentId = user.matrix_parent_id;
      for (let level = 1; level <= 6; level++) {
        if (!currentParentId) break;
        const p = users.find((u: any) => u.id === currentParentId);
        if (p) {
          if (p.is_active) {
            const pWallet = await mockApi.db.getWallet(p.id);
            pWallet.balance += 0.5;
            pWallet.total_earned += 0.5;
            
            const txs = getStorage('transactions');
            txs.push({
              id: 'tx_level_' + level + '_' + Date.now() + Math.random(),
              user_id: p.id,
              from_user_id: userId,
              income_level: level,
              type: 'level',
              amount: 0.5,
              status: 'completed',
              created_at: new Date().toISOString()
            });
            setStorage('transactions', txs);
            
            const wallets = getStorage('wallets');
            setStorage('wallets', wallets.map((w: any) => w.user_id === p.id ? pWallet : w));
          }
          currentParentId = p.matrix_parent_id;
        } else {
          break;
        }
      }

      setStorage('users', users);
    },

    processPoolFilling: async (enteringUserId: string, poolNum: number) => {
      const pools = getStorage('pools');
      const users = getStorage('users');
      const wallets = getStorage('wallets');
      const txs = getStorage('transactions');

      // Find the oldest active pool that is not yet full
      // For Pool 1: Needs 4 members
      // For Pool 2-10: Needs 6 members
      
      // We process recursively to handle chain reactions (Pool 1 completion -> Pool 2 entry)
      const processCompletion = async (poolToFill: any) => {
        poolToFill.members_count = (poolToFill.members_count || 0) + 1;
        
        const requiredMembers = poolToFill.pool_number === 1 ? 4 : 6;
        
        if (poolToFill.members_count >= requiredMembers) {
          // Pool Completed!
          poolToFill.status = 'completed';
          const userId = poolToFill.user_id;
          const userWallet = wallets.find((w: any) => w.user_id === userId);
          const user = users.find((u: any) => u.id === userId);

          if (poolToFill.pool_number === 1) {
            // Pool 1 Logic: $40 Total
            // $10 Wallet, $10 Rebirth, $20 Upgrade to Pool 2
            userWallet.balance += 10;
            userWallet.total_earned += 10;
            
            txs.push({
              id: 'tx_pool1_comp_' + Date.now(),
              user_id: userId,
              type: 'pool_payout',
              amount: 10,
              status: 'completed',
              created_at: new Date().toISOString()
            });

            // Rebirth in Pool 1
            const rebirthEntry = {
              id: 'pool_rebirth_' + Date.now(),
              user_id: userId,
              pool_number: 1,
              status: 'active',
              members_count: 0,
              created_at: new Date().toISOString()
            };
            pools.push(rebirthEntry);
            // Rebirth also fills someone else's pool
            await findAndFillPool(1, userId);

            // Upgrade to Pool 2
            const pool2Entry = {
              id: 'pool_upg2_' + Date.now(),
              user_id: userId,
              pool_number: 2,
              status: 'active',
              members_count: 0,
              created_at: new Date().toISOString()
            };
            pools.push(pool2Entry);
            
            // Trigger filling for Pool 2
            await findAndFillPool(2, userId);
          } 
          else if (poolToFill.pool_number >= 2 && poolToFill.pool_number <= 9) {
            // Pool 2-9 Logic: 40% Upgrade, 50% Wallet, 10% Global Fund
            const entryValue = poolToFill.pool_number === 2 ? 20 : Math.pow(2.4, poolToFill.pool_number - 2) * 20;
            const poolFund = entryValue * 6;
            
            const walletAmount = poolFund * 0.5;
            const upgradeAmount = poolFund * 0.4;

            userWallet.balance += walletAmount;
            userWallet.total_earned += walletAmount;

            txs.push({
              id: `tx_pool${poolToFill.pool_number}_comp_` + Date.now(),
              user_id: userId,
              type: 'pool_payout',
              amount: walletAmount,
              status: 'completed',
              created_at: new Date().toISOString()
            });

            // Upgrade to Next Pool
            const nextPoolEntry = {
              id: `pool_upg${poolToFill.pool_number + 1}_` + Date.now(),
              user_id: userId,
              pool_number: poolToFill.pool_number + 1,
              status: 'active',
              members_count: 0,
              created_at: new Date().toISOString()
            };
            pools.push(nextPoolEntry);
            await findAndFillPool(poolToFill.pool_number + 1, userId);
          }
          else if (poolToFill.pool_number === 10) {
            // Pool 10 Logic: 90% Wallet, 10% Global Fund
            const entryValue = Math.pow(2.4, 8) * 20;
            const poolFund = entryValue * 6;
            const walletAmount = poolFund * 0.9;

            userWallet.balance += walletAmount;
            userWallet.total_earned += walletAmount;

            txs.push({
              id: 'tx_pool10_comp_' + Date.now(),
              user_id: userId,
              type: 'pool_payout',
              amount: walletAmount,
              status: 'completed',
              created_at: new Date().toISOString()
            });
          }
        }
      };

      const findAndFillPool = async (poolNum: number, enteringUserId: string) => {
        // Find the oldest active pool for this number that DOES NOT belong to the entering user
        const targetPool = pools.find((p: any) => 
          p.pool_number === poolNum && 
          p.status === 'active' && 
          p.user_id !== enteringUserId
        );
        if (targetPool) {
          await processCompletion(targetPool);
        }
      };

      // When a user enters a pool, they fill the oldest active pool of that same number
      await findAndFillPool(poolNum, enteringUserId);

      setStorage('pools', pools);
      setStorage('wallets', wallets);
      setStorage('transactions', txs);
    },

    updateUserPassword: async (userId: string, newPassword: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.updateUserPassword(userId, newPassword);

      const users = getStorage('users');
      const userIndex = users.findIndex((u: any) => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex].password = newPassword;
        setStorage('users', users);
      }
    },

    addTask: async (task: any) => {
      if (isAppwriteConfigured()) return await appwriteService.db.addTask(task);

      const tasks = getStorage('tasks');
      setStorage('tasks', [...tasks, { ...task, id: 't_' + Date.now(), is_active: true }]);
    },

    getSettings: async () => {
      if (isAppwriteConfigured()) return await appwriteService.db.getSettings();
      
      const settings = localStorage.getItem('spiral_mock_settings');
      if (!settings) {
        const defaultSettings = { 
          usdt_buy_rate: 92, 
          usdt_sell_rate: 88,
          admin_upi: 'spiral@upi',
          admin_qr: '',
          admin_address_trc20: 'TYL5Hw7hQ8w7X9...trc20_demo',
          admin_address_bep20: '0x7hQ8w7X9...bep20_demo',
          admin_address_erc20: '0xERC20...erc20_demo',
          marquee_text: '⚡ NODE ACTIVE: SYSTEM ONLINE | 💎 USDT/INR: ₹92.45 (+0.4%) | 🔥 NETWORK VOLUME: $4.2M | 🚀 NEW POOL 5 ENTRY FROM ID #8291',
          telegram_link: 'https://t.me/cryptospiral',
          min_deposit: 10,
          min_withdrawal: 20,
          max_withdrawal: 1000
        };
        localStorage.setItem('spiral_mock_settings', JSON.stringify(defaultSettings));
        return defaultSettings;
      }
      return JSON.parse(settings);
    },

    updateSettings: async (data: any) => {
      if (isAppwriteConfigured()) return await appwriteService.db.updateSettings(data);
      
      const current = JSON.parse(localStorage.getItem('spiral_mock_settings') || '{}');
      localStorage.setItem('spiral_mock_settings', JSON.stringify({ ...current, ...data }));
    }
  }
};
