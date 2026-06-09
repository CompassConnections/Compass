#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

source .env

#export ENV=dev

CONN="postgres://postgres.zbspxezubpzxmuxciurg:ZTNlifGKofSKhu8c@aws-1-us-west-1.pooler.supabase.com:6543/postgres"

MIGRATIONS_DIR="supabase/migrations"

if ! ls "$MIGRATIONS_DIR"/*.sql >/dev/null 2>&1; then
  echo "❌ No migrations found in $MIGRATIONS_DIR. Run ./scripts/combine-migrations.sh first."
  exit 1
fi

echo "⚠️  About to DROP SCHEMA public on CONN and re-apply all migrations."

# Clear existing schema
psql "$CONN" -v ON_ERROR_STOP=1 -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Apply new schema (just the schema, not the data obviously), in lexical order
for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "→ Applying $(basename "$f")"
  psql "$CONN" -v ON_ERROR_STOP=1 -f "$f"
done

echo "✅ Schema written to remote dev supabase"
