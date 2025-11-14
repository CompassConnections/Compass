import type { CapacitorConfig } from '@capacitor/cli';

const WEBVIEW_DEV_PHONE = process.env.NEXT_PUBLIC_WEBVIEW_DEV_PHONE === '1'
const LOCAL_ANDROID = WEBVIEW_DEV_PHONE || process.env.NEXT_PUBLIC_LOCAL_ANDROID === '1'
const LOCAL_URL = WEBVIEW_DEV_PHONE ? '192.168.1.3' : '10.0.2.2'
console.log("CapacitorConfig", {LOCAL_ANDROID, WEBVIEW_DEV_PHONE})

const config: CapacitorConfig = {
  appId: 'com.compassconnections.app',
  appName: 'Compass',
  webDir: 'web/out',
  server: LOCAL_ANDROID ? { url: `http://${LOCAL_URL}:3000`, cleartext: true } : {},
  plugins: {
    LiveUpdate: {
      appId: "969bc540-8077-492f-8403-b554bee5de50"
    }
  }
};

export default config;
