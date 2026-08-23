import type {CapacitorConfig} from '@capacitor/cli'

// Point the app at a dev server instead of the bundled static export. `NEXT_PUBLIC_WEBVIEW_DEV_PHONE`
// means "a real handset over the LAN" for either platform; without it each platform has its own alias
// for the host machine — `10.0.2.2` on the Android emulator, plain `localhost` on the iOS Simulator,
// which shares the host's network stack.
//
// There is only one `server.url` in this file and it is shared by both platforms, so which of the two
// applies is decided by which env var is set at sync time — `scripts/sync_android.sh` sets the Android
// one, `scripts/sync_ios.sh` the iOS one. Never set both.
const WEBVIEW_DEV_PHONE = process.env.NEXT_PUBLIC_WEBVIEW_DEV_PHONE === '1'
const LOCAL_ANDROID = WEBVIEW_DEV_PHONE || process.env.NEXT_PUBLIC_LOCAL_ANDROID === '1'
const LOCAL_IOS = process.env.NEXT_PUBLIC_LOCAL_IOS === '1'
const LAN_IP = process.env.NEXT_PUBLIC_DEV_LAN_IP || '192.168.1.3'
const LOCAL_URL = WEBVIEW_DEV_PHONE ? LAN_IP : LOCAL_IOS ? 'localhost' : '10.0.2.2'
console.log('CapacitorConfig', {LOCAL_ANDROID, LOCAL_IOS, WEBVIEW_DEV_PHONE})

const config: CapacitorConfig = {
  appId: 'com.compassconnections.app',
  appName: 'Compass',
  webDir: 'web/out',
  server: LOCAL_ANDROID || LOCAL_IOS ? {url: `http://${LOCAL_URL}:3000`, cleartext: true} : {},
  ios: {
    // WKWebView otherwise applies its own safe-area inset on top of the `env(safe-area-inset-*)`
    // padding in web/styles/globals.css, and everything under the notch ends up doubly indented.
    contentInset: 'always',
    // Deliberately NOT overriding `scheme`. The app is served from the default `capacitor://localhost`,
    // which WebKit treats as a secure origin — that is what `getUserMedia` (voice auto-fill) and
    // `crypto.subtle` (the Sign-in-with-Apple nonce) need. Renaming the scheme buys nothing and risks
    // that, so it stays at the default.
  },
  includePlugins: [
    '@capacitor/app',
    '@capacitor/core',
    '@capacitor/filesystem',
    '@capacitor/keyboard',
    '@capacitor/push-notifications',
    '@capacitor/share',
    '@capacitor/status-bar',
    '@capgo/capacitor-social-login',
  ],
}

export default config
