#!/bin/bash

set -e

cd "$(dirname "$0")"/..

# keytool -genkeypair -v -keystore my-release-key.keystore -alias compass -keyalg RSA -keysize 2048 -validity 10000

# npx cap sync android
# npx cap run android
# npx cap open android

cd android

./gradlew --stop
./gradlew clean
./gradlew assembleRelease
./gradlew bundleRelease  

adb install -r app-release.apk

adb logcat | grep FirebaseMessaging

