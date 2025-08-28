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

ENV=${1:-prod}

# Config
REGION="us-west1"
ZONE="us-west1-b"
PROJECT="compass-130ba"
SERVICE_NAME="api"

GIT_REVISION=$(git rev-parse --short HEAD)
TIMESTAMP=$(date +"%s")
IMAGE_TAG="${TIMESTAMP}-${GIT_REVISION}"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT}/builds/${SERVICE_NAME}:${IMAGE_TAG}"

echo "🚀 Deploying ${SERVICE_NAME} to ${ENV} ($(date "+%Y-%m-%d %I:%M:%S %p"))"
yarn build
docker build . --tag ${IMAGE_URL} --platform linux/amd64
echo "docker push ${IMAGE_URL}"
docker push ${IMAGE_URL}

export TF_VAR_image_url=$IMAGE_URL
export TF_VAR_env=$ENV
tofu apply -auto-approve

echo "✅ Deployment complete! Image: ${IMAGE_URL}"
