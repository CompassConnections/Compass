#!/bin/bash

# Push local migrations (supabase/migrations) to the shared dev database, to try them against dev before
# merging. Dev only, by construction: the project ref is fixed here and the password comes from
# DEV_DB_PASSWORD. Prod is only ever migrated by CI (.github/workflows/cd-backend.yml).
#
#   yarn db:push:dev              # apply pending migrations to dev
#   yarn db:push:dev --dry-run    # list them without applying
#
# --include-all applies a pending migration even if dev already has a newer one, which happens when a
# migration pushed from a branch is followed by an older-timestamped one merged from another branch.

set -euo pipefail

cd "$(dirname "$0")"/..

# shellcheck disable=SC1091
source .env

if [ -z "${DEV_DB_PASSWORD:-}" ]; then
  echo "Set DEV_DB_PASSWORD in .env" >&2
  exit 1
fi

DEV_INSTANCE_ID=zbspxezubpzxmuxciurg
# Session pooler, as in CI: the direct host is IPv6-only.
DB_URL="postgresql://postgres.${DEV_INSTANCE_ID}:${DEV_DB_PASSWORD}@aws-1-us-west-1.pooler.supabase.com:5432/postgres"

npx supabase db push --include-all --yes --db-url "$DB_URL" "$@"
