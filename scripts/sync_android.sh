#!/bin/bash

set -e

cd "$(dirname "$0")"/..

export $(grep -E '^NEXT_PUBLIC_LOCAL_ANDROID=' .env)

npx cap sync android

# Then go to android studio, build, generate signed APK in android/app/release, adb install -r app-release.apk
