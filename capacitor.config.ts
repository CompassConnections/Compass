import type { CapacitorConfig } from '@capacitor/cli';

const LOCAL_ANDROID = process.env.NEXT_PUBLIC_LOCAL_ANDROID === '1'
console.log("LOCAL_ANDROID in CapacitorConfig", LOCAL_ANDROID)

const config: CapacitorConfig = {
  appId: 'com.compassconnections.app',
  appName: 'Compass',
  webDir: 'web/out',
  server: LOCAL_ANDROID ? { url: 'http://10.0.2.2:3000', cleartext: true } : {}
};

export default config;
