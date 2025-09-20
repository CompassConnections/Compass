import {initAdmin} from 'shared/init-admin'
import {loadSecretsToEnv} from 'common/secrets'
import {createSupabaseDirectClient, type SupabaseDirectClient,} from 'shared/supabase/init'
import {getServiceAccountCredentials} from "shared/firebase-utils";

initAdmin()

export const runScript = async (
  main: (services: { pg: SupabaseDirectClient }) => Promise<any> | any
) => {
  const credentials = getServiceAccountCredentials()

  await loadSecretsToEnv(credentials)

  const pg = createSupabaseDirectClient()
  await main({pg})

  process.exit()
}
