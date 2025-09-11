#!/bin/bash

set -e

cd "$(dirname "$0")"

rm -rf node_modules web/node_modules backend/api/node_modules backend/email/node_modules command/node_modules backend/shared/node_modules

yarn install --frozen-lockfile

