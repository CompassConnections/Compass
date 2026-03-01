#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

if [ "${CI:-false}" = "true" ]; then
  npx supabase start --exclude studio
else
  npx supabase start
fi
