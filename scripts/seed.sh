#!/bin/bash

set -euo pipefail

# Change to project root
cd "$(dirname "$0")"/..

export $(cat .env.test | grep -v '^#' | xargs)

# Get connection details
STATUS_JSON=$(supabase status --output json)
export NEXT_PUBLIC_SUPABASE_URL=$(echo "$STATUS_JSON" | jq -r '.API_URL')
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(echo "$STATUS_JSON" | jq -r '.ANON_KEY')
export DATABASE_URL=$(echo "$STATUS_JSON" | jq -r '.DB_URL')

cd tests/e2e/utils

npx tsx seed-test-data.ts
