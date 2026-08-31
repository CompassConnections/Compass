#!/bin/bash

set -e

cd "$(dirname "$0")"/..

if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env file created from .env.example"
fi

source .env.example
source .env

echo $GOOGLE_CREDENTIALS_ENC_PWD

openssl enc -d -aes-256-cbc -pbkdf2 -iter 100000 -in secrets/googleApplicationCredentials-dev.json.enc -out backend/shared/src/googleApplicationCredentials-dev.json -pass pass:$GOOGLE_CREDENTIALS_ENC_PWD

# `@capgo/capacitor-social-login` presents Google's sign-in from `UIApplication.shared.windows.first`,
# deprecated since iOS 15 and not necessarily the app's own window. When it guesses wrong,
# ASWebAuthenticationSession refuses to start and AppAuth reports it as "Unable to open Safari."
# Seen on build 16 (Sentry COMPASS-60). See the script header; runs here so no install ships unpatched.
node scripts/patch_google_presenting_vc.mjs
