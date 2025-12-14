#!/bin/bash

set -e

cd "$(dirname "$0")"/..

yarn build-web-view

npx @capawesome/cli apps:bundles:create \
  --app-id 969bc540-8077-492f-8403-b554bee5de50 \
  --channel default \
  --commit-message $(git log -1 --pretty=format:"%s") \
  --commit-ref 'd699ceae3890f70a7bc66720bc980398f799a6e1' \
  --commit-sha 'd699ceae3890f70a7bc66720bc980398f799a6e1' \
  --path web/out
