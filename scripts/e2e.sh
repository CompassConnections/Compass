#!/bin/bash

set -euo pipefail

# Change to project root
cd "$(dirname "$0")"/..

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() { echo -e "${GREEN}[E2E]${NC} $1"; }
print_error()  { echo -e "${RED}[ERROR]${NC} $1"; }
print_warning(){ echo -e "${YELLOW}[WARN]${NC} $1"; }

# Array to track background process PIDs
PIDS=()

# Function to clean up background processes
cleanup() {
  print_status "Cleaning up..."

  # Stop Firebase emulators
  ./scripts/firebase_stop.sh

  # Kill all background processes
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
      wait "$pid" 2>/dev/null || true
    fi
  done

  # Stop Docker containers
  if [ "${SKIP_DB_CLEANUP:-}" != "true" ]; then
    print_status "Stopping test database..."
    docker compose -f scripts/docker-compose.test.yml down -v
  fi

  sleep 2

  print_status "Cleanup complete"
}

# Trap EXIT, INT, TERM to run cleanup automatically
trap cleanup EXIT INT TERM

# Load test environment variables
if [ -f .env.test ]; then
  export $(cat .env.test | grep -v '^#' | xargs)
fi

# ✅ Kill stale processes from previous runs
print_status "Killing any stale processes..."
./scripts/firebase_stop.sh
supabase stop --no-backup 2>/dev/null || true
sleep 2  # Give ports time to free up

# Start Supabase (includes Postgres, Auth, Storage, etc.) and Apply migrations
yarn test:db:reset

# Get connection details
export NEXT_PUBLIC_SUPABASE_URL=$(supabase status --output json | jq -r '.API_URL')
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(supabase status --output json | jq -r '.ANON_KEY')
export DATABASE_URL=$(supabase status --output json | jq -r '.DB_URL')

echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $DATABASE_URL

print_status "Supabase started at: $DATABASE_URL"

# Install Playwright browsers
print_status "Installing Playwright browsers..."
npx playwright install chromium # --with-deps

# Start Firebase emulators
print_status "Starting Firebase emulators..."
yarn emulate & PIDS+=($!)

# Wait for emulators to be ready
print_status "Waiting for Firebase emulators..."
npx wait-on \
  http-get://127.0.0.1:9099 \
  --timeout 30000

# Build backend (required?)
./scripts/build_api.sh

# Seed test data if script exists
if [ -f "scripts/seed-test-data.ts" ]; then
  print_status "Seeding test data..."
  npx tsx scripts/seed-test-data.ts
fi

# Start backend API
print_status "Starting backend API..."
yarn --cwd=backend/api dev & PIDS+=($!)

# Wait for API to be ready
print_status "Waiting for API..."
npx wait-on http://localhost:8088/health --timeout 30000 || {
  print_error "API failed to start"
  exit 1
}

# Start Next.js app
print_status "Starting Next.js app..."
yarn --cwd=web dev & PIDS+=($!)

# Wait for Next.js to be ready
print_status "Waiting for Next.js..."
npx wait-on http://localhost:3000 --timeout 60000 || {
  print_error "Next.js failed to start"
  exit 1
}

# Run Playwright tests
echo ""
print_status "✅ Running Playwright tests..."
print_status "  Useful links:"
print_status "  - Front end: http://127.0.0.1:3000"
print_status "  - Supabase UI: http://127.0.0.1:54323"
print_status "  - Firebase UI: http://127.0.0.1:4000"

TEST_FAILED=0
npx playwright test tests/e2e "$@" || TEST_FAILED=$?

if [ $TEST_FAILED -eq 0 ]; then
  print_status "${GREEN}All tests passed!${NC}"
else
  print_error "Some tests failed (exit code: $TEST_FAILED)"
fi

exit $TEST_FAILED