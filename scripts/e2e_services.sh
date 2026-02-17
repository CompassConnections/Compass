#!/bin/bash

set -euo pipefail

# Change to project root
cd "$(dirname "$0")"/..

export $(cat .env.test | grep -v '^#' | xargs)

# Get connection details
export NEXT_PUBLIC_SUPABASE_URL=$(supabase status --output json | jq -r '.API_URL')
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(supabase status --output json | jq -r '.ANON_KEY')
export DATABASE_URL=$(supabase status --output json | jq -r '.DB_URL')

# Build backend (required?)
./scripts/build_api.sh

concurrently --names 'firebase,api,web' 'yarn emulate' 'yarn --cwd=backend/api dev' 'yarn --cwd=web dev'
