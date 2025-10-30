export function isAndroidWebView() {
  try {
    // Detect if Android bridge exists
    return typeof (window as any).AndroidBridge?.isNativeApp === 'function';
  } catch {
    return false;
  }
}