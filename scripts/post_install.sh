#!/bin/bash

set -e

cd "$(dirname "$0")"/..

if [ ! -f .env ]; then
  cp .env.example .env
  echo ".env file created from .env.example"
fi