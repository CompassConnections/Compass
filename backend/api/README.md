# api

One function to rule them all, one docker image to bind them

## Setup

You must have set up the `gcloud` cli.

```bash
gcloud artifacts repositories create builds \
  --repository-format=docker \
  --location=us-west1 \
  --description="Docker images for API"
gcloud auth configure-docker us-west1-docker.pkg.dev
gcloud config set project compass-130ba
gcloud projects add-iam-policy-binding compass-130ba \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding compass-130ba \
  --member="user:YOUR_EMAIL@gmail.com" \
  --role="roles/storage.objectAdmin"
gsutil mb -l us-west1 gs://compass-130ba-terraform-state
gsutil uniformbucketlevelaccess set on gs://compass-130ba-terraform-state
gsutil iam ch user:YOUR_EMAIL@gmail.com:roles/storage.admin gs://compass-130ba-terraform-state
tofu init
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin us-west1-docker.pkg.dev
gcloud projects add-iam-policy-binding compass-130ba \
    --member="serviceAccount:253367029065-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"

```

## Test

In root directory `./dev.sh [dev|prod]` will run the api with hot reload, along with all the other backend and web code.

## Deploy

Run `./deploy-api.sh [dev|prod]` in this directory

## Secrets management

Secrets are strings that shouldn't be checked into Git (eg API keys, passwords).

Add or remove keys using [Google Secret Manager](https://console.cloud.google.com/security/secret-manager), which provides them as environment variables to functions that require them.

[Secrets manager](https://console.cloud.google.com/security/secret-manager?project=polylove)

Secondly, please update the list of secret keys at `backend/shared/src/secrets.ts`. Only these keys are provided to functions, scripts, and the api.
