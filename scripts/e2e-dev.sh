#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")"/..

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'
print_status() { echo -e "${GREEN}[E2E-DEV]${NC} $1"; }
print_error()  { echo -e "${RED}[ERROR]${NC} $1"; }

# Check services are running (fail fast with helpful message)
check_services() {
  local missing=0

  if ! supabase status --output json | jq -r '.API_URL'; then
    print_error "Supabase is not running. Starting..."
    supabase start
    supabase db reset
    missing=1
  fi

  if ! curl -s http://127.0.0.1:9099 > /dev/null 2>&1; then
    print_error "Firebase emulator is not running. Run: yarn emulate"
    missing=1
  fi

  if ! curl -s http://localhost:8088/health > /dev/null 2>&1; then
    print_error "Backend API is not running. Run: yarn --cwd=backend/api dev"
    missing=1
  fi

  if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    print_error "Next.js is not running. Run: yarn --cwd=web dev"
    missing=1
  fi

  if [ $missing -eq 1 ]; then
    echo ""
    echo "Start everything with: yarn e2e:services"
    echo "Or start full clean run: yarn test:e2e"
    exit 1
  fi
}

print_status "Checking services..."
check_services
print_status "All services running ✅"

export $(cat .env.test | grep -v '^#' | xargs)
export NEXT_PUBLIC_SUPABASE_URL=$(supabase status --output json | jq -r '.API_URL')
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(supabase status --output json | jq -r '.ANON_KEY')
export DATABASE_URL=$(supabase status --output json | jq -r '.DB_URL')

# Run tests - pass all args through to playwright
# Examples:
#   yarn test:e2e:dev                          → all e2e tests
#   yarn test:e2e:dev tests/e2e/auth.spec.ts   → specific file
#   yarn test:e2e:dev --grep "login"           → tests matching pattern
#   yarn test:e2e:dev --ui                     → open Playwright UI

if [ $# -eq 0 ]; then
  # No arguments: run all tests in tests/e2e
  print_status "Running: npx playwright test tests/e2e"
  npx playwright test tests/e2e
else
  # Arguments provided: pass them directly to playwright
  print_status "Running: npx playwright test $@"
  npx playwright test "$@"
fi
