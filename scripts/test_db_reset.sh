#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

./scripts/supabase_start.sh

npx supabase db reset

yarn test:db:seed
