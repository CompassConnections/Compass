#!/bin/bash

# Backup Supabase database and upload to Google Cloud Storage daily, retaining backups for 30 days.

set -e

cd $(dirname "$0")

export ENV=prod

if [ "$ENV" = "prod" ]; then
  export PGHOST="aws-1-us-west-1.pooler.supabase.com"
elif [ "$ENV" = "dev" ]; then
  export PGHOST="db.zbspxezubpzxmuxciurg.supabase.co"
else
  echo "Error: ENV must be 'prod' or 'dev'" >&2
  exit 1
fi

# Config
PGPORT="5432"
PGUSER="postgres.ltzepxnhhnrnvovqblfr"
PGDATABASE="postgres"

# Retrieve password from Secret Manager
PGPASSWORD=$(gcloud secrets versions access latest --secret="SUPABASE_DB_PASSWORD")

BUCKET_NAME="gs://compass-130ba-private/backups/supabase"
BACKUP_DIR="/tmp/supabase_backups"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%F_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/$TIMESTAMP.sql"

export PGPASSWORD
pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -F c -b -v -f "$BACKUP_FILE"

if [ $? -ne 0 ]; then
    echo "Backup failed!"
    exit 1
fi

echo "Backup successful: $BACKUP_FILE"

# UPLOAD TO GCS
echo "Uploading backup to GCS..."
gsutil cp "$BACKUP_FILE" "$BUCKET_NAME/"

# LOCAL RETENTION
LOCAL_RETENTION_DAYS=7
echo "Removing local backups older than $LOCAL_RETENTION_DAYS days..."
find "$BACKUP_DIR" -type f -mtime +$LOCAL_RETENTION_DAYS -delete

# GCS RETENTION
echo "Cleaning old backups from GCS..."
gsutil ls "$BUCKET_NAME/" | while read file; do
    filename=$(basename "$file")
    # Extract timestamp from filename
    file_date=$(echo "$filename" | sed -E 's/(.*)\.sql/\1/')
    # Convert to seconds since epoch
    file_date="2025-09-24_13-00-54"
    date_part=${file_date%_*}          # "2025-09-24"
    time_part=${file_date#*_}          # "13-00-54"
    time_part=${time_part//-/:}        # "13:00:54"
    file_ts=$(date -d "$date_part $time_part" +%s)
    # echo "$file, $filename, $file_date, $file_ts"
    if [ -z "$file_ts" ]; then
        continue
    fi
    now=$(date +%s)
    diff_days=$(( (now - file_ts) / 86400 ))
    echo "File: $filename is $diff_days days old."
    if [ "$diff_days" -gt "$RETENTION_DAYS" ]; then
        echo "Deleting $file from GCS..."
        gsutil rm "$file"
    fi
done

echo "Backup and retention process completed at $(date)."
