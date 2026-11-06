import {createSupabaseDirectClient} from 'shared/supabase/init'

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

export async function seedUser(id: string) {
  const pg = getTestDb()
  await pg.none(`insert into users (id, name, username, data) values ($1, $2, $3, '{}')`, [
    id,
    `Name ${id}`,
    `username_${id}`,
  ])
  await pg.none(`insert into private_users (id, data) values ($1, '{}')`, [id])
  await pg.none(`insert into profiles (user_id) values ($1)`, [id])
}
