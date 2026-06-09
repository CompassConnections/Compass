#!/bin/bash

set -euo pipefail

cd "$(dirname "$0")/.."

./scripts/combine-migrations.sh

./scripts/dev_db_write_schema.sh

./scripts/dev_db_seed.sh
