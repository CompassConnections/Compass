import {PrivateUser, User} from 'common/user'
import {Row, run, SupabaseClient, tsToMillis} from './utils'

export async function getUserForStaticProps(db: SupabaseClient, username: string) {
  const {data} = await run(db.from('users').select().ilike('username', username))
  return convertUser(data[0] ?? null)
}

export function convertUser(row: Row<'users'>): User
export function convertUser(row: Row<'users'> | null): User | null {
  if (!row) return null

  return {
    ...(row.data as any),
    id: row.id,
    username: row.username,
    name: row.name,
    createdTime: tsToMillis(row.created_time),
  } as User
}

export function convertPrivateUser(row: Row<'private_users'>): PrivateUser
export function convertPrivateUser(row: Row<'private_users'> | null): PrivateUser | null {
  if (!row) return null
  return row.data as PrivateUser
}

export const displayUserColumns = `id,name,username,data->>'avatarUrl' as "avatarUrl",data->'isBannedFromPosting' as "isBannedFromPosting"`
