#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

./scripts/dev_db_clear_firebase.sh

# Link dev here rather than trusting the checkout's link: `db reset --linked` wipes whatever is linked,
# and a checkout can be left linked to prod. `set -e` stops the reset if the link fails.
npx supabase link --project-ref zbspxezubpzxmuxciurg

SUPABASE_DB_PASSWORD=ZTNlifGKofSKhu8c npx supabase db reset --linked

./scripts/dev_db_seed.sh
