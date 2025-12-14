#!/bin/bash

set -e

cd "$(dirname "$0")"/..

yarn build-web-view

npx @capawesome/cli apps:bundles:create \
  --app-id 969bc540-8077-492f-8403-b554bee5de50 \
  --channel default \
  --path web/out
