import { Client, Account, Databases, ID, Query } from 'appwrite';

const client = new Client();

<<<<<<< HEAD
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || ''; // Removed hardcoded default to allow mock mode fallback
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';

export const APPWRITE_CONFIG = {
  endpoint,
  projectId,
  databaseId,
=======
const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID || '69a1cca60008ce17440e';

export const APPWRITE_CONFIG = {
  endpoint,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID || '69a1ceab001b0ac5f2d0',
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
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

<<<<<<< HEAD
if (projectId && databaseId) {
  console.log("🚀 Appwrite Initializing with Project ID:", projectId);
  console.log("🌐 Endpoint:", endpoint);
=======
if (projectId) {
  console.log("🚀 Appwrite Initializing with Project ID:", projectId);
  console.log("🌐 Endpoint:", endpoint);
  console.log("📂 Database ID:", APPWRITE_CONFIG.databaseId);
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
} else {
<<<<<<< HEAD
  console.warn("⚠️ Appwrite Configuration is incomplete! App will run in Mock/Demo Mode.");
  console.info("💡 To use real Appwrite, set VITE_APPWRITE_PROJECT_ID and VITE_APPWRITE_DATABASE_ID in your environment variables.");
=======
  console.warn("⚠️ Appwrite Project ID is missing! App will run in Mock/Demo Mode.");
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
}

export const account = new Account(client);
export const databases = new Databases(client);

<<<<<<< HEAD
export const isAppwriteConfigured = () => {
  // Only consider it configured if BOTH Project ID and Database ID are present and NOT placeholders
  const isConfigured = !!projectId && 
         !!databaseId && 
         projectId !== 'YOUR_PROJECT_ID' && 
         databaseId !== 'YOUR_DATABASE_ID' &&
         projectId.length > 5; // Basic length check
         
  return isConfigured;
};
=======
export const isAppwriteConfigured = () => !!projectId && !!APPWRITE_CONFIG.databaseId;
>>>>>>> 8beb4707fdef8229e57f4f93ef58ee40002f92a2
