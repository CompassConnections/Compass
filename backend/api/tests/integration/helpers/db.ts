import {createSupabaseDirectClient, SupabaseTransaction} from 'shared/supabase/init'
import {insert} from 'shared/supabase/utils'

const INTEGRATION_DB = 'compass_integration'

export const getTestDb = () => createSupabaseDirectClient()

/**
 * Empties every public table. This also clears the rows the migrations insert into `banned_networks`,
 * since that table has a foreign key to `users`, so a test must seed everything it relies on.
 */
export async function resetDb() {
  const pg = getTestDb()

  // Asks Postgres rather than trusting the connection string: this must never run anywhere else.
  const {current_database: connectedTo} = await pg.one('select current_database()')
  if (connectedTo !== INTEGRATION_DB) {
    throw new Error(`Refusing to truncate "${connectedTo}": expected "${INTEGRATION_DB}"`)
  }

  const tables = await pg.map(
    `select tablename from pg_tables where schemaname = 'public'`,
    [],
    (row) => row.tablename as string,
  )
  await pg.none('truncate table $1:name restart identity cascade', [tables])
}

type SeedUserOptions = {
  /** Columns on `users`, such as `is_banned_from_posting`. */
  user?: Record<string, unknown>
  /** Columns on `profiles`, such as `visibility`. */
  profile?: Record<string, unknown>
}

export async function seedUser(id: string, {user, profile}: SeedUserOptions = {}) {
  const pg = getTestDb()
  await insert(pg, 'users', {
    id,
    name: `Name ${id}`,
    username: `username_${id}`,
    data: {},
    ...user,
  } as any)
  await insert(pg, 'private_users', {
    id,
    data: {id, blockedUserIds: [], blockedByUserIds: []},
  } as any)
  await insert(pg, 'profiles', {user_id: id, ...profile} as any)
}

/** Runs `fn` as the role the browser's anon key connects with, so RLS and grants apply. */
export const asAnon = <T>(fn: (tx: SupabaseTransaction) => Promise<T>) =>
  getTestDb().tx(async (tx) => {
    await tx.none('set local role anon')
    return fn(tx)
  })
