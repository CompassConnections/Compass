#!/bin/bash

# Runs the real-Postgres integration tests. Needs the local Supabase stack (./scripts/supabase_start.sh).
#
# The tests truncate tables, so they get their own throwaway database inside the local cluster, rebuilt
# from migration.sql on every run. The `postgres` database that holds local dev data is never touched.

set -euo pipefail

cd "$(dirname "$0")/.."

DB_NAME=compass_integration
export PGPASSWORD=postgres
export PGOPTIONS='-c client_min_messages=warning' # The migrations' `if exists` notices drown out the test output
PSQL=(psql -h 127.0.0.1 -p 54322 -U postgres -v ON_ERROR_STOP=1 -q)

if ! "${PSQL[@]}" -d postgres -c 'select 1' > /dev/null 2>&1; then
  echo "Error: local Supabase Postgres is not reachable on port 54322. Run ./scripts/supabase_start.sh first."
  exit 1
fi

echo "Rebuilding $DB_NAME from backend/supabase/migration.sql..."
"${PSQL[@]}" -d postgres -c "drop database if exists $DB_NAME with (force)" -c "create database $DB_NAME"
# Supabase sets these up on the databases it provisions, and they are per-database, so a hand-made one
# lacks them. Without them `anon` starts with no access, and access tests pass whatever the migrations do.
"${PSQL[@]}" -d "$DB_NAME" <<'SQL'
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
SQL
"${PSQL[@]}" -d "$DB_NAME" -f backend/supabase/migration.sql > /dev/null

yarn --cwd=backend/api test:integration "$@"
