#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

# Test database config (hardcoded - no .env needed)
export DB_HOST=localhost
export DB_PORT=5433
export DB_USER=test_user
export DB_NAME=test_db
export PGPASSWORD=test_password

# Build connection URL
export DATABASE_URL="postgresql://$DB_USER:$PGPASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo "Migrating test database: $DATABASE_URL"

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "Error: psql not found. Use docker exec instead."
    echo "Running: docker exec scripts-postgres-test-1 psql ..."

    # Use docker exec if psql not installed
    docker exec -i scripts-postgres-test-1 psql -U $DB_USER -d $DB_NAME <<EOF
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
EOF

    # Apply migration via docker
    docker exec -i scripts-postgres-test-1 psql -U $DB_USER -d $DB_NAME < backend/supabase/migration.sql
else
    # Using local psql
    # Clear existing schema
    psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

    # Apply migration
    psql "$DATABASE_URL" -f backend/supabase/migration.sql
fi

echo "✅ Test database migration complete"