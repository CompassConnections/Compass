import type { CapacitorConfig } from '@capacitor/cli';

const LOCAL_ANDROID = process.env.NEXT_PUBLIC_LOCAL_ANDROID !== undefined
console.log("LOCAL_ANDROID in CapacitorConfig", LOCAL_ANDROID)

const config: CapacitorConfig = {
  appId: 'com.compass.app',
  appName: 'Compass',
  webDir: 'web/.next',
  server: {
    url: LOCAL_ANDROID ? "http://10.0.2.2:3000" : 'https://compassmeet.com',
    cleartext: true
  },
};

export default config;
