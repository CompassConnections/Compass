# Backend API

Express.js REST API for Compass, running at https://api.compassmeet.com.

## Overview

The API handles:

- User authentication and management
- Profile CRUD operations
- Search and filtering
- Messaging
- Notifications
- Compatibility scoring
- Events management
- WebSocket connections for real-time features

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js 5.0
- **Language**: TypeScript
- **Database**: PostgreSQL (via Supabase)
- **ORM**: pg-promise
- **Validation**: Zod
- **WebSocket**: ws library
- **API Docs**: Swagger/OpenAPI

## Project Structure

```
backend/api/
├── src/
│   ├── app.ts             # Express app setup
│   ├── routes.ts          # Route definitions
│   ├── test.ts            # Test utilities
│   ├── get-*.ts           # GET endpoints
│   ├── create-*.ts        # POST endpoints
│   ├── update-*.ts        # PUT/PATCH endpoints
│   ├── delete-*.ts        # DELETE endpoints
│   └── helpers/           # Shared utilities
├── tests/
│   └── unit/              # Unit tests
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20.x or later
- Yarn
- Access to Supabase project (for database)

### Installation

```bash
# From root directory
yarn install
```

You must also have the `gcloud` CLI.

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

### Running Locally

```bash
# Run all services (web + API)
yarn dev

# Run API only (from backend/api)
cd backend/api
yarn serve
```

The API runs on http://localhost:8088 when running locally with the full stack.

### Testing

```bash
# Run unit tests
yarn test

# Run with coverage
yarn test --coverage
```

### Linting

```bash
# Check lint
yarn lint

# Fix issues
yarn lint-fix
```

## API Endpoints

### Authentication

| Method | Endpoint       | Description     |
| ------ | -------------- | --------------- |
| POST   | `/create-user` | Create new user |

### Users

| Method | Endpoint     | Description         |
| ------ | ------------ | ------------------- |
| GET    | `/get-me`    | Get current user    |
| PUT    | `/update-me` | Update current user |
| DELETE | `/delete-me` | Delete account      |

### Profiles

| Method | Endpoint          | Description        |
| ------ | ----------------- | ------------------ |
| GET    | `/get-profiles`   | List profiles      |
| GET    | `/get-profile`    | Get single profile |
| POST   | `/create-profile` | Create profile     |
| PUT    | `/update-profile` | Update profile     |
| DELETE | `/delete-profile` | Delete profile     |

### Messaging

| Method | Endpoint                       | Description    |
| ------ | ------------------------------ | -------------- |
| GET    | `/get-private-messages`        | Get messages   |
| POST   | `/create-private-user-message` | Send message   |
| PUT    | `/edit-message`                | Edit message   |
| DELETE | `/delete-message`              | Delete message |

### Notifications

| Method | Endpoint                | Description        |
| ------ | ----------------------- | ------------------ |
| GET    | `/get-notifications`    | List notifications |
| PUT    | `/update-notif-setting` | Update settings    |

### Search

| Method | Endpoint           | Description        |
| ------ | ------------------ | ------------------ |
| GET    | `/search-users`    | Search users       |
| GET    | `/search-location` | Search by location |

### Compatibility

| Method | Endpoint                       | Description             |
| ------ | ------------------------------ | ----------------------- |
| GET    | `/get-compatibility-questions` | List questions          |
| POST   | `/set-compatibility-answers`   | Submit answers          |
| GET    | `/compatible-profiles`         | Get compatible profiles |

## Writing Endpoints

### 1. Define Schema

Add endpoint definition in `common/src/api/schema.ts`:

```typescript
const endpoints = {
  myEndpoint: {
    method: 'POST',
    authed: true,
    returns: z.object({
      success: z.boolean(),
      data: z.any(),
    }),
    props: z
      .object({
        userId: z.string(),
        option: z.string().optional(),
      })
      .strict(),
  },
}
```

### 2. Implement Handler

Create handler file in `backend/api/src/`:

```typescript
import {z} from 'zod'
import {APIHandler} from './helpers/endpoint'

export const myEndpoint: APIHandler<'myEndpoint'> = async (props, auth) => {
  const {userId, option} = props

  // Implementation
  return {
    success: true,
    data: {userId},
  }
}
```

### 3. Register Route

Add to `routes.ts`:

```typescript
import {myEndpoint} from './my-endpoint'

const handlers = {
  myEndpoint,
  // ...
}
```

## Authentication

### Authenticated Endpoints

Use the `authed: true` schema property. The auth object is passed to the handler:

```typescript
export const getProfile: APIHandler<'get-profile'> = async (props, auth) => {
  // auth.uid - user ID
  // auth.creds - credentials type
}
```

### Auth Types

- `firebase` - Firebase Auth token
- `session` - Session-based auth

## Database Access

### Using pg-promise

```typescript
import {createSupabaseDirectClient} from 'shared/supabase/init'

const pg = createSupabaseDirectClient()

const result = await pg.oneOrNone<User>('SELECT * FROM users WHERE id = $1', [userId])
```

### Using Supabase Client

But this works only in the front-end.

```typescript
import {db} from 'web/lib/supabase/db'

const {data, error} = await db.from('profiles').select('*').eq('user_id', userId)
```

## Rate Limiting

The API includes built-in rate limiting:

```typescript
export const myEndpoint: APIHandler<'myEndpoint'> = withRateLimit(
  async (props, auth) => {
    // Handler implementation
  },
  {
    name: 'my-endpoint',
    limit: 100,
    windowMs: 60 * 1000, // 1 minute
  },
)
```

## Error Handling

Use `APIError` for consistent error responses:

```typescript
import {APIError} from './helpers/endpoint'

throw APIError(404, 'User not found')
throw APIError(400, 'Invalid input', {field: 'email'})
```

Error codes:

- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

## WebSocket

WebSocket connections are handled for real-time features:

```typescript
// Subscribe to updates
ws.subscribe('user/123', (data) => {
  console.log('User updated:', data)
})

// Unsubscribe
ws.unsubscribe('user/123', callback)
```

Available topics:

- `user/{userId}` - User updates
- `private-user/{userId}` - Private user updates
- `message/{channelId}` - New messages

## Logging

Use the shared logger:

```typescript
import {log} from 'shared/monitoring/log'

log.info('Processing request', {userId: auth.uid})
log.error('Failed to process', error)
```

## Deployment

### Production Deployment

Deployments are automated via GitHub Actions. Push to main triggers deployment:

```bash
# Increment version
# Update package.json version
git add package.json
git commit -m "chore: bump version"
git push origin main
```

### Manual Deployment

```bash
cd backend/api
./deploy-api.sh prod
```

### Server Access

Run in this directory to connect to the API server running as virtual machine in Google Cloud. You can access logs,
files, debug, etc.

```bash
# SSH into production server
cd backend/api
./ssh-api.sh prod
```

Useful commands on server:

```bash
sudo journalctl -u konlet-startup --no-pager -ef  # View logs
sudo docker logs -f $(sudo docker ps -alq)        # Container logs
docker exec -it $(sudo docker ps -alq) sh         # Shell access
docker run -it --rm $(docker images -q | head -n 1) sh
docker rmi -f $(docker images -aq)
```

## Environment Variables

Required secrets (set in Google Cloud Secrets Manager):

| Variable               | Description                  |
| ---------------------- | ---------------------------- |
| `DATABASE_URL`         | PostgreSQL connection string |
| `FIREBASE_PROJECT_ID`  | Firebase project ID          |
| `FIREBASE_PRIVATE_KEY` | Firebase private key         |
| `SUPABASE_SERVICE_KEY` | Supabase service role key    |
| `JWT_SECRET`           | JWT signing secret           |

## Testing

### Writing Unit Tests

```typescript
// tests/unit/my-endpoint.unit.test.ts
import {myEndpoint} from '../my-endpoint'

describe('myEndpoint', () => {
  it('should return success', async () => {
    const result = await myEndpoint({userId: '123'}, mockAuth)
    expect(result.success).toBe(true)
  })
})
```

### Mocking Database

```typescript
const mockPg = {
  oneOrNone: jest.fn().mockResolvedValue({id: '123'}),
}
```

## API Documentation

Full API docs available at:

- Production: https://api.compassmeet.com
- Local: http://localhost:8088 (when running)

Docs are generated from route definitions in `app.ts`.

## See Also

- [Main README](../../README.md)
- [Contributing Guide](../../CONTRIBUTING.md)
- [Shared Backend Utils](../shared/README.md)
- [Database Migrations](../../supabase)

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
| ---- | ---- | ------------ | ----- |
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
