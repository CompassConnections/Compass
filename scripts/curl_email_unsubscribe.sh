#!/bin/bash

curl -i -X POST 'https://api.compassmeet.com/unsubscribe/7444d88a22214f3fd9f2cb9d042fb3d7c6befab541c35d025149f1b65e886bd4' \
  -X POST \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'List-Unsubscribe=One-Click'

echo



