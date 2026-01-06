#!/bin/bash

set -e

cd "$(dirname "$0")"/..

COMMIT_SHA=$(git rev-parse HEAD)
COMMIT_REF=$(git branch --show-current)
COMMIT_MESSAGE=$(git log -1 --pretty=format:"%s")
COMMIT_DATE=$(git log -1 --pretty=format:"%cI")
BUILD_DATE=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

cat <<EOF > web/public/live-update.json
{
  "commitSha": "$COMMIT_SHA",
  "commitRef": "$COMMIT_REF",
  "commitMessage": "$COMMIT_MESSAGE",
  "commitDate": "$COMMIT_DATE",
  "buildDate": "$BUILD_DATE"
}
EOF

cat web/public/live-update.json

yarn build-web-view

echo npx @capawesome/cli apps:bundles:create \
       --app-id 969bc540-8077-492f-8403-b554bee5de50 \
       --channel default \
       --commitMessage "$COMMIT_MESSAGE" \
       --commitRef $COMMIT_REF \
       --commitSha $COMMIT_SHA \
       --path web/out

npx @capawesome/cli apps:bundles:create \
  --app-id 969bc540-8077-492f-8403-b554bee5de50 \
  --channel default \
  --commitMessage "$COMMIT_MESSAGE" \
  --commitRef $COMMIT_REF \
  --commitSha $COMMIT_SHA \
  --path web/out
