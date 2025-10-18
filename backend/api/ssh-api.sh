#!/bin/bash

# Script to make it easy to tunnel into the currently running API instance on GCP
# so that you can debug the Node process, e.g. to set breakpoints (in dev!!), use the REPL,
# or do performance or memory profiling.

set -e

SERVICE_NAME="api"
SERVICE_GROUP="${SERVICE_NAME}-group"
ZONE="us-west1-c"
#ENV=${1:-dev}
ENV=prod

case $ENV in
    dev)
        GCLOUD_PROJECT=compass-130ba ;;
    prod)
        GCLOUD_PROJECT=compass-130ba ;;
    *)
        echo "Invalid environment; must be dev or prod."
        exit 1
esac

echo "Looking for API instance on ${GCLOUD_PROJECT} to talk to..."
INSTANCE_ID=$(gcloud compute instances list \
  --filter="zone:(us-west1-c)" \
  --sort-by="~creationTimestamp" \
  --format="value(name)" \
  --limit=1)

#echo "Forwarding debugging port 9229 to ${INSTANCE_ID}. Open chrome://inspect in Chrome to connect."

if [ "$1" = "logs" ]; then
  CMD=(--command="sudo docker logs -f \$(sudo docker ps -alq)")
else
  CMD=()
fi

gcloud compute ssh "${INSTANCE_ID}" \
  --project="${GCLOUD_PROJECT}" \
  --zone="${ZONE}" \
  "${CMD[@]}"

#       -- \
#       -NL 9229:localhost:9229

