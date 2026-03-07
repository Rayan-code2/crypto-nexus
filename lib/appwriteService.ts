import { account, databases, APPWRITE_CONFIG, isAppwriteConfigured } from './appwrite';
import { ID, Query } from 'appwrite';
import { Wallet } from '../types';

export const appwriteService = {
  auth: {
    signUp: async (email: string, pass: string, sponsorId?: string) => {
      try {
        const userId = ID.unique();
        await account.create(userId, email, pass);
        
        // Create user profile in database
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.users!,
          userId,
          {
            email,
            role: email.includes('admin') ? 'admin' : 'user',
            level: 1,
            sponsor_id: sponsorId || null,
            matrix_parent_id: null,
            matrix_position: null,
            direct_count: 0,
            is_blocked: false,
            is_active: false,
            is_qualified: false,
            created_at: new Date().toISOString()
          }
        );

        // Create initial wallet
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.wallets!,
          ID.unique(),
          {
            user_id: userId,
            balance: 0,
            total_earned: 0,
            roi_earned: 0,
            wallet_roi_earned: 0,
            pool_roi_earned: 0,
            total_withdrawn: 0,
            last_roi_at: new Date().toISOString(),
            last_pool_roi_at: new Date().toISOString()
          }
        );

        return { user: { id: userId, email } };
      } catch (error: any) {
        if (error.code === 409 || error.message?.includes('already exists')) {
          throw new Error("Terminal ID already registered. Please login.");
        }
        throw error;
      }
    },

    signIn: async (email: string, pass: string) => {
      try {
        // Try to delete existing session first to prevent "session active" error
        await account.deleteSession('current');
      } catch (e) {
        // Ignore if no session exists
      }
      await account.createEmailPasswordSession(email, pass);
      const user = await account.get();
      
      const profile = await databases.getDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!,
        user.$id
      );

      return { user: { ...profile, id: user.$id } };
    },

    signOut: async () => {
      try {
        await account.deleteSession('current');
      } catch (e) {
        // Ignore if session already deleted or missing
        console.warn("Appwrite session already cleared or missing");
      }
    },

    getCurrentUser: async () => {
      try {
        const user = await account.get();
        const profile = await databases.getDocument(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.users!,
          user.$id
        );
        return { ...profile, id: user.$id };
      } catch (e) {
        return null;
      }
    }
  },

  db: {
    getWallet: async (userId: string) => {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.wallets!,
        [Query.equal('user_id', userId)]
      );
      if (response.documents.length === 0) {
        // Create a wallet if it doesn't exist
        const newWallet = await databases.createDocument(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.wallets!,
          ID.unique(),
          {
            user_id: userId,
            balance: 0,
            total_earned: 0,
            roi_earned: 0,
            wallet_roi_earned: 0,
            pool_roi_earned: 0,
            total_withdrawn: 0,
            last_roi_at: new Date().toISOString(),
            last_pool_roi_at: new Date().toISOString()
          }
        );
        return { ...newWallet, id: newWallet.$id };
      }
      const wallet = response.documents[0];
      return { ...wallet, id: wallet.$id };
    },

    getTasks: async () => {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.tasks!,
        [Query.equal('is_active', true)]
      );
      return response.documents.map(doc => ({ ...doc, id: doc.$id }));
    },

    submitTask: async (userId: string, taskId: string) => {
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.submissions!,
        ID.unique(),
        {
          user_id: userId,
          task_id: taskId,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      );
    },

    getExchangeRequests: async (userId?: string) => {
      const queries = userId ? [Query.equal('user_id', userId)] : [];
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.exchanger!,
        queries
      );
      return response.documents.map(doc => ({ ...doc, id: doc.$id }));
    },

    createExchangeRequest: async (data: any) => {
      if (!APPWRITE_CONFIG.databaseId || !APPWRITE_CONFIG.collections.exchanger) {
        throw new Error("Appwrite Exchanger collection not configured. Please check your environment variables.");
      }

      const user = await databases.getDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, data.user_id);
      if ((data.type === 'withdraw' || data.type === 'sell') && (!user || !user.is_active)) {
        throw new Error("Account activation required ($10) for this operation");
      }

      try {
        // Remove undefined or empty optional fields to prevent Appwrite errors
        const sanitizedData = Object.fromEntries(
          Object.entries(data).filter(([_, v]) => v !== undefined && v !== null && v !== '')
        );

        return await databases.createDocument(
          APPWRITE_CONFIG.databaseId,
          APPWRITE_CONFIG.collections.exchanger,
          ID.unique(),
          {
            ...sanitizedData,
            created_at: new Date().toISOString()
          }
        );
      } catch (error: any) {
        console.error("Appwrite createExchangeRequest error:", error);
        if (error.message?.includes('Unknown attribute')) {
          const attr = error.message.split('"')[1] || 'unknown';
          throw new Error(`Appwrite Error: Attribute "${attr}" is missing in your "exchanger" collection. Please add it in Appwrite Console with EXACT spelling.`);
        }
        throw error;
      }
    },

    updateExchangeRequest: async (id: string, data: any) => {
      return await databases.updateDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.exchanger!,
        id,
        data
      );
    },

    getAllUsers: async () => {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!
      );
      return response.documents.map(doc => ({ ...doc, id: doc.$id }));
    },

    updateUser: async (id: string, data: any) => {
      try {
        return await databases.updateDocument(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.users!,
          id,
          data
        );
      } catch (error: any) {
        console.error("Appwrite updateUser error:", error);
        if (error.message?.includes('Unknown attribute')) {
          const attr = error.message.split('"')[1] || 'unknown';
          throw new Error(`Appwrite Error: Attribute "${attr}" is missing in your "users" collection. Please add it in Appwrite Console as a Boolean with default value "false".`);
        }
        throw error;
      }
    },

    updateWallet: async (userId: string, amount: number) => {
      const wallet = await appwriteService.db.getWallet(userId);
      return await databases.updateDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.wallets!,
        wallet.$id,
        { balance: amount }
      );
    },

    updateUserPassword: async (userId: string, newPassword: string) => {
      // Note: Client SDK can only update current user's password.
      // For admin to update another user's password, a server-side function or Server SDK is needed.
      // This is a placeholder for the interface.
      console.warn("updateUserPassword called for userId:", userId);
      // If it's the current user, we can use account.updatePassword
      // await account.updatePassword(newPassword);
    },

    distributeROI: async (userId: string) => {
      const wallet = await appwriteService.db.getWallet(userId) as any as Wallet & { $id: string };
      if (!wallet) return;

      const now = Date.now();
      let updateData: any = {};
      let walletUpdated = false;

      // 1. Wallet ROI (0.20% Daily)
      const lastROI = wallet.last_roi_at ? new Date(wallet.last_roi_at).getTime() : 0;
      const diffHoursROI = (now - lastROI) / (1000 * 60 * 60);

      if (diffHoursROI >= 24) {
        const days = Math.floor(diffHoursROI / 24);
        const dailyRate = 0.002; // 0.20%
        const roi = (wallet.balance || 0) * dailyRate * days;
        
        if (roi > 0) {
          updateData.balance = (wallet.balance || 0) + roi;
          updateData.total_earned = (wallet.total_earned || 0) + roi;
          updateData.wallet_roi_earned = (wallet.wallet_roi_earned || 0) + roi;
          updateData.roi_earned = (wallet.roi_earned || 0) + roi;
          updateData.last_roi_at = new Date().toISOString();
          walletUpdated = true;

          // Log transaction
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId!,
            APPWRITE_CONFIG.collections.transactions!,
            ID.unique(),
            {
              user_id: userId,
              type: 'roi',
              amount: roi,
              status: 'completed',
              created_at: new Date().toISOString()
            }
          );
        }
      }

      // 2. AutoPool ROI (1% Daily on $10)
      const poolsRes = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.pools!,
        [Query.equal('user_id', userId), Query.equal('pool_number', 1), Query.equal('status', 'active')]
      );
      
      if (poolsRes.total > 0) {
        const pool1 = poolsRes.documents[0];
        const lastPoolROI = wallet.last_pool_roi_at ? new Date(wallet.last_pool_roi_at).getTime() : new Date(pool1.created_at).getTime();
        const diffHoursPool = (now - lastPoolROI) / (1000 * 60 * 60);

        if (diffHoursPool >= 24) {
          const days = Math.floor(diffHoursPool / 24);
          const poolROI = 10 * 0.01 * days; // 1% of $10

          if (poolROI > 0) {
            updateData.balance = (updateData.balance || wallet.balance || 0) + poolROI;
            updateData.total_earned = (updateData.total_earned || wallet.total_earned || 0) + poolROI;
            updateData.pool_roi_earned = (wallet.pool_roi_earned || 0) + poolROI;
            updateData.last_pool_roi_at = new Date().toISOString();
            walletUpdated = true;

            // Log transaction
            await databases.createDocument(
              APPWRITE_CONFIG.databaseId!,
              APPWRITE_CONFIG.collections.transactions!,
              ID.unique(),
              {
                user_id: userId,
                type: 'roi',
                amount: poolROI,
                status: 'completed',
                created_at: new Date().toISOString()
              }
            );
          }
        }
      }

      if (walletUpdated) {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.wallets!,
          wallet.$id,
          updateData
        );
      }

      return wallet;
    },

    activateUser: async (userId: string, amount: number) => {
      const user = await databases.getDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, userId) as any;
      const wallet = await appwriteService.db.getWallet(userId) as any as Wallet;

      // Case 1: User is already active
      if (user.is_active) {
        await appwriteService.db.updateWallet(userId, wallet.balance + amount);
        return;
      }

      // Case 2: Inactive but amount < 10
      if (amount < 10) {
        await appwriteService.db.updateWallet(userId, wallet.balance + amount);
        return;
      }

      // Case 3: Activation (amount >= 10)
      await databases.updateDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, userId, { is_active: true });
      
      const remainingBalance = amount - 10;
      if (remainingBalance > 0) {
        await appwriteService.db.updateWallet(userId, wallet.balance + remainingBalance);
      } else {
        // Ensure wallet balance doesn't increase by 10 if amount is exactly 10
        await appwriteService.db.updateWallet(userId, wallet.balance);
      }

      // REMOVED: Automatic Pool 1 Entry here. It now happens via sponsor's direct count.
      
      // 2. Find Matrix Parent (Global Forced Matrix 2xN)
      const activeUsersRes = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!,
        [Query.equal('is_active', true), Query.notEqual('$id', userId), Query.orderAsc('created_at')]
      );
      
      let parentId = null;
      let position: 'left' | 'right' = 'left';

      for (const u of activeUsersRes.documents) {
        const childrenRes = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.users!,
          [Query.equal('matrix_parent_id', u.$id)]
        );
        if (childrenRes.total === 0) {
          parentId = u.$id;
          position = 'left';
          break;
        } else if (childrenRes.total === 1) {
          parentId = u.$id;
          position = 'right';
          break;
        }
      }

      if (parentId) {
        await databases.updateDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, userId, {
          matrix_parent_id: parentId,
          matrix_position: position
        });
      }

      // 3. Distribute Direct Commission ($5) to Sponsor (ONLY IF ACTIVE)
      if (user.sponsor_id) {
        try {
          const sponsor = await databases.getDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, user.sponsor_id) as any;
          if (sponsor.is_active) {
            const newDirectCount = (sponsor.direct_count || 0) + 1;
            const sponsorWallet = await appwriteService.db.getWallet(sponsor.$id) as any as Wallet;
            
            let updateData: any = { direct_count: newDirectCount };
            let walletUpdate: any = {};

            if (newDirectCount === 1 || newDirectCount === 3) {
              walletUpdate.hold_balance = (sponsorWallet.hold_balance || 0) + 5;
              
              // Trigger AutoPool Entry if hold balance reaches $10
              if (walletUpdate.hold_balance >= 10) {
                // Check if already in pool
                const existingPools = await databases.listDocuments(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.pools!,
                  [Query.equal('user_id', sponsor.$id), Query.equal('pool_number', 1)]
                );

                if (existingPools.total === 0) {
                  await databases.createDocument(
                    APPWRITE_CONFIG.databaseId!,
                    APPWRITE_CONFIG.collections.pools!,
                    ID.unique(),
                    {
                      user_id: sponsor.$id,
                      pool_number: 1,
                      status: 'active',
                      members_count: 0,
                      created_at: new Date().toISOString()
                    }
                  );
                  updateData.is_qualified = true;
                }
              }
            } else {
              walletUpdate.balance = (sponsorWallet.balance || 0) + 5;
              walletUpdate.total_earned = (sponsorWallet.total_earned || 0) + 5;
            }

            await databases.updateDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, sponsor.$id, updateData);
            await databases.updateDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.wallets!, (sponsorWallet as any).$id, walletUpdate);
          }
        } catch (e) {
          console.error("Sponsor commission error:", e);
        }
      }

      // 4. Distribute Level Commission ($0.50) to Matrix Parents (6 levels) (ONLY IF ACTIVE)
      let currentParentId = parentId;
      for (let level = 1; level <= 6; level++) {
        if (!currentParentId) break;
        try {
          const p = await databases.getDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, currentParentId) as any;
          if (p.is_active) {
            const pWallet = await appwriteService.db.getWallet(p.$id) as any as Wallet;
            
            await databases.updateDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.wallets!, (pWallet as any).$id, {
              balance: (pWallet.balance || 0) + 0.5,
              total_earned: (pWallet.total_earned || 0) + 0.5
            });
          }
          currentParentId = p.matrix_parent_id;
        } catch (e) {
          break;
        }
      }

      // 5. Global AutoPool Filling Logic
      await appwriteService.db.processPoolFilling(userId);
    },

    processPoolFilling: async (newUserId: string) => {
      // Find the oldest active pool that needs filling
      // For Pool 1: Needs 4 members
      // For Pool 2-10: Needs 6 members
      
      const findAndFill = async (poolNum: number) => {
        try {
          const activePools = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId!,
            APPWRITE_CONFIG.collections.pools!,
            [
              Query.equal('pool_number', poolNum),
              Query.equal('status', 'active'),
              Query.orderAsc('created_at'),
              Query.limit(1)
            ]
          );

          if (activePools.total > 0) {
            const poolToFill = activePools.documents[0] as any;
            const newCount = (poolToFill.members_count || 0) + 1;
            const required = poolNum === 1 ? 4 : 6;

            if (newCount >= required) {
              // Pool Completed!
              await databases.updateDocument(
                APPWRITE_CONFIG.databaseId!,
                APPWRITE_CONFIG.collections.pools!,
                poolToFill.$id,
                { status: 'completed', members_count: newCount }
              );

              const userId = poolToFill.user_id;
              const userWallet = await appwriteService.db.getWallet(userId) as any;
              
              if (poolNum === 1) {
                // $10 Wallet, $10 Rebirth, $20 Upgrade
                await databases.updateDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.wallets!,
                  userWallet.$id,
                  { 
                    balance: (userWallet.balance || 0) + 10,
                    total_earned: (userWallet.total_earned || 0) + 10
                  }
                );

                // Rebirth in Pool 1
                await databases.createDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.pools!,
                  ID.unique(),
                  {
                    user_id: userId,
                    pool_number: 1,
                    status: 'active',
                    members_count: 0,
                    created_at: new Date().toISOString()
                  }
                );

                // Upgrade to Pool 2
                await databases.createDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.pools!,
                  ID.unique(),
                  {
                    user_id: userId,
                    pool_number: 2,
                    status: 'active',
                    members_count: 0,
                    created_at: new Date().toISOString()
                  }
                );
                
                // Chain reaction: Fill Pool 2
                await findAndFill(2);
              } 
              else if (poolNum >= 2 && poolNum <= 9) {
                // 40% Upgrade, 50% Wallet, 10% Global
                const entryValue = poolNum === 2 ? 20 : Math.pow(2.4, poolNum - 2) * 20;
                const poolFund = entryValue * 6;
                const walletAmount = poolFund * 0.5;

                await databases.updateDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.wallets!,
                  userWallet.$id,
                  { 
                    balance: (userWallet.balance || 0) + walletAmount,
                    total_earned: (userWallet.total_earned || 0) + walletAmount
                  }
                );

                // Upgrade
                await databases.createDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.pools!,
                  ID.unique(),
                  {
                    user_id: userId,
                    pool_number: poolNum + 1,
                    status: 'active',
                    members_count: 0,
                    created_at: new Date().toISOString()
                  }
                );
                await findAndFill(poolNum + 1);
              }
              else if (poolNum === 10) {
                // 90% Wallet, 10% Global
                const entryValue = Math.pow(2.4, 8) * 20;
                const poolFund = entryValue * 6;
                const walletAmount = poolFund * 0.9;

                await databases.updateDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.wallets!,
                  userWallet.$id,
                  { 
                    balance: (userWallet.balance || 0) + walletAmount,
                    total_earned: (userWallet.total_earned || 0) + walletAmount
                  }
                );
              }
            } else {
              await databases.updateDocument(
                APPWRITE_CONFIG.databaseId!,
                APPWRITE_CONFIG.collections.pools!,
                poolToFill.$id,
                { members_count: newCount }
              );
            }
          }
        } catch (e) {
          console.error(`Pool filling error (Pool ${poolNum}):`, e);
        }
      };

      // Start by filling Pool 1
      await findAndFill(1);
    },

    addTask: async (task: any) => {
      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.tasks!,
        ID.unique(),
        { ...task, is_active: true, created_at: new Date().toISOString() }
      );
    },

    getSettings: async () => {
      try {
        const response = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId!,
          'setting'
        );
        if (response.documents.length === 0) {
          // Create default settings if not exist
          const defaultSettings = await databases.createDocument(
            APPWRITE_CONFIG.databaseId!,
            'setting',
            'global_config',
            {
              usdt_buy_rate: 92,
              usdt_sell_rate: 88,
              admin_upi: 'yourname@upi',
              admin_qr: '',
              admin_address_trc20: 'TYL5Hw7hQ8w7X9...trc20_demo',
              admin_address_bep20: '0x7hQ8w7X9...bep20_demo',
              admin_address_erc20: '0xERC20...erc20_demo',
              telegram_link: 'https://t.me/cryptospiral',
              updated_at: new Date().toISOString()
            }
          );
          return { ...defaultSettings, id: defaultSettings.$id };
        }
        const settings = response.documents[0];
        return { ...settings, id: settings.$id };
      } catch (error: any) {
        console.error("Appwrite getSettings error:", error);
        if (error.message?.includes('not authorized')) {
          throw new Error("Appwrite Error: You need to set Permissions to 'Any' (Read/Write) for the 'setting' collection in Appwrite Console.");
        }
        throw error;
      }
    },

    updateSettings: async (data: any) => {
      try {
        return await databases.updateDocument(
          APPWRITE_CONFIG.databaseId!,
          'setting',
          'global_config',
          {
            ...data,
            updated_at: new Date().toISOString()
          }
        );
      } catch (error: any) {
        console.error("Appwrite updateSettings error:", error);
        if (error.message?.includes('Unknown attribute')) {
          const attr = error.message.split('"')[1] || 'unknown';
          throw new Error(`Appwrite Error: Attribute "${attr}" is missing in your "setting" collection. Please add it in Appwrite Console as a String (admin_address_trc20, admin_address_bep20, admin_address_erc20).`);
        }
        throw error;
      }
    },

    getMatrixDownline: async (userId: string) => {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!,
        [Query.or([
          Query.equal('sponsor_id', userId),
          Query.equal('matrix_parent_id', userId)
        ])]
      );
      return response.documents.map(doc => ({ ...doc, id: doc.$id }));
    },

    getPools: async (userId: string) => {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.pools!,
        [Query.equal('user_id', userId)]
      );
      return response.documents.map(doc => ({ ...doc, id: doc.$id }));
    },

    getTransactions: async (userId: string) => {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.transactions!,
        [Query.equal('user_id', userId), Query.orderDesc('created_at')]
      );
      return response.documents.map(doc => ({ ...doc, id: doc.$id }));
    }
  }
};
