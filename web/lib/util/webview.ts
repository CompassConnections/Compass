import {Capacitor} from "@capacitor/core";
import {IS_WEBVIEW} from "common/hosting/constants";

export function isAndroidApp() {
  try {
    // Detect if Android bridge exists
    return Capacitor.isNativePlatform() || IS_WEBVIEW
  } catch {
    return false;
  }
}

export function isNativeMobile() { return isAndroidApp() }