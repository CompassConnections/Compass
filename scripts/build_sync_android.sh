#!/bin/bash

set -e

cd "$(dirname "$0")"/..

export NEXT_PUBLIC_WEBVIEW=1

yarn build-web

source web/.env

npx cap sync android

# To generate icons
# npx capacitor-assets generate --android

# Then go to android studio, build, generate signed APK in android/app/release, adb install -r app-release.apk
