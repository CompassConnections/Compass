import {initAdmin} from 'shared/init-admin'
import {createSupabaseDirectClient, type SupabaseDirectClient} from 'shared/supabase/init'
import {refreshConfig} from 'common/envs/prod'
import {debug} from 'common/logger'

export const runScript = async (
  main: (services: {pg: SupabaseDirectClient}) => Promise<any> | any,
  logEnv = false,
) => {
  initAdmin()
  await initEnvVariables()
  if (logEnv) {
    debug('[runScript] Environment variables:')
    for (const k of Object.keys(process.env)) debug(`${k}=${process.env[k]}`)
  }

  debug('[runScript] Creating Supabase client...')
  const pg = createSupabaseDirectClient()

  debug('[runScript] Running script...')
  await main({pg})

  process.exit(0)
}

export async function initEnvVariables() {
  const {config} = await import('dotenv')
  config({path: __dirname + '/../../.env'})
  refreshConfig()
}
