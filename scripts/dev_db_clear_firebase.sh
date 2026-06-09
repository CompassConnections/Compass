#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

export ENVIRONMENT=dev

cd backend/scripts

npx tsx clear_firebase.ts
