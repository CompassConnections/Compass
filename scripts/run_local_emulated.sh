#!/bin/bash

# What runs on each port?
# - 4000: Firebase emulator
# - 3000: Front end
# - 8088: Back end

# How to view users? Each user is stored in two locations for two different purposes:
# In the auth system (firebase emulator) to see the auth info (email, provider, etc.): http://127.0.0.1:4000/auth
# In the database (dev supabase project, users and private_users table) to see the user info specific to compass (username, notif preferences, etc.): use DBeaver to connect to the dev supabase db

# Clean ghost processes
kill_ghosts() {
  for p in 3000 4000 4400 4500 8088; do
    pids=$(lsof -ti :$p 2>/dev/null)
    if [ -n "$pids" ]; then
      kill $pids || true
    fi
  done
}
kill_ghosts

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
  kill_ghosts
}

# Trap EXIT, INT, TERM to run cleanup automatically
trap cleanup EXIT INT TERM

cd "$(dirname "$0")"/..

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

# This creates a new user in firebase auth only (not in the db, hence it won't show in the list of profiles)
npx tsx scripts/setup-auth.ts

read -p "Press enter to exit..." < /dev/tty

exit ${TEST_FAILED:-0}
