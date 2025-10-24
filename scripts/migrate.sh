#!/bin/bash

set -e
cd "$(dirname "$0")"/..

source .env

export PGPASSWORD=$SUPABASE_DB_PASSWORD

psql \
  -h db.zbspxezubpzxmuxciurg.supabase.co \
  -p 5432 \
  -d postgres \
  -U postgres \
  -f "$1" \
