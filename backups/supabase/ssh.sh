#!/bin/bash

set -e

cd $(dirname "$0")

#gcloud compute firewall-rules create allow-iap-ssh \
#    --direction=INGRESS \
#    --action=ALLOW \
#    --rules=tcp:22 \
#    --source-ranges=35.235.240.0/20 \
#    --target-tags=iap-ssh
# gcloud compute instances add-tags "supabase-backup-vm" --tags=iap-ssh --zone="us-west1-b"


gcloud compute ssh --zone "us-west1-b" "supabase-backup-vm" --project "compass-130ba" --tunnel-through-iap

# sudo crontab -u backup -l