#!/bin/bash

# Apply a migration file to dev, then prod. Dev goes first as the rehearsal: if it fails, prod is
# never touched.
#
#   ./scripts/migrate.sh backend/supabase/migrations/<file>.sql          # dev, then prod
#   ./scripts/migrate.sh backend/supabase/migrations/<file>.sql dev      # one database only, e.g. to
#   ./scripts/migrate.sh backend/supabase/migrations/<file>.sql prod     # finish after a failure
#
# Passwords come from .env: DEV_DB_PASSWORD (falling back to SUPABASE_DB_PASSWORD) and PROD_DB_PASSWORD.

set -e
cd "$(dirname "$0")"/..

source .env

FILE=$1
TARGET=${2:-both}

DEV_INSTANCE_ID=zbspxezubpzxmuxciurg
PROD_INSTANCE_ID=ltzepxnhhnrnvovqblfr

# The pooler, not db.<instance>.supabase.co: that host is IPv6-only, so it is unreachable from most
# networks. Same host as backend/shared/src/supabase/init.ts, but port 5432 (session mode) rather
# than 6543 (transaction mode), so the whole file runs on one server connection.
POOLER_HOST=aws-1-us-west-1.pooler.supabase.com

DEV_PASSWORD=${DEV_DB_PASSWORD}
PROD_PASSWORD=${PROD_DB_PASSWORD:-$SUPABASE_DB_PASSWORD}

if [ ! -f "$FILE" ]; then
  echo "Usage: $0 <migration.sql> [dev|prod|both]" >&2
  exit 1
fi

case "$TARGET" in
  dev | prod | both) ;;
  *)
    echo "Unknown target: $TARGET (expected dev, prod or both)" >&2
    exit 1
    ;;
esac

# Checked up front, so a missing password cannot leave a migration applied to dev only.
if [ "$TARGET" != prod ] && [ -z "$DEV_PASSWORD" ]; then
  echo "Set DEV_DB_PASSWORD or SUPABASE_DB_PASSWORD in .env" >&2
  exit 1
fi
if [ "$TARGET" != dev ] && [ -z "$PROD_PASSWORD" ]; then
  echo "Set PROD_DB_PASSWORD in .env" >&2
  exit 1
fi

# ON_ERROR_STOP matters: without it psql carries on past a failed statement and exits 0, so a broken
# migration would continue to prod. --single-transaction means a failure leaves nothing half-applied.
apply() {
  local name=$1 instance_id=$2 password=$3
  echo "Applying $FILE to $name"
  PGPASSWORD=$password PGSSLMODE=require psql \
    -h "$POOLER_HOST" \
    -p 5432 \
    -d postgres \
    -U "postgres.$instance_id" \
    -v ON_ERROR_STOP=1 \
    --single-transaction \
    -f "$FILE"
}

if [ "$TARGET" != prod ]; then
  apply dev "$DEV_INSTANCE_ID" "$DEV_PASSWORD"
fi
if [ "$TARGET" != dev ]; then
  apply prod "$PROD_INSTANCE_ID" "$PROD_PASSWORD"
fi
