#!/bin/bash
set -e

cd "$(dirname "$0")"

source ../../.env

ENV=${1:-prod}

if [ "$ENV" != "prod" ] && [ "$ENV" != "dev" ]; then
  echo "Invalid environment '${ENV}'; must be 'dev' or 'prod'."
  exit 1
fi

# Config
REGION="us-west1"
ZONE="us-west1-b"

# Prod and dev live in separate GCP/Firebase projects (see main.tf). The image is
# built into, and Cloud Run deployed to, the project matching $ENV.
if [ "$ENV" = "prod" ]; then
  PROJECT="compass-130ba"
  DOMAIN="api.compassmeet.com"
else
  PROJECT="compass-57c3c"
  DOMAIN="api.dev.compassmeet.com"
fi
SERVICE_NAME="api"

echo "Deploying '${SERVICE_NAME}' to ${ENV} (project ${PROJECT})"

GIT_REVISION=$(git rev-parse --short HEAD)
GIT_COMMIT_DATE=$(git log -1 --format=%ci)
GIT_COMMIT_AUTHOR=$(git log -1 --format='%an')
GIT_COMMIT_MESSAGE=$(git log -1 --format='%s')
echo "Git commit message: ${GIT_COMMIT_MESSAGE}"

# Built with jq, not a heredoc. These are free text straight out of git: a commit message containing a
# double quote (or a backslash, or a newline) interpolated raw produced invalid JSON, and because
# metadata.json is compiled as a module the failure surfaced as a wall of TS1005 syntax errors from tsc
# rather than as anything to do with the deploy. jq escapes each value for us.
jq -n \
  --arg revision "$GIT_REVISION" \
  --arg commitDate "$GIT_COMMIT_DATE" \
  --arg author "$GIT_COMMIT_AUTHOR" \
  --arg message "$GIT_COMMIT_MESSAGE" \
  '{git: {revision: $revision, commitDate: $commitDate, author: $author, message: $message}}' \
  > metadata.json

TIMESTAMP=$(date +"%s")
IMAGE_TAG="${TIMESTAMP}-${GIT_REVISION}"
IMAGE_URL="${REGION}-docker.pkg.dev/${PROJECT}/builds/${SERVICE_NAME}:${IMAGE_TAG}"

echo "🚀 Building & Pushing Image..."
yarn build
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin ${REGION}-docker.pkg.dev
gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet
docker build . --tag ${IMAGE_URL} --platform linux/amd64
docker push ${IMAGE_URL}

# Update Cloud Run (The fast way)
# This keeps all the Terraform-defined settings (env vars, memory, etc.)
# but simply swaps the container image.
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_URL} \
  --project ${PROJECT} \
  --region ${REGION} \
  --platform managed \
  --quiet

echo "Custom Domain: https://${DOMAIN}"
echo "✅ Code updated on Cloud Run!"
