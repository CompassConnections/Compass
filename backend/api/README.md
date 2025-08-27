# api

One function to rule them all, one docker image to bind them

## Setup

You must have set up the `gcloud` cli

## Test

In root directory `./dev.sh [dev|prod]` will run the api with hot reload, along with all the other backend and web code.

## Deploy

Run `./deploy-api.sh [dev|prod]` in this directory

## Secrets management

Secrets are strings that shouldn't be checked into Git (eg API keys, passwords).

Add or remove keys using [Google Secret Manager](https://console.cloud.google.com/security/secret-manager), which provides them as environment variables to functions that require them.

[Secrets manager](https://console.cloud.google.com/security/secret-manager?project=polylove)

Secondly, please update the list of secret keys at `backend/shared/src/secrets.ts`. Only these keys are provided to functions, scripts, and the api.
