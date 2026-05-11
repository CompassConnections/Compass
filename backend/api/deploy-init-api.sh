#!/bin/bash
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
GIT_COMMIT_MESSAGE=$(git log -1 --format='%s')
echo "Git commit message: ${GIT_COMMIT_MESSAGE}"

cat > metadata.json << EOF
{
  "git": {
    "revision": "${GIT_REVISION}",
    "commitDate": "${GIT_COMMIT_DATE}",
    "author": "${GIT_COMMIT_AUTHOR}",
    "message": "${GIT_COMMIT_MESSAGE}"
  }
}
EOF

TIMESTAMP=$(date +"%s")
IMAGE_TAG="${TIMESTAMP}-${GIT_REVISION}"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT}/builds/${SERVICE_NAME}:${IMAGE_TAG}"

echo "🚀 Building & Pushing Image..."
yarn build
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin ${REGION}-docker.pkg.dev
docker build . --tag ${IMAGE_URL} --platform linux/amd64
docker push ${IMAGE_URL}

echo "Infrastructure Update..."
export TF_VAR_image_url=$IMAGE_URL
export TF_VAR_env=$ENV
tofu apply -auto-approve

# Get the new URL just in case
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')

echo "✅ Deployed to Cloud Run!"
echo "Service URL: ${SERVICE_URL}"
echo "Custom Domain: https://api.compassmeet.com"