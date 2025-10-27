import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.compass.app',
  appName: 'Compass',
  webDir: 'web/.next',
  server: {
    url: 'https://compassmeet.com',
    cleartext: true
  },
};

export default config;
