#!/bin/bash

set -e

cd "$(dirname "$0")"/..

ENVIRONMENT=${1:-dev}
echo "Running in $ENVIRONMENT environment"
case $ENVIRONMENT in
  dev)
    NEXT_ENV=DEV
    ;;
  prod)
    NEXT_ENV=PROD
    ;;
  *)
    echo "Unknown environment: $ENVIRONMENT"
    exit 1
    ;;
esac

WEB_DIR=web

if [ "$ENVIRONMENT" = "prod" ]; then
  npx dotenv -e .env -- npx concurrently \
    -n API,NEXT,TS \
    -c white,magenta,cyan \
    "cross-env ENVIRONMENT=$NEXT_ENV yarn --cwd=backend/api prod" \
    "cross-env NEXT_PUBLIC_FIREBASE_ENV=$NEXT_ENV yarn --cwd=$WEB_DIR serve" \
    "cross-env yarn --cwd=$WEB_DIR ts-watch"
else
  npx dotenv -e .env -- npx concurrently \
    -n API,NEXT \
    -c white,magenta \
    "cross-env ENVIRONMENT=$NEXT_ENV yarn --cwd=backend/api dev" \
    "cross-env NEXT_PUBLIC_FIREBASE_ENV=$NEXT_ENV yarn --cwd=$WEB_DIR serve"
fi


