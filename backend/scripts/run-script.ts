import {initAdmin} from 'shared/init-admin'
import {createSupabaseDirectClient, type SupabaseDirectClient} from 'shared/supabase/init'
import {refreshConfig} from 'common/envs/prod'

export const runScript = async (
  main: (services: {pg: SupabaseDirectClient}) => Promise<any> | any,
  logEnv = false,
) => {
  initAdmin()
  await initEnvVariables()
  if (logEnv) {
    console.debug('[runScript] Environment variables:')
    for (const k of Object.keys(process.env)) console.debug(`${k}=${process.env[k]}`)
  }

  console.debug('[runScript] Creating Supabase client...')
  const pg = createSupabaseDirectClient()

  console.debug('[runScript] Running script...')
  await main({pg})
}

export async function initEnvVariables() {
  const {config} = await import('dotenv')
  config({path: __dirname + '/../../.env'})
  refreshConfig()
}
