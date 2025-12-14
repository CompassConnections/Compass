#!/bin/bash

set -e

cd "$(dirname "$0")"/..

yarn build-web-view

echo npx @capawesome/cli apps:bundles:create \
       --app-id 969bc540-8077-492f-8403-b554bee5de50 \
       --channel default \
       --commitMessage $commitMessage \
       --commitRef $commitRef \
       --commitSha $commitSha \
       --path web/out

npx @capawesome/cli apps:bundles:create \
  --app-id 969bc540-8077-492f-8403-b554bee5de50 \
  --channel default \
  --commitMessage $commitMessage \
  --commitRef $commitRef \
  --commitSha $commitSha \
  --path web/out
