import { Client, Account, Databases, ID, Query } from 'appwrite';

const client = new Client();

const endpoint = process.env.VITE_APPWRITE_ENDPOINT || import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = process.env.VITE_APPWRITE_PROJECT_ID || import.meta.env.VITE_APPWRITE_PROJECT_ID || '';
const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || import.meta.env.VITE_APPWRITE_DATABASE_ID || '';

export const APPWRITE_CONFIG = {
  endpoint,
  projectId,
  databaseId,
  collections: {
    users: process.env.VITE_APPWRITE_USERS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID || 'users',
    wallets: process.env.VITE_APPWRITE_WALLETS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_WALLETS_COLLECTION_ID || 'wallets',
    tasks: process.env.VITE_APPWRITE_TASKS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID || 'tasks',
    exchanger: process.env.VITE_APPWRITE_EXCHANGER_COLLECTION_ID || import.meta.env.VITE_APPWRITE_EXCHANGER_COLLECTION_ID || 'exchanger',
    submissions: process.env.VITE_APPWRITE_SUBMISSIONS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_SUBMISSIONS_COLLECTION_ID || 'submissions',
    transactions: process.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID || 'transactions',
    pools: process.env.VITE_APPWRITE_POOLS_COLLECTION_ID || import.meta.env.VITE_APPWRITE_POOLS_COLLECTION_ID || 'pools',
  }
};

if (projectId && databaseId) {
  console.log("🚀 Appwrite Initializing with Project ID:", projectId);
  console.log("🌐 Endpoint:", endpoint);
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
} else {
  console.warn("⚠️ Appwrite Configuration is incomplete! App will run in Mock/Demo Mode.");
  console.info("💡 To use real Appwrite, set VITE_APPWRITE_PROJECT_ID and VITE_APPWRITE_DATABASE_ID in your environment variables.");
}

export const account = new Account(client);
export const databases = new Databases(client);

export const isAppwriteConfigured = () => {
  // Only consider it configured if BOTH Project ID and Database ID are present and NOT placeholders
  const isConfigured = !!projectId && 
         !!databaseId && 
         projectId !== 'YOUR_PROJECT_ID' && 
         databaseId !== 'YOUR_DATABASE_ID' &&
         projectId.length > 5; // Basic length check
         
  return isConfigured;
};
