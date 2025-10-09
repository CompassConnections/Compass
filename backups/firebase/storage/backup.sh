#!/bin/bash

set -e
cd "$(dirname "$0")"

TIMESTAMP=$(date +"%F_%H-%M-%S")

DESTINATION=./data/$TIMESTAMP

mkdir -p $DESTINATION

gsutil -m cp -r gs://compass-130ba.firebasestorage.app $DESTINATION
gsutil -m cp -r gs://compass-130ba-private $DESTINATION

echo Backup of Firebase Storage done



