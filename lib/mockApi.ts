import { appwriteService } from './appwriteService';
import { isAppwriteConfigured } from './appwrite';

/**
 * Mock API Proxy
 * This file now acts as a direct proxy to Appwrite Service.
 * Mock logic has been removed to ensure production readiness.
 */

const ensureAppwrite = () => {
  if (!isAppwriteConfigured()) {
    throw new Error("Appwrite is not configured. Please set VITE_APPWRITE_PROJECT_ID and VITE_APPWRITE_DATABASE_ID.");
  }
};

export const mockApi = {
  auth: {
    signUp: async (email: string, pass: string, sponsorId?: string) => {
      ensureAppwrite();
      return await appwriteService.auth.signUp(email, pass, sponsorId);
    },
    signIn: async (email: string, pass: string) => {
      ensureAppwrite();
      return await appwriteService.auth.signIn(email, pass);
    },
    signOut: async () => {
      ensureAppwrite();
      return await appwriteService.auth.signOut();
    },
    getCurrentUser: async () => {
      ensureAppwrite();
      return await appwriteService.auth.getCurrentUser();
    }
  },

  db: {
    getWallet: async (userId: string) => {
      ensureAppwrite();
      return await appwriteService.db.getWallet(userId);
    },
    updateWallet: async (userId: string, amount: number) => {
      ensureAppwrite();
      return await appwriteService.db.updateWallet(userId, amount);
    },
    getTransactions: async (userId: string) => {
      ensureAppwrite();
      return await appwriteService.db.getTransactions(userId);
    },
    getAllTransactions: async (limit?: number) => {
      ensureAppwrite();
      return await appwriteService.db.getAllTransactions(limit);
    },
    getPools: async (userId: string) => {
      ensureAppwrite();
      return await appwriteService.db.getPools(userId);
    },
    getMatrixDownline: async (userId: string) => {
      ensureAppwrite();
      return await appwriteService.db.getMatrixDownline(userId);
    },
    getDirectReferrals: async (userId: string) => {
      ensureAppwrite();
      return await appwriteService.db.getDirectReferrals(userId);
    },
    getAllUsers: async (limit?: number, offset?: number) => {
      ensureAppwrite();
      return await appwriteService.db.getAllUsers(limit, offset);
    },
    updateUser: async (id: string, data: any) => {
      ensureAppwrite();
      return await appwriteService.db.updateUser(id, data);
    },
    deleteUser: async (userId: string) => {
      ensureAppwrite();
      return await appwriteService.db.deleteUser(userId);
    },
    activateUser: async (userId: string, amount: number) => {
      ensureAppwrite();
      return await appwriteService.db.activateUser(userId, amount);
    },
    distributeROI: async (userId: string) => {
      ensureAppwrite();
      return await appwriteService.db.distributeROI(userId);
    },
    getExchangeRequests: async (userId?: string) => {
      ensureAppwrite();
      return await appwriteService.db.getExchangeRequests(userId);
    },
    getExchangeRequest: async (requestId: string) => {
      ensureAppwrite();
      return await appwriteService.db.getExchangeRequest(requestId);
    },
    createExchangeRequest: async (data: any) => {
      ensureAppwrite();
      return await appwriteService.db.createExchangeRequest(data);
    },
    updateExchangeRequest: async (id: string, data: any) => {
      ensureAppwrite();
      return await appwriteService.db.updateExchangeRequest(id, data);
    },
    getTasks: async () => {
      ensureAppwrite();
      return await appwriteService.db.getTasks();
    },
    addTask: async (task: any) => {
      ensureAppwrite();
      return await appwriteService.db.addTask(task);
    },
    submitTask: async (userId: string, taskId: string, proof: string) => {
      ensureAppwrite();
      return await appwriteService.db.submitTask(userId, taskId, proof);
    },
    getTaskSubmissions: async (userId?: string) => {
      ensureAppwrite();
      return await appwriteService.db.getTaskSubmissions(userId);
    },
    approveTaskSubmission: async (submissionId: string, status: 'approved' | 'rejected') => {
      ensureAppwrite();
      return await appwriteService.db.approveTaskSubmission(submissionId, status);
    },
    getSettings: async () => {
      ensureAppwrite();
      return await appwriteService.db.getSettings();
    },
    updateSettings: async (data: any) => {
      ensureAppwrite();
      return await appwriteService.db.updateSettings(data);
    },
    repairPools: async () => {
      ensureAppwrite();
      return await appwriteService.db.repairPools();
    },
    getWeeklyOffer: async () => {
      ensureAppwrite();
      return await appwriteService.db.getWeeklyOffer();
    },
    getWeeklyAchievers: async () => {
      ensureAppwrite();
      return await appwriteService.db.getWeeklyAchievers();
    },
    rewardAchiever: async (userId: string, amount: number) => {
      ensureAppwrite();
      return await appwriteService.db.rewardAchiever(userId, amount);
    },
    resetWeeklyDirects: async () => {
      ensureAppwrite();
      return await appwriteService.db.resetWeeklyDirects();
    },
    purgeAllData: async () => {
      ensureAppwrite();
      return await appwriteService.db.purgeAllData();
    },
    updateUserPassword: async (userId: string, newPassword: string) => {
      ensureAppwrite();
      return await appwriteService.db.updateUserPassword(userId, newPassword);
    }
  }
};
