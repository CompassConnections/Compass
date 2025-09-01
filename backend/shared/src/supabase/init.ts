import pgPromise from 'pg-promise'
export { SupabaseClient } from 'common/supabase/utils'
import { DEV_CONFIG } from 'common/envs/dev'
import { PROD_CONFIG } from 'common/envs/prod'
import { metrics, log, isProd } from '../utils'
import { IDatabase, ITask } from 'pg-promise'
import { IClient } from 'pg-promise/typescript/pg-subset'
import { HOUR_MS } from 'common/util/time'
import { METRICS_INTERVAL_MS } from 'shared/monitoring/metric-writer'
import { getMonitoringContext } from 'shared/monitoring/context'
import { type IConnectionParameters } from 'pg-promise/typescript/pg-subset'

export const pgp = pgPromise({
  error(err: any, e: pgPromise.IEventContext) {
    // Read more: https://node-postgres.com/apis/pool#error
    log.error('pgPromise background error', {
      error: err,
      event: e,
    })
  },
  query() {
    const ctx = getMonitoringContext()
    if (ctx?.endpoint) {
      metrics.inc('pg/query_count', { endpoint: ctx.endpoint })
    } else if (ctx?.job) {
      metrics.inc('pg/query_count', { job: ctx.job })
    } else {
      metrics.inc('pg/query_count')
    }
  },
})

// This loses precision for large numbers (> 2^53). Beware fetching int8 columns with large values.
pgp.pg.types.setTypeParser(20, (value: any) => parseInt(value, 10))
pgp.pg.types.setTypeParser(1700, parseFloat) // Type Id 1700 = NUMERIC

export type SupabaseTransaction = ITask<{}>
export type SupabaseDirectClient = IDatabase<{}, IClient> | SupabaseTransaction

export function getInstanceId() {
  return (
    process.env.SUPABASE_INSTANCE_ID ??
    (isProd() ? PROD_CONFIG.supabaseInstanceId : DEV_CONFIG.supabaseInstanceId)
  )
}

const newClient = (
  props: {
    instanceId?: string
    password?: string
  } & IConnectionParameters
) => {
  const { instanceId, password, ...settings } = props

  const config = {
    host: 'db.ltzepxnhhnrnvovqblfr.supabase.co',
    port: 5432,
    user: `postgres`,
    password: password,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
    family: 4, // <- forces IPv4
    ...settings,
  }

  console.log(config)

  return pgp(config)
}

// Use one connection to avoid WARNING: Creating a duplicate database object for the same connection.
let pgpDirect: IDatabase<{}, IClient> | null = null
export function createSupabaseDirectClient(
  instanceId?: string,
  password?: string
) {
  if (pgpDirect) return pgpDirect
  instanceId = instanceId ?? getInstanceId()
  if (!instanceId) {
    throw new Error(
      "Can't connect to Supabase; no process.env.SUPABASE_INSTANCE_ID and no instance ID in config."
    )
  }
  password = password ?? process.env.SUPABASE_DB_PASSWORD
  if (!password) {
    throw new Error(
      "Can't connect to Supabase; no process.env.SUPABASE_DB_PASSWORD."
    )
  }
  const client = newClient({
    instanceId: getInstanceId(),
    password: password,
    query_timeout: HOUR_MS, // mqp: debugging scheduled job behavior
    max: 20,
  })
  const pool = client.$pool
  pool.on('connect', () => metrics.inc('pg/connections_established'))
  pool.on('remove', () => metrics.inc('pg/connections_terminated'))
  pool.on('acquire', () => metrics.inc('pg/connections_acquired'))
  pool.on('release', () => metrics.inc('pg/connections_released'))
  setInterval(() => {
    metrics.set('pg/pool_connections', pool.waitingCount, { state: 'waiting' })
    metrics.set('pg/pool_connections', pool.idleCount, { state: 'idle' })
    metrics.set('pg/pool_connections', pool.expiredCount, { state: 'expired' })
    metrics.set('pg/pool_connections', pool.totalCount, { state: 'total' })
  }, METRICS_INTERVAL_MS)
  return (pgpDirect = client)
}

let shortTimeoutPgpClient: IDatabase<{}, IClient> | null = null
export const createShortTimeoutDirectClient = () => {
  if (shortTimeoutPgpClient) return shortTimeoutPgpClient
  shortTimeoutPgpClient = newClient({
    instanceId: getInstanceId(),
    password: process.env.SUPABASE_DB_PASSWORD,
    query_timeout: 1000 * 30,
    max: 20,
  })
  return shortTimeoutPgpClient
}

export const SERIAL_MODE = new pgp.txMode.TransactionMode({
  tiLevel: pgp.txMode.isolationLevel.serializable,
  readOnly: false,
  deferrable: false,
})
