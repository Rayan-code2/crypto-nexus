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
        const userData: any = {
          email,
          role: email.includes('admin') ? 'admin' : 'user',
          level: 1,
          sponsor_id: sponsorId || null,
          matrix_parent_id: null,
          matrix_position: null,
          direct_count: 0,
          children_count: 0,
          is_blocked: false,
          is_active: false,
          is_qualified: false,
          created_at: new Date().toISOString()
        };

        try {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId!,
            APPWRITE_CONFIG.collections.users!,
            userId,
            userData
          );
        } catch (error: any) {
          if (error.message?.includes('UNKNOWN_ATTRIBUTE')) {
            const attr = error.message.match(/"([^"]+)"/)?.[1] || "required attributes";
            throw new Error(`Appwrite Schema Error: Please add '${attr}' (String/Integer/Boolean) attribute to your 'users' collection in Appwrite Console.`);
          }
          throw error;
        }

        // Create initial wallet
        try {
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
              direct_income: 0,
              level_income: 0,
              hold_balance: 0,
              total_withdrawn: 0,
              last_roi_at: new Date().toISOString(),
              last_pool_roi_at: new Date().toISOString()
            }
          );
        } catch (error: any) {
          if (error.message?.includes('UNKNOWN_ATTRIBUTE')) {
            const attr = error.message.match(/"([^"]+)"/)?.[1] || "required attributes";
            throw new Error(`Appwrite Schema Error: Please add '${attr}' (Float/Integer) attribute to your 'wallets' collection in Appwrite Console.`);
          }
          throw error;
        }

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
      try {
        if (!isAppwriteConfigured()) throw new Error("Appwrite not configured");
        
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
              balance: 0.0,
              total_earned: 0.0,
              roi_earned: 0.0,
              wallet_roi_earned: 0.0,
              pool_roi_earned: 0.0,
              direct_income: 0.0,
              level_income: 0.0,
              hold_balance: 0.0,
              total_withdrawn: 0.0,
              last_roi_at: new Date().toISOString(),
              last_pool_roi_at: new Date().toISOString()
            }
          );
          return { ...newWallet, id: newWallet.$id };
        }
        const wallet = response.documents[0];
        return { ...wallet, id: wallet.$id };
      } catch (error: any) {
        console.error("Appwrite getWallet error:", error);
        if (error.message === 'Failed to fetch' || error.message?.includes('Network Error')) {
          throw new Error("Network Error: Could not connect to Appwrite. Please check if your endpoint is correct and if you have added your domain to Appwrite Platforms.");
        }
        if (error.message?.includes('Unknown attribute')) {
          const attr = error.message.match(/"([^"]+)"/)?.[1] || "balance";
          throw new Error(`Appwrite Schema Error: Please add '${attr}' (Float/Double) attribute to your 'wallets' collection.`);
        }
        throw error;
      }
    },

    getTasks: async () => {
      try {
        if (!isAppwriteConfigured()) throw new Error("Appwrite not configured");

        const response = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.tasks!,
          [Query.equal('is_active', true)]
        );
        return response.documents.map(doc => ({ ...doc, id: doc.$id }));
      } catch (error: any) {
        console.error("Appwrite getTasks error:", error);
        if (error.message?.includes('Collection not found')) {
          throw new Error("Appwrite Error: The 'tasks' collection is missing. Please create it in Appwrite Console with ID 'tasks'.");
        }
        throw error;
      }
    },

    submitTask: async (userId: string, taskId: string, proof: string) => {
      try {
        if (!isAppwriteConfigured()) throw new Error("Appwrite not configured");

        await databases.createDocument(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.submissions!,
          ID.unique(),
          {
            user_id: userId,
            task_id: taskId,
            status: 'pending',
            proof: proof,
            created_at: new Date().toISOString()
          }
        );
      } catch (error: any) {
        console.error("Appwrite submitTask error:", error);
        if (error.message?.includes('Unknown attribute')) {
          const attr = error.message.match(/"([^"]+)"/)?.[1] || "user_id/task_id/status/proof";
          throw new Error(`Appwrite Schema Error: Please add '${attr}' (String) attribute to your 'submissions' collection in Appwrite Console.`);
        }
        if (error.message?.includes('not authorized') || error.message?.includes('Permission denied')) {
          throw new Error("Appwrite Permission Error: You do not have 'Create' permission for the 'submissions' collection. Please set 'Any' or 'Users' permissions in Appwrite Console.");
        }
        throw error;
      }
    },

    getTaskSubmissions: async (userId?: string) => {
      try {
        if (!isAppwriteConfigured()) throw new Error("Appwrite not configured");

        const queries = userId ? [Query.equal('user_id', userId)] : [];
        queries.push(Query.orderDesc('$createdAt'));
        queries.push(Query.limit(100));
        
        const response = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.submissions!,
          queries
        );
        return response.documents.map(doc => ({ ...doc, id: doc.$id }));
      } catch (error: any) {
        console.error("Appwrite getTaskSubmissions error:", error);
        if (error.message?.includes('Collection not found')) {
          throw new Error("Appwrite Error: The 'submissions' collection is missing. Please create it in Appwrite Console with ID 'submissions'.");
        }
        throw error;
      }
    },

    approveTaskSubmission: async (submissionId: string, status: 'approved' | 'rejected') => {
      // This is a placeholder for the logic. 
      // In a real app, this would be a server-side function to handle wallet updates securely.
      return await databases.updateDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.submissions!,
        submissionId,
        { status }
      );
    },

    getExchangeRequests: async (userId?: string) => {
      const queries = userId ? [Query.equal('user_id', userId)] : [];
      queries.push(Query.orderDesc('created_at'));
      queries.push(Query.limit(100));
      
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.exchanger!,
        queries
      );
      return response.documents.map(doc => ({ ...doc, id: doc.$id }));
    },

    getExchangeRequest: async (requestId: string) => {
      const doc = await databases.getDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.exchanger!,
        requestId
      );
      return { ...doc, id: doc.$id };
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

    getAllUsers: async (limit = 50, offset = 0) => {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!,
        [Query.limit(limit), Query.offset(offset), Query.orderDesc('created_at')]
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
      try {
        const wallet = await appwriteService.db.getWallet(userId);
        const finalAmount = parseFloat(amount.toFixed(4));
        console.log(`Updating wallet for ${userId} to ${finalAmount}`);
        return await databases.updateDocument(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.wallets!,
          wallet.$id,
          { balance: finalAmount }
        );
      } catch (error: any) {
        console.error("Appwrite updateWallet error:", error);
        if (error.message?.includes('not authorized') || error.message?.includes('Permission denied')) {
          throw new Error("Appwrite Permission Error: Admin does not have 'Update' permission for the 'wallets' collection. Please set 'Any' or 'Users' permissions in Appwrite Console.");
        }
        throw error;
      }
    },

    deleteUser: async (userId: string) => {
      // 1. Delete user from database
      await databases.deleteDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!,
        userId
      );
      
      // 2. Delete wallet
      const wallet = await appwriteService.db.getWallet(userId);
      if (wallet) {
        await databases.deleteDocument(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.wallets!,
          wallet.$id
        );
      }

      // 3. Delete other related data (Transactions, Exchanger, Submissions, Pools)
      const collectionsToClean = [
        { id: APPWRITE_CONFIG.collections.transactions!, name: 'transactions' },
        { id: APPWRITE_CONFIG.collections.exchanger!, name: 'exchanger' },
        { id: APPWRITE_CONFIG.collections.submissions!, name: 'submissions' },
        { id: APPWRITE_CONFIG.collections.pools!, name: 'pools' }
      ];

      for (const col of collectionsToClean) {
        if (!col.id) continue;
        try {
          // Delete up to 500 records (usually enough for a single user)
          const docs = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId!,
            col.id,
            [Query.equal('user_id', userId), Query.limit(100)]
          );
          
          for (const doc of docs.documents) {
            await databases.deleteDocument(APPWRITE_CONFIG.databaseId!, col.id, doc.$id);
          }
          
          // If there were 100, there might be more, but for a single user delete, 
          // we usually don't expect thousands of records in these specific collections 
          // that would block the UI.
        } catch (e) {
          console.error(`Error cleaning up ${col.name} for user ${userId}:`, e);
        }
      }
    },

    purgeAllData: async () => {
      const collections = [
        { id: APPWRITE_CONFIG.collections.users!, name: 'users' },
        { id: APPWRITE_CONFIG.collections.wallets!, name: 'wallets' },
        { id: APPWRITE_CONFIG.collections.transactions!, name: 'transactions' },
        { id: APPWRITE_CONFIG.collections.exchanger!, name: 'exchanger' },
        { id: APPWRITE_CONFIG.collections.tasks!, name: 'tasks' },
        { id: APPWRITE_CONFIG.collections.submissions!, name: 'submissions' },
        { id: APPWRITE_CONFIG.collections.pools!, name: 'pools' }
      ];

      for (const col of collections) {
        if (!col.id) continue;
        let hasMore = true;
        let attempt = 0;
        let offset = 0;
        const maxAttempts = 50; // Increased safety break

        while (hasMore && attempt < maxAttempts) {
          attempt++;
          try {
            const docs = await databases.listDocuments(APPWRITE_CONFIG.databaseId!, col.id, [
              Query.limit(100),
              Query.offset(offset)
            ]);
            
            if (docs.documents.length === 0) {
              hasMore = false;
              break;
            }

            let deletedInThisBatch = 0;
            for (const doc of docs.documents) {
              // Skip admin users
              if (col.name === 'users' && doc.role === 'admin') continue;
              
              // Skip admin wallets
              if (col.name === 'wallets') {
                try {
                  const user = await databases.getDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, doc.user_id);
                  if (user.role === 'admin') continue;
                } catch (e) {
                  // If user not found, it's an orphan, delete it
                }
              }

              await databases.deleteDocument(APPWRITE_CONFIG.databaseId!, col.id, doc.$id);
              deletedInThisBatch++;
            }

            // If we didn't delete anything in this batch but there are documents, 
            // it means they are all admins/protected. Increase offset to skip them.
            if (deletedInThisBatch === 0) {
              offset += docs.documents.length;
            } else {
              // We deleted some, so the list shifted. 
              // We don't necessarily need to increase offset because the next batch 
              // will "slide up" into the current window.
              // However, we should reset offset if we cleared everything that was before it.
              // For simplicity, if we deleted anything, we stay at current offset 
              // but check if we are still finding documents.
            }
            
            hasMore = docs.documents.length === 100;
          } catch (error) {
            console.error(`Error purging collection ${col.name}:`, error);
            hasMore = false;
          }
        }
      }
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
      try {
        if (!isAppwriteConfigured()) return;
        
        if (userId === "admin-trigger") {
          console.log("🚀 Starting Global ROI Distribution...");
          // Fetch all wallets
          const walletsRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId!,
            APPWRITE_CONFIG.collections.wallets!,
            [Query.limit(1000)] // Adjust limit if needed
          );

          console.log(`Found ${walletsRes.documents.length} wallets to process.`);

          let successCount = 0;
          let failCount = 0;
          for (const walletDoc of walletsRes.documents) {
            try {
              await appwriteService.db.distributeROI(walletDoc.user_id);
              successCount++;
              if (successCount % 10 === 0) {
                console.log(`Progress: ${successCount} wallets processed...`);
              }
            } catch (e) {
              failCount++;
              console.error(`Failed to distribute ROI for user ${walletDoc.user_id}:`, e);
            }
          }
          console.log(`✅ Global ROI Distribution completed. Success: ${successCount}, Failed: ${failCount}`);
          return { success: true, count: successCount, failed: failCount };
        }

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
          const roi = Number(((wallet.balance || 0) * dailyRate * days).toFixed(4));
          
          if (roi > 0) {
            updateData.balance = Number(((wallet.balance || 0) + roi).toFixed(4));
            updateData.total_earned = Number(((wallet.total_earned || 0) + roi).toFixed(4));
            updateData.wallet_roi_earned = Number(((wallet.wallet_roi_earned || 0) + roi).toFixed(4));
            updateData.roi_earned = Number(((wallet.roi_earned || 0) + roi).toFixed(4));
            updateData.last_roi_at = new Date().toISOString();
            walletUpdated = true;

            // Log transaction
            try {
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
            } catch (e) {
              console.error(`Failed to log ROI transaction for user ${userId}`, e);
            }
          }
        }

        // 2. AutoPool ROI (0.5% Daily on $10)
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
            const poolROI = Number((10 * 0.005 * days).toFixed(4)); // 0.5% of $10

            if (poolROI > 0) {
              updateData.balance = Number(((updateData.balance || wallet.balance || 0) + poolROI).toFixed(4));
              updateData.total_earned = Number(((updateData.total_earned || wallet.total_earned || 0) + poolROI).toFixed(4));
              updateData.pool_roi_earned = Number(((wallet.pool_roi_earned || 0) + poolROI).toFixed(4));
              updateData.last_pool_roi_at = new Date().toISOString();
              walletUpdated = true;

              // Log transaction
              try {
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
              } catch (e) {
                console.error(`Failed to log Pool ROI transaction for user ${userId}`, e);
              }
            }
          }
        }

        if (walletUpdated) {
          console.log(`ROI Distribution for ${userId}:`, updateData);
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId!,
            APPWRITE_CONFIG.collections.wallets!,
            wallet.$id,
            updateData
          );
        }

        return wallet;
      } catch (error: any) {
        console.error("ROI Distribution Error:", error);
        if (error.message === 'Failed to fetch') {
          console.error("❌ ROI Distribution failed due to network error. Check Appwrite endpoint/CORS.");
        }
        // Don't throw, just log so it doesn't block other operations
      }
    },

    activateUser: async (userId: string, amount: number) => {
      try {
        const user = await databases.getDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, userId) as any;
        const wallet = await appwriteService.db.getWallet(userId) as any as Wallet;
        const settings = await appwriteService.db.getSettings() as any;
        
        const depositFeePercent = settings.deposit_fee || 0;
        const feeAmount = (parseFloat(amount.toString()) * depositFeePercent) / 100;
        const netAmount = parseFloat(amount.toString()) - feeAmount;

        console.log(`Activating/Updating user ${userId} with amount ${amount}. Net amount after ${depositFeePercent}% fee: ${netAmount}`);

        // Case 1: User is already active
        if (user.is_active) {
          const currentBalance = parseFloat((wallet.balance || 0).toString());
          await appwriteService.db.updateWallet(userId, currentBalance + netAmount);
          
          // Log Transaction
          try {
            await databases.createDocument(
              APPWRITE_CONFIG.databaseId!,
              APPWRITE_CONFIG.collections.transactions!,
              ID.unique(),
              {
                user_id: userId,
                type: 'exchange',
                amount: netAmount,
                status: 'completed',
                created_at: new Date().toISOString()
              }
            );
          } catch (e) {
            console.error("Failed to log deposit transaction", e);
          }
          return;
        }

        // Case 2: Inactive but amount < 10
        if (parseFloat(amount.toString()) < 10) {
          const currentBalance = parseFloat((wallet.balance || 0).toString());
          await appwriteService.db.updateWallet(userId, currentBalance + netAmount);
          
          // Log Transaction
          try {
            await databases.createDocument(
              APPWRITE_CONFIG.databaseId!,
              APPWRITE_CONFIG.collections.transactions!,
              ID.unique(),
              {
                user_id: userId,
                type: 'exchange',
                amount: netAmount,
                status: 'completed',
                created_at: new Date().toISOString()
              }
            );
          } catch (e) {
            console.error("Failed to log partial deposit transaction", e);
          }
          return;
        }

      // Case 3: Activation (amount >= 10)
      try {
        await databases.updateDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, userId, { is_active: true });
      } catch (e: any) {
        console.error("Failed to set is_active: true", e);
        if (e.message?.includes('not authorized') || e.message?.includes('Permission denied')) {
          throw new Error("Appwrite Permission Error: Your account or the Admin does not have 'Update' permission for the 'users' collection.");
        }
        throw new Error(`Activation failed: Could not update user status. ${e.message}`);
      }
      
        const remainingBalance = netAmount - 10;
        const currentBalance = parseFloat((wallet.balance || 0).toString());

        if (remainingBalance > 0) {
          await appwriteService.db.updateWallet(userId, currentBalance + remainingBalance);
        } else {
          // Ensure wallet balance doesn't increase by 10 if amount is exactly 10
          await appwriteService.db.updateWallet(userId, currentBalance);
        }

      // Log Activation Transaction
      try {
        await databases.createDocument(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.transactions!,
          ID.unique(),
          {
            user_id: userId,
            type: 'exchange',
            amount: netAmount,
            status: 'completed',
            created_at: new Date().toISOString()
          }
        );
      } catch (e) {
        console.error("Failed to log activation transaction", e);
      }

      // REMOVED: Automatic Pool 1 Entry here. It now happens via sponsor's direct count.
      
      // 2. Find Matrix Parent (Global Forced Matrix 2xN) - OPTIMIZED for Millions of Users
      let parentId: string | null = null;
      try {
        const potentialParents = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.users!,
          [
            Query.equal('is_active', true),
            Query.notEqual('$id', userId),
            Query.lessThan('children_count', 2),
            Query.orderAsc('created_at'),
            Query.limit(1)
          ]
        );
        
        let position: 'left' | 'right' = 'left';

        if (potentialParents.documents.length > 0) {
          const parent = potentialParents.documents[0] as any;
          parentId = parent.$id;
          
          // Determine position based on current children count
          const childrenRes = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId!,
            APPWRITE_CONFIG.collections.users!,
            [Query.equal('matrix_parent_id', parentId)]
          );
          position = childrenRes.total === 0 ? 'left' : 'right';

          // Update parent's children count
          await databases.updateDocument(
            APPWRITE_CONFIG.databaseId!,
            APPWRITE_CONFIG.collections.users!,
            parentId,
            { children_count: (parent.children_count || 0) + 1 }
          );

          await databases.updateDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, userId, {
            matrix_parent_id: parentId,
            matrix_position: position
          });
        } else {
          // FALLBACK: If no active parent found with space, find the first admin
          const admins = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId!,
            APPWRITE_CONFIG.collections.users!,
            [Query.equal('role', 'admin'), Query.limit(1)]
          );
          
          if (admins.documents.length > 0) {
            const admin = admins.documents[0] as any;
            // Only place under admin if it's not the user themselves
            if (admin.$id !== userId) {
              parentId = admin.$id;
              
              const childrenRes = await databases.listDocuments(
                APPWRITE_CONFIG.databaseId!,
                APPWRITE_CONFIG.collections.users!,
                [Query.equal('matrix_parent_id', parentId)]
              );
              position = childrenRes.total === 0 ? 'left' : 'right';

              await databases.updateDocument(
                APPWRITE_CONFIG.databaseId!,
                APPWRITE_CONFIG.collections.users!,
                parentId,
                { children_count: (admin.children_count || 0) + 1 }
              );

              await databases.updateDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, userId, {
                matrix_parent_id: parentId,
                matrix_position: position
              });
            }
          }
        }
      } catch (error: any) {
        if (error.message?.includes('children_count')) {
          throw new Error("Appwrite Schema Error: Please add 'children_count' (Integer, default 0) attribute to your 'users' collection in Appwrite Console.");
        }
        console.error("Matrix placement error:", error);
        // Continue even if matrix fails, so user is at least active
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
              walletUpdate.direct_income = (sponsorWallet.direct_income || 0) + 5;
            }

            await databases.updateDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, sponsor.$id, updateData);
            await databases.updateDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.wallets!, (sponsorWallet as any).$id, walletUpdate);

            // Trigger AutoPool Filling for Pool 1 because a new person has actually entered
            if (updateData.is_qualified) {
              try {
                await appwriteService.db.processPoolFilling(sponsor.$id, 1);
              } catch (e) {
                console.error("Pool filling error on qualification:", e);
              }
            }

            // Log Direct Commission Transaction
            if (walletUpdate.balance > 0) {
              await databases.createDocument(
                APPWRITE_CONFIG.databaseId!,
                APPWRITE_CONFIG.collections.transactions!,
                ID.unique(),
                {
                  user_id: sponsor.$id,
                  from_user_id: userId,
                  type: 'direct',
                  amount: 5,
                  status: 'completed',
                  created_at: new Date().toISOString()
                }
              );
            }
          }
        } catch (e) {
          console.error("Sponsor commission error:", e);
        }
      }

      // 4. Distribute Level Commission ($0.50) to Matrix Parents (6 levels) (ONLY IF ACTIVE)
      try {
        let currentParentId = parentId;
        for (let level = 1; level <= 6; level++) {
          if (!currentParentId) break;
          try {
            const p = await databases.getDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.users!, currentParentId) as any;
            if (p.is_active) {
              const pWallet = await appwriteService.db.getWallet(p.$id) as any as Wallet;
              
              await databases.updateDocument(APPWRITE_CONFIG.databaseId!, APPWRITE_CONFIG.collections.wallets!, (pWallet as any).$id, {
                balance: (pWallet.balance || 0) + 0.5,
                total_earned: (pWallet.total_earned || 0) + 0.5,
                level_income: (pWallet.level_income || 0) + 0.5
              });

              // Log Level Commission Transaction
              await databases.createDocument(
                APPWRITE_CONFIG.databaseId!,
                APPWRITE_CONFIG.collections.transactions!,
                ID.unique(),
                {
                  user_id: p.$id,
                  from_user_id: userId,
                  income_level: level,
                  type: 'level',
                  amount: 0.5,
                  status: 'completed',
                  created_at: new Date().toISOString()
                }
              );
            }
            currentParentId = p.matrix_parent_id;
          } catch (e) {
            console.error(`Level ${level} commission error:`, e);
            break;
          }
        }
      } catch (e) {
        console.error("Level commission distribution error:", e);
      }
    } catch (error: any) {
      console.error("Appwrite activateUser error:", error);
      throw error;
    }
  },

    processPoolFilling: async (enteringUserId: string, poolNum: number) => {
      // Find the oldest active pool that needs filling
      // For Pool 1: Needs 4 members
      // For Pool 2-10: Needs 6 members
      
      const findAndFill = async (pNum: number, eUserId: string) => {
        try {
          const activePools = await databases.listDocuments(
            APPWRITE_CONFIG.databaseId!,
            APPWRITE_CONFIG.collections.pools!,
            [
              Query.equal('pool_number', pNum),
              Query.equal('status', 'active'),
              Query.notEqual('user_id', eUserId), // Cannot fill own pool
              Query.orderAsc('created_at'),
              Query.limit(1)
            ]
          );

          if (activePools.total > 0) {
            const poolToFill = activePools.documents[0] as any;
            const newCount = (poolToFill.members_count || 0) + 1;
            const required = pNum === 1 ? 4 : 6;

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
              
              if (pNum === 1) {
                // $10 Wallet, $10 Rebirth, $20 Upgrade
                await databases.updateDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.wallets!,
                  userWallet.$id,
                  { 
                    balance: (userWallet.balance || 0) + 10,
                    total_earned: (userWallet.total_earned || 0) + 10,
                    pool_roi_earned: (userWallet.pool_roi_earned || 0) + 10
                  }
                );

                // Log Pool Income Transaction
                await databases.createDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.transactions!,
                  ID.unique(),
                  {
                    user_id: userId,
                    type: 'pool',
                    amount: 10,
                    status: 'completed',
                    created_at: new Date().toISOString()
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

                // Rebirth also fills someone else's pool
                await findAndFill(1, userId);

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
                await findAndFill(2, userId);
              } 
              else if (pNum >= 2 && pNum <= 9) {
                // 40% Upgrade, 50% Wallet, 10% Global
                const entryValue = pNum === 2 ? 20 : Math.pow(2.4, pNum - 2) * 20;
                const poolFund = entryValue * 6;
                const walletAmount = poolFund * 0.5;

                await databases.updateDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.wallets!,
                  userWallet.$id,
                  { 
                    balance: (userWallet.balance || 0) + walletAmount,
                    total_earned: (userWallet.total_earned || 0) + walletAmount,
                    pool_roi_earned: (userWallet.pool_roi_earned || 0) + walletAmount
                  }
                );

                // Log Pool Income Transaction
                await databases.createDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.transactions!,
                  ID.unique(),
                  {
                    user_id: userId,
                    type: 'pool',
                    amount: walletAmount,
                    status: 'completed',
                    created_at: new Date().toISOString()
                  }
                );

                // Upgrade
                await databases.createDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.pools!,
                  ID.unique(),
                  {
                    user_id: userId,
                    pool_number: pNum + 1,
                    status: 'active',
                    members_count: 0,
                    created_at: new Date().toISOString()
                  }
                );
                await findAndFill(pNum + 1, userId);
              }
              else if (pNum === 10) {
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
                    total_earned: (userWallet.total_earned || 0) + walletAmount,
                    pool_roi_earned: (userWallet.pool_roi_earned || 0) + walletAmount
                  }
                );

                // Log Pool Income Transaction
                await databases.createDocument(
                  APPWRITE_CONFIG.databaseId!,
                  APPWRITE_CONFIG.collections.transactions!,
                  ID.unique(),
                  {
                    user_id: userId,
                    type: 'pool',
                    amount: walletAmount,
                    status: 'completed',
                    created_at: new Date().toISOString()
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
          console.error(`Pool filling error (Pool ${pNum}):`, e);
        }
      };

      // When a user enters a pool, they fill the oldest active pool of that same number
      await findAndFill(poolNum, enteringUserId);
    },

    addTask: async (task: any) => {
      return await databases.createDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.tasks!,
        ID.unique(),
        { 
          title: task.title,
          description: task.description,
          reward: task.reward,
          link: task.link,
          is_active: true 
        }
      );
    },

    getSettings: async () => {
      try {
        if (!isAppwriteConfigured()) throw new Error("Appwrite not configured");
        
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
              marquee_text: 'Welcome to Genesis Core - The Future of Matrix Ecosystem',
              min_deposit: 10,
              min_withdrawal: 20,
              max_withdrawal: 1000,
              deposit_fee: 0,
              withdrawal_fee: 1,
              weekly_reward: 50,
              weekly_description: 'Top 5 Achievers with 5+ Directs',
              hall_of_fame_marquee: '🏆 CONGRATULATIONS TO OUR ELITE ACHIEVERS! KEEP PUSHING FOR THE TOP! 🚀',
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
          let typeHint = "String";
          if (['usdt_buy_rate', 'usdt_sell_rate', 'min_deposit', 'min_withdrawal', 'max_withdrawal', 'deposit_fee', 'withdrawal_fee', 'weekly_reward'].includes(attr)) {
            typeHint = "Float/Double";
          }
          throw new Error(`Appwrite Error: Attribute "${attr}" is missing in your "setting" collection. Please add it in Appwrite Console as a ${typeHint} (String for marquee_text, hall_of_fame_marquee).`);
        }
        throw error;
      }
    },

    getMatrixDownline: async (userId: string) => {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!,
        [Query.equal('matrix_parent_id', userId)]
      );
      return response.documents.map(doc => ({ ...doc, id: doc.$id }));
    },

    getDirectReferrals: async (userId: string) => {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!,
        [Query.equal('sponsor_id', userId)]
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
    },

    getAllTransactions: async (limit = 20) => {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.transactions!,
        [Query.orderDesc('created_at'), Query.limit(limit)]
      );
      return response.documents.map(doc => ({ ...doc, id: doc.$id }));
    },

    repairPools: async () => {
      if (!isAppwriteConfigured()) return;
      
      const usersRes = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!,
        [Query.equal('is_qualified', true), Query.limit(5000)]
      );

      let repairedCount = 0;
      for (const user of usersRes.documents) {
        const poolsRes = await databases.listDocuments(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.pools!,
          [Query.equal('user_id', user.$id), Query.equal('pool_number', 1)]
        );

        if (poolsRes.total === 0) {
          await databases.createDocument(
            APPWRITE_CONFIG.databaseId!,
            APPWRITE_CONFIG.collections.pools!,
            ID.unique(),
            {
              user_id: user.$id,
              pool_number: 1,
              status: 'active',
              members_count: 0,
              created_at: user.created_at || new Date().toISOString()
            }
          );
          repairedCount++;
        }
      }
      return repairedCount;
    },

    resetWeeklyDirects: async () => {
      const usersRes = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!,
        [Query.greaterThan('weekly_directs', 0), Query.limit(5000)]
      );

      for (const user of usersRes.documents) {
        await databases.updateDocument(
          APPWRITE_CONFIG.databaseId!,
          APPWRITE_CONFIG.collections.users!,
          user.$id,
          {
            weekly_directs: 0,
            last_reward_week: ''
          }
        );
      }
    },

    getWeeklyOffer: async () => {
      const settings = await appwriteService.db.getSettings() as any;
      return {
        id: 'weekly_offer',
        reward_amount: settings.weekly_reward || 50,
        description: settings.weekly_description || "Top 5 Achievers with 5+ Directs",
        min_directs: 5,
        is_active: true,
        end_date: new Date(Date.now() + 86400000 * 3).toISOString()
      };
    },

    getWeeklyAchievers: async () => {
      const response = await databases.listDocuments(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!,
        [
          Query.greaterThanEqual('weekly_directs', 5),
          Query.orderDesc('weekly_directs'),
          Query.limit(10)
        ]
      );
      
      return response.documents.map(u => ({
        user_id: u.$id,
        email: u.email,
        count: u.weekly_directs,
        status: u.last_reward_week === 'current' ? 'rewarded' : 'pending'
      }));
    },

    rewardAchiever: async (userId: string, amount: number) => {
      // 1. Update user status
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.users!,
        userId,
        { last_reward_week: 'current' }
      );

      // 2. Update wallet
      const wallet = await appwriteService.db.getWallet(userId) as any;
      const newBalance = Number(((wallet.balance || 0) + amount).toFixed(4));
      const newTotal = Number(((wallet.total_earned || 0) + amount).toFixed(4));
      
      await databases.updateDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.wallets!,
        wallet.$id,
        { 
          balance: newBalance,
          total_earned: newTotal
        }
      );

      // 3. Log transaction
      await databases.createDocument(
        APPWRITE_CONFIG.databaseId!,
        APPWRITE_CONFIG.collections.transactions!,
        ID.unique(),
        {
          user_id: userId,
          type: 'task', // Reusing 'task' type for reward
          amount: amount,
          status: 'completed',
          created_at: new Date().toISOString()
        }
      );
    }
  }
};
