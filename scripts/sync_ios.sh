#!/bin/bash

set -e

cd "$(dirname "$0")"/..

# Dev mode: point the app at the local Next.js dev server instead of the bundled export.
# NEXT_PUBLIC_LOCAL_IOS=1     → iOS Simulator, which reaches the host on plain localhost
# NEXT_PUBLIC_WEBVIEW_DEV_PHONE=1 → a real iPhone over the LAN (see NEXT_PUBLIC_DEV_LAN_IP)
# Set only the iOS one — capacitor.config.ts has a single server.url shared by both platforms.
export $(grep -E '^(NEXT_PUBLIC_(LOCAL_IOS|WEBVIEW_DEV_PHONE|DEV_LAN_IP)|IOS_WEB_DEBUG)=' .env || true)

# `npx cap` resolves to an old nested CLI — see scripts/cap.sh.
./scripts/cap.sh sync ios

# `cap sync` does not leave `packageClassList` in ios/App/App/capacitor.config.json, without which
# the native bridge registers no plugins at all and every Capacitor call fails at runtime with
# "<X> plugin is not implemented on ios". See the script header.
node scripts/ios_plugin_classlist.mjs
