#!/bin/bash

set -e
cd "$(dirname "$0")"

PROJECT=compass-130ba

TIMESTAMP=$(date +"%F_%H-%M-%S")

DESTINATION=./data/$TIMESTAMP

mkdir -p $DESTINATION
gsutil -m cp -r gs://$PROJECT.firebasestorage.app $DESTINATION

echo Backup of Firebase Storage done



