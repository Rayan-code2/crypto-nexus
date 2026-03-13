import { Client, Account, Databases, ID, Query } from 'appwrite';

const client = new Client();

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '69a1cca60008ce17440e';

export const APPWRITE_CONFIG = {
  endpoint,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '69a1ceab001b0ac5f2d0',
  collections: {
    users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users',
    wallets: import.meta.env.VITE_APPWRITE_WALLETS_COLLECTION_ID || 'wallets',
    tasks: import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID || 'tasks',
    exchanger: import.meta.env.VITE_APPWRITE_EXCHANGER_COLLECTION_ID || 'exchanger',
    submissions: import.meta.env.VITE_APPWRITE_SUBMISSIONS_COLLECTION_ID || 'submissions',
    transactions: import.meta.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID || 'transactions',
    pools: import.meta.env.VITE_APPWRITE_POOLS_COLLECTION_ID || 'pools',
  }
};

if (projectId) {
  console.log("🚀 Appwrite Initializing with Project ID:", projectId);
  console.log("🌐 Endpoint:", endpoint);
  console.log("📂 Database ID:", APPWRITE_CONFIG.databaseId);
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
} else {
  console.warn("⚠️ Appwrite Project ID is missing! App will run in Mock/Demo Mode.");
}

export const account = new Account(client);
export const databases = new Databases(client);

export const isAppwriteConfigured = () => !!projectId && !!APPWRITE_CONFIG.databaseId;
