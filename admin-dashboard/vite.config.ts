import path from 'node:path';

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const appEnvDir = path.resolve(__dirname, '../mobiflow-app');
  const env = loadEnv(mode, appEnvDir, '');

  return {
    plugins: [react()],
    define: {
      __ADMIN_FIREBASE_CONFIG__: JSON.stringify({
        apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
        authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
        projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
        storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
        messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
        appId: env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
        functionsRegion: env.EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION || 'us-central1',
      }),
    },
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/test/**/*.{test,spec}.{ts,tsx}'],
      globals: true,
    },
  };
});
