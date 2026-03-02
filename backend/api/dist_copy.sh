#!/bin/bash

set -e

cd "$(dirname "$0")"

rsync -a --delete ../../common/lib/ dist/common/lib
rsync -a --delete ../../common/messages/ dist/common/messages/

rsync -a --delete ../shared/lib/ dist/backend/shared/lib

rsync -a --delete ../email/lib/ dist/backend/email/lib

rsync -a --delete ./lib/* dist/backend/api/lib
cp package.json dist/backend/api
cp metadata.json dist
cp metadata.json dist/backend/api

cp ../../yarn.lock dist

# Installing from backend/api/package.json is not enough
# Need to install the deps from all the workspaces used in the back end
node -e "
  const fs = require('fs');
  const deps = ['../api', '../shared', '../email', '../../common']
    .map(p => require('./' + p + '/package.json').dependencies || {})
    .reduce((acc, d) => ({ ...acc, ...d }), {});
  const pkg = require('./package.json');
  pkg.dependencies = { ...deps, ...pkg.dependencies };
  fs.writeFileSync('./dist/package.json', JSON.stringify(pkg, null, 2));
"
