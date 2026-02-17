#!/bin/bash

# Run the web app locally in full isolation (database, storage and authentication all stored locally)
# What runs on each port?
# - 4000: Firebase emulator UI
# - 9099: Firebase emulator authentication
# - 9199: Firebase emulator storage
# - 54323: Supabase emulator UI
# - 54322: Supabase emulator Database (direct client)
# - 54321: Supabase emulator Database (font-end client)
# - 3000: Front end
# - 8088: Back end

# How to view users? Each user is stored in two locations for two different purposes:
# In the auth system (firebase emulator) to see the auth info (email, provider, etc.): http://127.0.0.1:4000/auth
# In the database (users and private_users table) to see the user info specific to compass (username, notif preferences, etc.): http://127.0.0.1:54323

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

echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
echo $DATABASE_URL

# Start servers in background and store their PIDs
PIDS=()
npx nyc --reporter=lcov yarn --cwd=web serve & PIDS+=($!)
npx nyc --reporter=lcov yarn --cwd=backend/api dev & PIDS+=($!)
yarn emulate & PIDS+=($!)

npx wait-on http://localhost:3000

echo ""
echo "✅ Isolated web app fully running and ready!"
echo "  Useful links:"
echo "  - Front end: http://127.0.0.1:3000"
echo "  - Supabase UI: http://127.0.0.1:54323"
echo "  - Firebase UI: http://127.0.0.1:4000"
echo ""
read -p "Press enter to exit..." < /dev/tty

exit ${TEST_FAILED:-0}
