import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jwordenai.app',
  appName: 'JWordenAI',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0a0a0a',
    },
  },
};

export default config;
