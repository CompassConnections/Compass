import {PrivateUser, User} from 'common/user'
import {removeUndefinedProps} from 'common/util/object'

import {
  convertObjectToSQLRow,
  convertSQLtoTS,
  millisToTs,
  Row,
  run,
  SupabaseClient,
  tsToMillis,
} from './utils'

export async function getUserForStaticProps(db: SupabaseClient, username: string) {
  const {data} = await run(db.from('users').select().ilike('username', username))
  return convertUser(data[0] ?? null)
}

function toTS(row: any): any {
  return convertSQLtoTS<'users', User>(row, {
    created_time: tsToMillis as any,
  })
}

// From DB to typescript
export function convertUser(row: Row<'users'>): User
export function convertUser(row: Row<'users'> | null): User | null {
  if (!row) return null
  return toTS(row)
}

export function convertPartialUser(row: Partial<Row<'users'>>): Partial<User> {
  return removeUndefinedProps(toTS(row))
}

// Reciprocal of convertUser, from typescript to DB
export function convertUserToSQL(user: Partial<User>): Partial<Row<'users'>>
export function convertUserToSQL(user: Partial<User> | null): Partial<Row<'users'>> | null {
  if (!user) return null

  return convertObjectToSQLRow<'users', Partial<Row<'users'>>>(user, {
    created_time: millisToTs as any,
  })
}

export function convertPrivateUser(row: Row<'private_users'>): PrivateUser
export function convertPrivateUser(row: Row<'private_users'> | null): PrivateUser | null {
  if (!row) return null
  return row.data as PrivateUser
}

export const displayUserColumns = `id,name,username, avatar_url as "avatarUrl",is_banned_from_posting as "isBannedFromPosting"`
