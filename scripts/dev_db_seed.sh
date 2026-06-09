#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

export ENVIRONMENT=dev

export DATABASE_URL="postgres://postgres.zbspxezubpzxmuxciurg:ZTNlifGKofSKhu8c@aws-1-us-west-1.pooler.supabase.com:6543/postgres"

cd tests/e2e/utils

npx tsx seed-test-data.ts
