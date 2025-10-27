#!/bin/bash

set -e

cd "$(dirname "$0")"/..

# Paths
ROOT_ENV=".env"           # your root .env
WEB_ENV="web/.env"        # target for frontend

# Backup existing web/.env if it exists
if [ -f "$WEB_ENV" ]; then
  cp "$WEB_ENV" "${WEB_ENV}.bak"
  echo "Backed up existing $WEB_ENV to ${WEB_ENV}.bak"
fi

# Filter NEXT_PUBLIC_* lines
grep '^NEXT_PUBLIC_' "$ROOT_ENV" > "$WEB_ENV"

echo "Copied NEXT_PUBLIC_ variables to $WEB_ENV:"

echo "NEXT_PUBLIC_FIREBASE_ENV=prod" >> "$WEB_ENV"

cat "$WEB_ENV"

cd web

rm -rf .next

yarn build

rm -rf .next/cache

cd ..

npx cap copy android
npx cap sync android
npx cap open android
