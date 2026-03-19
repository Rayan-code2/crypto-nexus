import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.VITE_APPWRITE_ENDPOINT': JSON.stringify(env.VITE_APPWRITE_ENDPOINT),
        'process.env.VITE_APPWRITE_PROJECT_ID': JSON.stringify(env.VITE_APPWRITE_PROJECT_ID),
        'process.env.VITE_APPWRITE_DATABASE_ID': JSON.stringify(env.VITE_APPWRITE_DATABASE_ID),
        'process.env.VITE_APPWRITE_USERS_COLLECTION_ID': JSON.stringify(env.VITE_APPWRITE_USERS_COLLECTION_ID),
        'process.env.VITE_APPWRITE_WALLETS_COLLECTION_ID': JSON.stringify(env.VITE_APPWRITE_WALLETS_COLLECTION_ID),
        'process.env.VITE_APPWRITE_TASKS_COLLECTION_ID': JSON.stringify(env.VITE_APPWRITE_TASKS_COLLECTION_ID),
        'process.env.VITE_APPWRITE_EXCHANGER_COLLECTION_ID': JSON.stringify(env.VITE_APPWRITE_EXCHANGER_COLLECTION_ID),
        'process.env.VITE_APPWRITE_SUBMISSIONS_COLLECTION_ID': JSON.stringify(env.VITE_APPWRITE_SUBMISSIONS_COLLECTION_ID),
        'process.env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID': JSON.stringify(env.VITE_APPWRITE_TRANSACTIONS_COLLECTION_ID),
        'process.env.VITE_APPWRITE_POOLS_COLLECTION_ID': JSON.stringify(env.VITE_APPWRITE_POOLS_COLLECTION_ID),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
