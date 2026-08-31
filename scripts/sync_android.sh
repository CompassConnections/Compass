#!/bin/bash

set -e

cd "$(dirname "$0")"/..

export $(grep -E '^NEXT_PUBLIC_LOCAL_ANDROID=' .env)

# `npx cap` resolves to an old nested CLI — see scripts/cap.sh.
./scripts/cap.sh sync android

# Then go to android studio, build, generate signed APK in android/app/release, adb install -r app-release.apk
