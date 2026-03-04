
import { User, Wallet, ExchangerRequest, Task, Transaction, TaskSubmission } from '../types';
import { appwriteService } from './appwriteService';
import { isAppwriteConfigured } from './appwrite';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const getStorage = (key: string) => JSON.parse(localStorage.getItem(`nexus_mock_${key}`) || '[]');
const setStorage = (key: string, data: any) => localStorage.setItem(`nexus_mock_${key}`, JSON.stringify(data));

export const mockApi = {
  auth: {
    signUp: async (email: string, pass: string, sponsorId?: string) => {
      if (isAppwriteConfigured()) return await appwriteService.auth.signUp(email, pass, sponsorId);
      
      await delay(800);
      const users = getStorage('users');
      if (users.find((u: any) => u.email === email)) throw new Error("Agent already registered");
      
      const newUser = {
        id: 'node_' + Math.random().toString(36).slice(2, 9),
        email,
        role: email.includes('admin') ? 'admin' : 'user',
        level: 1,
        sponsor_id: sponsorId || null,
        matrix_parent_id: sponsorId || null, // Simplified for testing
        matrix_position: 'left',
        is_blocked: false,
        is_active: false,
        created_at: new Date().toISOString()
      };
      
      setStorage('users', [...users, newUser]);
      return { user: newUser };
    },
    signIn: async (email: string, pass: string) => {
      if (isAppwriteConfigured()) return await appwriteService.auth.signIn(email, pass);

      await delay(800);
      const users = getStorage('users');
      const user = users.find((u: any) => u.email === email);
      if (!user) throw new Error("Node not found. Please register.");
      return { user };
    },
    getCurrentUser: async () => {
      if (isAppwriteConfigured()) return await appwriteService.auth.getCurrentUser();
      const saved = localStorage.getItem('nexus_user');
      return saved ? JSON.parse(saved) : null;
    },
    signOut: async () => {
      if (isAppwriteConfigured()) await appwriteService.auth.signOut();
      localStorage.removeItem('nexus_user');
    }
  },
  
  db: {
    getWallet: async (userId: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.getWallet(userId);

      const wallets = getStorage('wallets');
      let wallet = wallets.find((w: any) => w.user_id === userId);
      if (!wallet) {
        wallet = { id: 'w_' + userId, user_id: userId, balance: 0, total_earned: 0, total_withdrawn: 0 };
        setStorage('wallets', [...wallets, wallet]);
      }
      return wallet;
    },
    
    getMatrixDownline: async (userId: string) => {
      if (isAppwriteConfigured()) return await appwriteService.db.getMatrixDownline(userId);

      const users = getStorage('users');
      // Find users where this user is the sponsor or matrix parent
      return users.filter((u: any) => u.matrix_parent_id === userId || u.sponsor_id === userId);
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
      return userId ? reqs.filter((r: any) => r.user_id === userId) : reqs;
    },

    createExchangeRequest: async (data: any) => {
      if (isAppwriteConfigured()) return await appwriteService.db.createExchangeRequest(data);

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
    getAllUsers: async () => {
      if (isAppwriteConfigured()) return await appwriteService.db.getAllUsers();

      const users = getStorage('users');
      const wallets = getStorage('wallets');
      return users.map((u: any) => ({ ...u, wallets: [wallets.find((w: any) => w.user_id === u.id)] }));
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

    addTask: async (task: any) => {
      if (isAppwriteConfigured()) return await appwriteService.db.addTask(task);

      const tasks = getStorage('tasks');
      setStorage('tasks', [...tasks, { ...task, id: 't_' + Date.now(), is_active: true }]);
    },

    getSettings: async () => {
      if (isAppwriteConfigured()) return await appwriteService.db.getSettings();
      
      const settings = localStorage.getItem('nexus_mock_settings');
      if (!settings) {
        const defaultSettings = { 
          usdt_buy_rate: 92, 
          usdt_sell_rate: 88,
          admin_upi: 'nexus@upi',
          admin_qr: ''
        };
        localStorage.setItem('nexus_mock_settings', JSON.stringify(defaultSettings));
        return defaultSettings;
      }
      return JSON.parse(settings);
    },

    updateSettings: async (data: any) => {
      if (isAppwriteConfigured()) return await appwriteService.db.updateSettings(data);
      
      const current = JSON.parse(localStorage.getItem('nexus_mock_settings') || '{}');
      localStorage.setItem('nexus_mock_settings', JSON.stringify({ ...current, ...data }));
    }
  }
};
