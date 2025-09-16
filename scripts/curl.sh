#!/bin/bash

set -e
cd "$(dirname "$0")"/..

source .env

#export url=http://localhost:8088/v0
export url=https://api.compassmeet.com

export endpoint=/internal/send-search-notifications

curl -X POST ${url}${endpoint} \
  -H "x-api-key: ${COMPASS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{}'

echo



