#!/bin/bash

set -e

cd "$(dirname "$0")"/..

yarn build-web-view

source web/.env

npx cap sync ios

# `cap sync` does not leave `packageClassList` in ios/App/App/capacitor.config.json, without which
# the native bridge registers no plugins at all and every Capacitor call fails at runtime with
# "<X> plugin is not implemented on ios". See the script header.
node scripts/ios_plugin_classlist.mjs

# Icons and splash screens, regenerated from assets/icon.png — the generated PNGs are gitignored
# (see the *.png rule in the root .gitignore), so this has to run on every build, CI included.
npx capacitor-assets generate --ios

# `pod install` runs as part of `cap sync` when CocoaPods is present (macOS only). On Linux
# everything above still works — it is only the Xcode archive that needs a Mac.
# Then: npx cap open ios, or let .github/workflows/cd-ios.yml build and upload to TestFlight.
