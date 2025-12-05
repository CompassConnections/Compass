#!/bin/bash

set -euo pipefail

# Function to clean up background processes
cleanup() {
  echo "Stopping background processes..."
  for pid in "${PIDS[@]:-}"; do
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" || true
      wait "$pid" 2>/dev/null || true
      echo "Killed PID $pid"
    fi
  done
}

# Trap EXIT, INT, TERM to run cleanup automatically
trap cleanup EXIT INT TERM

cd "$(dirname "$0")"/..

npx playwright install chromium

export NEXT_PUBLIC_API_URL=localhost:8088
export NEXT_PUBLIC_FIREBASE_ENV=DEV
export NEXT_PUBLIC_FIREBASE_EMULATOR=true
export FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099
export FIREBASE_STORAGE_EMULATOR_HOST=127.0.0.1:9199

# Start servers in background and store their PIDs
PIDS=()
npx nyc --reporter=lcov yarn --cwd=web serve & PIDS+=($!)
npx nyc --reporter=lcov yarn --cwd=backend/api dev & PIDS+=($!)
yarn emulate & PIDS+=($!)

npx wait-on http://localhost:3000

npx tsx scripts/setup-auth.ts

npx playwright test tests/e2e

exit ${TEST_FAILED:-0}
