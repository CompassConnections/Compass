#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

if [ "${CI:-false}" = "true" ]; then
  # Image pulls occasionally time out on shared runners; retry before failing the job
  for attempt in 1 2 3; do
    npx supabase start --exclude studio && exit 0
    echo "supabase start failed (attempt $attempt/3), retrying..."
    npx supabase stop --no-backup || true
    sleep $((attempt * 15))
  done
  exit 1
else
  npx supabase start
fi
