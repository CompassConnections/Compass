#!/bin/bash

set -e

cd "$(dirname "$0")"/..

yarn build-web

source web/.env

npx cap sync android
