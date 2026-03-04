import { account, databases, APPWRITE_CONFIG, isAppwriteConfigured } from './appwrite';
import { ID, Query } from 'appwrite';

export const appwriteService = {
  auth: {
    signUp: async (email: string, pass: string, sponsorId?: string) => {
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
          matrix_parent_id: sponsorId || null,
          matrix_position: 'left',
          is_blocked: false,
          is_active: false,
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
          total_withdrawn: 0
        }
      );

      return { user: { id: userId, email } };
    },

    signIn: async (email: string, pass: string) => {
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
            total_withdrawn: 0
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
      return await databases.updateDocument(
        APPWRITE_CONFIG.databaseId!,
        'setting',
        'global_config',
        {
          ...data,
          updated_at: new Date().toISOString()
        }
      );
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
    }
  }
};
