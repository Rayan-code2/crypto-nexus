import { Client, Account, Databases, ID, Query } from 'appwrite';

const client = new Client();

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (projectId) {
  console.log("Appwrite Initializing with Project ID:", projectId);
  client
    .setEndpoint(endpoint)
    .setProject(projectId);
} else {
  console.warn("Appwrite Project ID is missing! App will run in Mock Mode.");
}

export const account = new Account(client);
export const databases = new Databases(client);

export const APPWRITE_CONFIG = {
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
  collections: {
    users: import.meta.env.VITE_APPWRITE_USERS_COLLECTION_ID,
    wallets: import.meta.env.VITE_APPWRITE_WALLETS_COLLECTION_ID,
    tasks: import.meta.env.VITE_APPWRITE_TASKS_COLLECTION_ID,
    exchanger: import.meta.env.VITE_APPWRITE_EXCHANGER_COLLECTION_ID,
    submissions: import.meta.env.VITE_APPWRITE_SUBMISSIONS_COLLECTION_ID,
  }
};

export const isAppwriteConfigured = () => !!projectId && !!APPWRITE_CONFIG.databaseId;
