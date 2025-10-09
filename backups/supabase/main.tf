locals {
  project = "compass-130ba"
  region  = "us-west1"
  zone         = "us-west1-b"
  service_name = "backup"
  machine_type = "e2-micro"
}

variable "env" {
  description = "Environment (env or prod)"
  type        = string
  default     = "prod"
}

provider "google" {
  project = local.project
  region  = local.region
  zone    = local.zone
}

# Service account for the VM (needs Secret Manager + Storage access)
resource "google_service_account" "backup_vm_sa" {
  account_id   = "backup-vm-sa"
  display_name = "Backup VM Service Account"
}

# IAM roles
resource "google_project_iam_member" "backup_sa_secret_manager" {
  project = "compass-130ba"
  role    = "roles/secretmanager.secretAccessor"
  member  = "serviceAccount:${google_service_account.backup_vm_sa.email}"
}

resource "google_project_iam_member" "backup_sa_storage_admin" {
  project = "compass-130ba"
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.backup_vm_sa.email}"
}

# Minimal VM
resource "google_compute_instance" "backup_vm" {
  name         = "supabase-backup-vm"
  machine_type = local.machine_type
  zone         = local.zone

  boot_disk {
    initialize_params {
      image = "debian-11-bullseye-v20250915"
      size  = 20
    }
  }

  network_interface {
    network = "default"
    access_config {}
  }

  service_account {
    email  = google_service_account.backup_vm_sa.email
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  metadata_startup_script = <<-EOT
    #!/bin/bash
    apt-get update
    apt-get install -y postgresql-client cron wget curl unzip

    # Add PostgreSQL repo
    sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
    wget -qO - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

    sudo apt-get update
    sudo apt-get install -y postgresql-client-17
    sudo apt-get install -y mailutils

    # Create backup directory
    mkdir -p /home/martin/supabase_backups
    chown -R martin:martin /home/martin

    # Example backup script
    cat <<'EOF' > /home/martin/backup.sh
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
EOF

    chmod +x /home/martin/backup.sh

    # Add cron job: daily at 2AM
    ( crontab -l 2>/dev/null; echo '0 2 * * * /home/martin/backup.sh >> /home/martin/backup.log 2>&1 || curl -H "Content-Type: application/json" -X POST -d "{\"content\": \"❌ Backup FAILED on $(hostname) at $(date)\"}" https://discord.com/api/webhooks/1420405275340574873/XgF5pgHABvvWT2fyWASBs3VhAF7Zy11rCH2BkI_RBxH1Xd5duWxGtukrc1cPy1ZucNwx' ) | crontab -
    # tail -f /home/martin/backup.log
}
