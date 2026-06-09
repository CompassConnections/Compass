#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

CONN="postgres://postgres.zbspxezubpzxmuxciurg:ZTNlifGKofSKhu8c@aws-1-us-west-1.pooler.supabase.com:6543/postgres"

MIGRATIONS_DIR="supabase/migrations"

if ! ls "$MIGRATIONS_DIR"/*.sql >/dev/null 2>&1; then
  echo "❌ No migrations found in $MIGRATIONS_DIR. Run ./scripts/combine-migrations.sh first."
  exit 1
fi

echo "⚠️  About to DROP SCHEMA public on the remote dev supabase and re-apply all migrations."

# Clear existing schema
psql "$CONN" -v ON_ERROR_STOP=1 -c '
DROP SCHEMA public CASCADE; CREATE SCHEMA public;
'

# Apply new schema (just the schema, not the data obviously), in lexical order
for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "→ Applying $(basename "$f")"
  psql "$CONN" -v ON_ERROR_STOP=1 -f "$f"
done

psql "$CONN" -v ON_ERROR_STOP=1 -c '
ALTER SCHEMA public OWNER TO postgres;
GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO postgres;

grant usage on schema "public" to anon;
grant usage on schema "public" to authenticated;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "public" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "public" TO anon;
'

echo "✅ Schema written to remote dev supabase"

