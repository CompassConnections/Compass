import pgPromise, {IDatabase, ITask} from 'pg-promise'
import {log, metrics} from '../utils'
import {IClient, type IConnectionParameters} from 'pg-promise/typescript/pg-subset'
import {HOUR_MS} from 'common/util/time'
import {METRICS_INTERVAL_MS} from 'shared/monitoring/metric-writer'
import {getMonitoringContext} from 'shared/monitoring/context'
import {ENV_CONFIG} from 'common/envs/constants'

export {SupabaseClient} from 'common/supabase/utils'

export const pgp = pgPromise({
  error(err: any, e: pgPromise.IEventContext) {
    // Read more: https://node-postgres.com/apis/pool#error
    log.error(`pgPromise background error: ${err?.detail}`, {
      error: err,
      event: e,
    })
  },
  query() {
    const ctx = getMonitoringContext()
    if (ctx?.endpoint) {
      metrics.inc('pg/query_count', {endpoint: ctx.endpoint})
    } else if (ctx?.job) {
      metrics.inc('pg/query_count', {job: ctx.job})
    } else {
      metrics.inc('pg/query_count')
    }
  },
})

// This loses precision for large numbers (> 2^53). Beware fetching int8 columns with large values.
pgp.pg.types.setTypeParser(20, (value: any) => parseInt(value, 10))
pgp.pg.types.setTypeParser(1700, parseFloat) // Type Id 1700 = NUMERIC

export type SupabaseTransaction = ITask<object>
export type SupabaseDirectClient = IDatabase<object, IClient> | SupabaseTransaction

export function getInstanceId() {
  return ENV_CONFIG.supabaseInstanceId
}

export function getSupabasePwd() {
  return ENV_CONFIG.supabasePwd
}

const newClient = (
  props: {
    instanceId?: string
    password?: string
  } & IConnectionParameters,
) => {
  const {instanceId, password, ...settings} = props

  // If DATABASE_URL is provided (e.g., for E2E tests), prefer connecting directly to that Postgres instance.
  const databaseUrl = process.env.DATABASE_URL
  if (process.env.DATABASE_URL) {
    console.log('Creating direct Postgres client (DATABASE_URL)')
  } else {
    console.log('Creating Supabase direct client')
  }

  const config: any = databaseUrl
    ? {
        // Use connection string for local/dev Postgres
        connectionString: databaseUrl,
        // Local Postgres typically doesn't need SSL
        ssl: false,
        ...settings,
      }
    : {
        // Default: connect to Supabase's pooled Postgres
        // This host is IPV4 compatible, for the google cloud VM
        host: 'aws-1-us-west-1.pooler.supabase.com',
        port: 5432,
        user: `postgres.${instanceId}`,
        password: password,
        database: 'postgres',
        pool_mode: 'session',
        ssl: {rejectUnauthorized: false},
        family: 4, // <- forces IPv4
        ...settings,
      }

  // console.debug(config)

  return pgp(config)
}

// Use one connection to avoid WARNING: Creating a duplicate database object for the same connection.
let pgpDirect: IDatabase<object, IClient> | null = null

export function createSupabaseDirectClient(instanceId?: string, password?: string) {
  if (pgpDirect) return pgpDirect
  const hasDatabaseUrl = !!process.env.DATABASE_URL
  // Only enforce Supabase credentials when not using DATABASE_URL
  instanceId = instanceId ?? getInstanceId()
  if (!hasDatabaseUrl && !instanceId) {
    throw new Error(
      "Can't connect to Supabase; no process.env.SUPABASE_INSTANCE_ID and no instance ID in config.",
    )
  }
  password = password ?? getSupabasePwd()
  if (!hasDatabaseUrl && !password) {
    throw new Error("Can't connect to Supabase; no process.env.SUPABASE_DB_PASSWORD.")
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
    metrics.set('pg/pool_connections', pool.waitingCount, {state: 'waiting'})
    metrics.set('pg/pool_connections', pool.idleCount, {state: 'idle'})
    metrics.set('pg/pool_connections', pool.expiredCount, {state: 'expired'})
    metrics.set('pg/pool_connections', pool.totalCount, {state: 'total'})
  }, METRICS_INTERVAL_MS)
  return (pgpDirect = client)
}

let shortTimeoutPgpClient: IDatabase<object, IClient> | null = null
export const createShortTimeoutDirectClient = () => {
  if (shortTimeoutPgpClient) return shortTimeoutPgpClient
  shortTimeoutPgpClient = newClient({
    instanceId: getInstanceId(),
    password: getSupabasePwd(),
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
