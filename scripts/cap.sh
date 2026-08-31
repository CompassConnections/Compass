#!/bin/bash
#
# Runs the project's *own* Capacitor CLI.
#
# `npx cap` does not. `node_modules/.bin/cap` is a yarn hoisting artifact pointing at the copy nested
# under `@capacitor/assets`, which pins an old CLI of its own:
#
#   node_modules/.bin/cap -> @capacitor/assets/node_modules/@capacitor/cli@5.7.8/bin/capacitor
#
# while the project runs @capacitor/cli 7.x. Everything looks fine, because a v5 CLI still syncs a v7
# project — it just quietly does less. Two things it does not do:
#
#  - **Plugin lifecycle hooks.** v5 has no `runHooks` at all; it never walks the installed plugins
#    looking for a `capacitor:sync:before` script. That is how `@capgo/capacitor-social-login`'s
#    provider config is applied, so `plugins.SocialLogin.providers.facebook: false` in
#    capacitor.config.ts silently did nothing and FBSDK — a tracking SDK — stayed linked into the
#    binary. See scripts/verify_ios_privacy.sh.
#  - **`packageClassList`** in the generated capacitor.config.json, which v6 introduced and the
#    native bridge needs to register plugins. scripts/ios_plugin_classlist.mjs exists to patch that
#    back in; it is a workaround for this, not for a Capacitor bug.
#
# Resolving the binary through the package rather than through `.bin` is what makes it deterministic.

set -euo pipefail
cd "$(dirname "$0")/.."

CLI=node_modules/@capacitor/cli/bin/capacitor
if [ ! -f "$CLI" ]; then
  echo "error: $CLI not found — run yarn install" >&2
  exit 1
fi

# Guard the thing this script exists to prevent. A major-version drift here is silent everywhere
# else, so it is worth one line of arithmetic.
VERSION=$(node -p "require('./node_modules/@capacitor/cli/package.json').version")
CORE=$(node -p "require('./node_modules/@capacitor/core/package.json').version")
if [ "${VERSION%%.*}" != "${CORE%%.*}" ]; then
  echo "error: @capacitor/cli $VERSION does not match @capacitor/core $CORE" >&2
  exit 1
fi

exec node "$CLI" "$@"
