#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

source .env

export ENV=dev
export ENVIRONMENT=dev

export DATABASE_URL="postgres://postgres.zbspxezubpzxmuxciurg:ZTNlifGKofSKhu8c@aws-1-us-west-1.pooler.supabase.com:6543/postgres"

cd tests/e2e/utils

npx tsx seed-test-data.ts

# May need to run this as well
#ALTER SCHEMA public OWNER TO postgres;
#GRANT ALL PRIVILEGES ON SCHEMA public TO postgres;
#GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
#GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
#ALTER DEFAULT PRIVILEGES IN SCHEMA public
#  GRANT ALL ON TABLES TO postgres;
#ALTER DEFAULT PRIVILEGES IN SCHEMA public
#  GRANT ALL ON SEQUENCES TO postgres;
#
#grant usage on schema "public" to anon;
#grant usage on schema "public" to authenticated;
#
#GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "public" TO authenticated;
#GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA "public" TO anon;
