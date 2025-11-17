#!/bin/bash

set -e

cd "$(dirname "$0")"/..

npx playwright install chromium

export NEXT_PUBLIC_API_URL=localhost:8088
export NEXT_PUBLIC_FIREBASE_ENV=DEV

npx nyc --reporter=lcov yarn --cwd=web serve &
npx wait-on http://localhost:3000
npx playwright test tests/e2e
SERVER_PID=$(fuser -k 3000/tcp)
echo $SERVER_PID
kill $SERVER_PID

