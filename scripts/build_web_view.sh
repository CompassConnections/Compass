#!/bin/bash

set -e

cd "$(dirname "$0")"/..

export NEXT_PUBLIC_WEBVIEW=1

yarn build-web
