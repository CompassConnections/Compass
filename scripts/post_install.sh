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