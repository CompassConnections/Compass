import { getLocalEnv, initAdmin } from 'shared/init-admin'
import { getServiceAccountCredentials, loadSecretsToEnv } from 'common/secrets'
import {
  createSupabaseDirectClient,
  type SupabaseDirectClient,
} from 'shared/supabase/init'

initAdmin()

export const runScript = async (
  main: (services: { pg: SupabaseDirectClient }) => Promise<any> | any
) => {
  const env = getLocalEnv()
  const credentials = getServiceAccountCredentials(env)

  await loadSecretsToEnv(credentials)

  const pg = createSupabaseDirectClient()
  await main({ pg })

  process.exit()
}
