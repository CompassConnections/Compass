#!/bin/bash

set -euo pipefail

# Change to project root
cd "$(dirname "$0")"/..

echo "📦 Copying migrations from backend/supabase/ to supabase/migrations/"
echo ""

# Create migrations directory if it doesn't exist
mkdir -p supabase/migrations

# Read migration.sql and extract all \i commands
if [ ! -f "backend/supabase/migration.sql" ]; then
  echo "❌ Error: backend/supabase/migration.sql not found"
  exit 1
fi

# Remove existing files (if any)
find supabase/migrations -name "*.sql" -type f -delete 2>/dev/null || true

# Extract file paths from \i commands
FILES=$(grep '\\i ' backend/supabase/migration.sql | sed 's/\\i //' | sed 's/;//' | tr -d '\r')

# Starting timestamp (you can adjust this)
TIMESTAMP=20250101000000
COUNTER=0

echo "Files to copy:"
echo "----------------------------------------"

# Copy each file with timestamp
while IFS= read -r file; do
  # Remove leading/trailing whitespace
  file=$(echo "$file" | xargs)

  if [ -z "$file" ]; then
    continue
  fi

  if [ ! -f "$file" ]; then
    echo "⚠️  Warning: $file not found, skipping..."
    continue
  fi

  # Calculate timestamp (increment by 1 minute for each file)
  CURRENT_TIMESTAMP=$((TIMESTAMP + COUNTER))

  # Get filename without path
  BASENAME=$(basename "$file")

  # Create descriptive name from path
  # backend/supabase/users.sql -> users
  # backend/supabase/migrations/20251106_add_message_actions.sql -> add_message_actions
  if [[ "$file" == *"/migrations/"* ]]; then
    # Already has a migration name
    NAME=$(echo "$BASENAME" | sed 's/^[0-9_]*//;s/\.sql$//')
  else
    NAME=$(echo "$BASENAME" | sed 's/\.sql$//')
  fi

  # Output filename
  OUTPUT="supabase/migrations/${CURRENT_TIMESTAMP}_${NAME}.sql"

  # Add header comment to track source
  {
    echo "-- Migration: $NAME"
    echo "-- Source: $file"
    echo "-- Timestamp: $(date)"
    echo ""
    cat "$file"
  } > "$OUTPUT"

  echo "✅ $file -> $OUTPUT"

  COUNTER=$((COUNTER + 100))
done <<< "$FILES"

echo ""
echo "----------------------------------------"
echo "✅ Migration files copied to supabase/migrations/"
echo ""
echo "To apply migrations:"
echo "  npx supabase db reset"
echo ""
echo "To view in Studio:"
echo "  open http://127.0.0.1:54323"