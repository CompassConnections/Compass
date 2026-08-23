#!/bin/bash

set -e

cd "$(dirname "$0")"/..

# Dev mode: point the app at the local Next.js dev server instead of the bundled export.
# NEXT_PUBLIC_LOCAL_IOS=1     → iOS Simulator, which reaches the host on plain localhost
# NEXT_PUBLIC_WEBVIEW_DEV_PHONE=1 → a real iPhone over the LAN (see NEXT_PUBLIC_DEV_LAN_IP)
# Set only the iOS one — capacitor.config.ts has a single server.url shared by both platforms.
export $(grep -E '^NEXT_PUBLIC_(LOCAL_IOS|WEBVIEW_DEV_PHONE|DEV_LAN_IP)=' .env || true)

npx cap sync ios
