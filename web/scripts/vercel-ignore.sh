#!/bin/bash
# Vercel `ignoreCommand`: exit 0 to skip the build, non-zero to build.
# Skips the build when neither web/ nor common/ changed since the previous deployed commit.
# Kept in a script (rather than inline in vercel.json) because `ignoreCommand` is capped at 256 chars.

# Vercel's build container has no fetchable `origin`, so both of these always fail there and the
# script falls through to building — the safe direction. Kept for local and other-CI runs where the
# history *is* fetchable. stderr is dropped so two `fatal:` lines do not make a healthy deploy look
# like a broken one.
git fetch origin --unshallow 2>/dev/null || git fetch origin --deepen=200 2>/dev/null || true

echo "prev=$VERCEL_GIT_PREVIOUS_SHA cur=$VERCEL_GIT_COMMIT_SHA"

if [ -z "$VERCEL_GIT_PREVIOUS_SHA" ] || ! git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA^{commit}" 2>/dev/null; then
  echo 'no usable previous sha - building'
  exit 1
fi

git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" "$VERCEL_GIT_COMMIT_SHA" -- ./ ../common/
