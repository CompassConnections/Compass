import {SecretManagerServiceClient} from '@google-cloud/secret-manager'
import {zip} from 'lodash'
import {IS_LOCAL} from "common/envs/constants";
import {refreshConfig} from "common/envs/prod";

// List of secrets that are available to backend (api, functions, scripts, etc.)
// Edit them at:
// https://console.cloud.google.com/security/secret-manager?project=compass-130ba
export const secrets = (
  [
    // 'STRIPE_APIKEY',
    // 'STRIPE_WEBHOOKSECRET',
    'SUPABASE_KEY',
    'SUPABASE_JWT_SECRET',
    'SUPABASE_DB_PASSWORD',
    'TEST_CREATE_USER_KEY',
    'GEODB_API_KEY',
    'RESEND_KEY',
    'COMPASS_API_KEY',
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'DISCORD_WEBHOOK_MEMBERS',
    'DISCORD_WEBHOOK_GENERAL',
    'DISCORD_WEBHOOK_HEALTH',
    'DISCORD_WEBHOOK_REPORTS',
    // Some typescript voodoo to keep the string literal types while being not readonly.
  ] as const
).concat()

type SecretId = (typeof secrets)[number]

// Fetches all secrets from google cloud.
// For deployed google cloud service, no credential is needed.
// For local and Vercel deployments: requires credentials json object.
export const getSecrets = async (credentials?: any, ...ids: SecretId[]) => {
  if (!ids.length && IS_LOCAL) return {}

  // console.debug('Fetching secrets...')
  let client: SecretManagerServiceClient
  if (credentials) {
    const projectId = credentials['project_id']
    client = new SecretManagerServiceClient({
      credentials,
      projectId,
    })
  } else {
    client = new SecretManagerServiceClient()
  }
  const projectId = await client.getProjectId()

  const secretIds = ids.length > 0 ? ids : secrets

  console.debug('secretIds', secretIds)

  const fullSecretNames = secretIds.map(
    (secret: string) =>
      `${client.projectPath(projectId)}/secrets/${secret}/versions/latest`
  )

  const secretResponses = await Promise.all(
    fullSecretNames.map((name) =>
      client.accessSecretVersion({
        name,
      })
    )
  )
  const secretValues = secretResponses.map(([response]) =>
    response.payload!.data!.toString()
  )
  const pairs = zip(secretIds, secretValues) as [string, string][]
  return Object.fromEntries(pairs)
}

// Fetches all secrets and loads them into process.env.
// Useful for running random backend code.
export const loadSecretsToEnv = async (credentials?: any) => {
  const allSecrets = await getSecrets(credentials)
  for (const [key, value] of Object.entries(allSecrets)) {
    if (key && value) {
      process.env[key] = value
      // console.debug(key, value)
    }
  }
  refreshConfig()
}

