#!/bin/bash

# TODO: is the same as run_local_isolated.sh apart from the process cleanup. See if they can be merged.
# Test services and isolated dev services are the same for now, but they may diverge in the future.

set -euo pipefail

# Change to project root
cd "$(dirname "$0")"/..

export $(cat .env.test | grep -v '^#' | xargs)

# Ensure Supabase local stack is running; if not, reset/start it
STATUS_JSON=$(supabase status --output json 2>/dev/null || echo '')
API_URL=$(echo "$STATUS_JSON" | jq -r '.API_URL // empty')

if [ -z "$API_URL" ]; then
  echo "Supabase is not running. Bootstrapping local stack with: yarn test:db:reset"
  yarn test:db:reset
  STATUS_JSON=$(supabase status --output json)
fi

export NEXT_PUBLIC_SUPABASE_URL=$(echo "$STATUS_JSON" | jq -r '.API_URL')
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(echo "$STATUS_JSON" | jq -r '.ANON_KEY')
export DATABASE_URL=$(echo "$STATUS_JSON" | jq -r '.DB_URL')

# Build backend (required?)
./scripts/build_api.sh

concurrently --names 'firebase,api,web' 'yarn emulate' 'yarn --cwd=backend/api dev' 'yarn --cwd=web dev'
