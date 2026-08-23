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
// Makes the WKWebView inspectable from Safari / ios-webkit-debug-proxy in a *Release* build, which is
// what TestFlight ships. Capacitor only enables this under `#if DEBUG` otherwise, so a TestFlight
// build exposes no inspectable page at all and the proxy's device listing comes back empty — which
// looks like a broken proxy rather than a deliberately locked-down WebView. Off by default: leaving
// it on in a store build would let anyone with the device open a console on the app.
const IOS_WEB_DEBUG = process.env.IOS_WEB_DEBUG === '1'
const LAN_IP = process.env.NEXT_PUBLIC_DEV_LAN_IP || '192.168.1.3'
const LOCAL_URL = WEBVIEW_DEV_PHONE ? LAN_IP : LOCAL_IOS ? 'localhost' : '10.0.2.2'
console.log('CapacitorConfig', {LOCAL_ANDROID, LOCAL_IOS, WEBVIEW_DEV_PHONE})

const config: CapacitorConfig = {
  appId: 'com.compassconnections.app',
  appName: 'Compass',
  webDir: 'web/out',
  server: LOCAL_ANDROID || LOCAL_IOS ? {url: `http://${LOCAL_URL}:3000`, cleartext: true} : {},
  ios: {
    // `never`, so `env(safe-area-inset-*)` in web/styles/globals.css is the *single* source of truth
    // for safe areas — the same model Android and the web already use.
    //
    // With `always`, WKWebView shrinks the viewport by the bottom inset as the scroll reaches the end
    // (measured on an iPhone: `innerHeight` 848 at the top, 814 at the bottom) while the CSS keeps
    // adding its own 34px. The bottom nav then sat 68px above the screen edge with only 34px of
    // filler behind it, leaving an uncovered strip over the home indicator — but *only* once you
    // scrolled to the bottom, which is what made it look intermittent.
    contentInset: 'never',
    ...(IOS_WEB_DEBUG ? {webContentsDebuggingEnabled: true} : {}),
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
