# Backend API

This is the code for the API running at https://api.compassmeet.com.
It runs in a docker inside a Google Cloud virtual machine.

### Requirements

You must have the `gcloud` CLI.

On macOS:

```bash
brew install --cask google-cloud-sdk
```

On Linux:

```bash
sudo apt-get update && sudo apt-get install google-cloud-sdk
```

Then:

```bash
gcloud init
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

You also need `opentofu` and `docker`. Try running this (from root) on Linux or macOS for a faster install:

```bash
./script/setup.sh
```

If it doesn't work, you can install them manually (google how to install `opentofu` and `docker` for your OS).

### Setup

This section is only for the people who are creating a server from scratch, for instance for a forked project.

One-time commands you may need to run:

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
gcloud projects add-iam-policy-binding compass-130ba \
    --member="serviceAccount:253367029065-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
gcloud run services list
gcloud compute backend-services update api-backend \
  --global \
  --timeout=600s
```

Set up the saved search notifications job:

```bash
gcloud scheduler jobs create http daily-saved-search-notifications \
  --schedule="0 16 * * *" \
  --uri="https://api.compassmeet.com/internal/send-search-notifications" \
  --http-method=POST \
  --headers="x-api-key=<API_KEY>" \
  --time-zone="UTC" \
  --location=us-west1
```

View it [here](https://console.cloud.google.com/cloudscheduler).

##### API Deploy CD

```shell
gcloud iam service-accounts create ci-deployer \
  --display-name="CI Deployer"
gcloud projects add-iam-policy-binding compass-130ba \
  --member="serviceAccount:ci-deployer@compass-130ba.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding compass-130ba \
  --member="serviceAccount:ci-deployer@compass-130ba.iam.gserviceaccount.com" \
  --role="roles/storage.objectAdmin"
gcloud projects add-iam-policy-binding compass-130ba \
  --member="serviceAccount:ci-deployer@compass-130ba.iam.gserviceaccount.com" \
  --role="roles/storage.admin"
gcloud projects add-iam-policy-binding compass-130ba \
  --member="serviceAccount:ci-deployer@compass-130ba.iam.gserviceaccount.com" \
  --role="roles/compute.admin"
gcloud iam service-accounts add-iam-policy-binding \
  253367029065-compute@developer.gserviceaccount.com \
  --member="serviceAccount:ci-deployer@compass-130ba.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
gcloud iam service-accounts keys create keyfile.json --iam-account=ci-deployer@compass-130ba.iam.gserviceaccount.com
```

##### DNS

- After deployment, Terraform assigns a static external IP to this resource.
- You can get it manually:

```bash
gcloud compute addresses describe api-lb-ip-2 --global --format="get(address)"
34.117.20.215
```

Since Vercel manages your domain (`compassmeet.com`):

1. Log in to [Vercel dashboard](https://vercel.com/dashboard).
2. Go to **Domains → compassmeet.com → Add Record**.
3. Add an **A record** for your API subdomain:

| Type | Name | Value        | TTL   |
|------|------|--------------|-------|
| A    | api  | 34.123.45.67 | 600 s |

- `Name` is just the subdomain: `api` → `api.compassmeet.com`.
- `Value` is the **external IP of the LB** from step 1.

Verify connectivity
From your local machine:

```bash
nslookup api.compassmeet.com
ping -c 3 api.compassmeet.com
curl -I https://api.compassmeet.com
```

- `nslookup` should return the LB IP (`34.123.45.67`).
- `curl -I` should return `200 OK` from your service.

If SSL isn’t ready (may take 15 mins), check LB logs:

```bash
gcloud compute ssl-certificates describe api-lb-cert-2
```

##### Secrets management

Secrets are strings that shouldn't be checked into Git (eg API keys, passwords).

Add the secrets for your specific project
in [Google Cloud Secrets manager](https://console.cloud.google.com/security/secret-manager), so that the virtual machine
can access them.

For Compass, the name of the secrets are in [secrets.ts](../../common/src/secrets.ts).

### Run Locally

In root directory, run the local api with hot reload, along with all the other backend and web code.

```bash
./run_local.sh prod
```

### Deploy

To deploy the backend code, simply increment the version number in [package.json](package.json) and push to the `main` branch.

Or if you have access to the project on google cloud, run in this directory:

```bash
./deploy-api.sh prod
```

### Connect to the server

Run in this directory to connect to the API server running as virtual machine in Google Cloud. You can access logs,
files, debug, etc.

```bash
./ssh-api.sh prod
```

Useful commands once inside the server:

```bash
sudo journalctl -u konlet-startup --no-pager -efb
sudo docker logs -f $(sudo docker ps -alq)
docker exec -it $(sudo docker ps -alq) sh
docker run -it --rm $(docker images -q | head -n 1) sh
docker rmi -f $(docker images -aq)
```

### Documentation

The API doc is available at https://api.compassmeet.com. It's dynamically prepared in [app.ts](src/app.ts).

### Todo (Tests)

- [ ] Finish get-supabase-token unit test when endpoint is implemented
