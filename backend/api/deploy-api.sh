#!/bin/bash

# steps to deploy new version to GCP:
# 1. build new docker image & upload to Google
# 2. create a new GCP instance template with the new docker image
# 3. tell the GCP 'backend service' for the API to update to the new template
# 4. a. GCP creates a new instance with the new template
#    b. wait for the new instance to be healthy (serving TCP connections)
#    c. route new connections to the new instance
#    d. delete the old instance

set -e

cd "$(dirname "$0")"

source ../../.env

ENV=${1:-prod}

# Config
REGION="us-west1"
ZONE="us-west1-b"

PROJECT="compass-130ba"
SERVICE_NAME="api"

GIT_REVISION=$(git rev-parse --short HEAD)
GIT_COMMIT_DATE=$(git log -1 --format=%ci)
GIT_COMMIT_AUTHOR=$(git log -1 --format='%an')

cat > metadata.json << EOF
{
  "git": {
    "revision": "${GIT_REVISION}",
    "commitDate": "${GIT_COMMIT_DATE}",
    "author": "${GIT_COMMIT_AUTHOR}"
  }
}
EOF

TIMESTAMP=$(date +"%s")
IMAGE_TAG="${TIMESTAMP}-${GIT_REVISION}"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT}/builds/${SERVICE_NAME}:${IMAGE_TAG}"

echo "🚀 Deploying ${SERVICE_NAME} to ${ENV} ($(date "+%Y-%m-%d %I:%M:%S %p"))"
yarn build

gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin us-west1-docker.pkg.dev
docker build . --tag ${IMAGE_URL} --platform linux/amd64
echo "docker push ${IMAGE_URL}"
docker push ${IMAGE_URL}

export TF_VAR_image_url=$IMAGE_URL
export TF_VAR_env=$ENV
tofu apply -auto-approve

#INSTANCE_NAME=$(gcloud compute instances list \
#  --filter="zone:(us-west1-c)" \
#  --sort-by="~creationTimestamp" \
#  --format="value(name)" \
#  --limit=1)
#SERVICE_ACCOUNT_EMAIL=$(gcloud compute instances describe ${INSTANCE_NAME} \
#  --zone us-west1-c \
#  --format="value(serviceAccounts.email)")
#gcloud projects add-iam-policy-binding ${PROJECT} \
#  --member="serviceAccount:$SERVICE_ACCOUNT_EMAIL" \
#  --role="roles/artifactregistry.reader"

echo "✅ Deployment complete! Image: ${IMAGE_URL}"
