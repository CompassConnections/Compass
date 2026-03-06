import {PrivateUser, User} from 'common/user'
import {removeUndefinedProps} from 'common/util/object'

import {millisToTs, Row, run, SupabaseClient, tsToMillis} from './utils'

export async function getUserForStaticProps(db: SupabaseClient, username: string) {
  const {data} = await run(db.from('users').select().ilike('username', username))
  return convertUser(data[0] ?? null)
}

function toDb(row: any): any {
  return {
    ...(row.data as any),
    id: row.id,
    username: row.username,
    name: row.name,
    avatarUrl: row.avatar_url,
    isBannedFromPosting: row.is_banned_from_posting,
    createdTime: row.created_time ? tsToMillis(row.created_time) : undefined,
  }
}

// From DB to typescript
export function convertUser(row: Row<'users'>): User
export function convertUser(row: Row<'users'> | null): User | null {
  if (!row) return null
  return toDb(row)
}

export function convertPartialUser(row: Partial<Row<'users'>>): Partial<User> {
  return removeUndefinedProps(toDb(row))
}

// Reciprocal of convertUser, from typescript to DB
export function convertUserToDb(user: Partial<User>): Partial<Row<'users'>>
export function convertUserToDb(user: Partial<User> | null): Partial<Row<'users'>> | null {
  if (!user) return null

  return removeUndefinedProps({
    id: user.id,
    username: user.username,
    name: user.name,
    avatar_url: user.avatarUrl,
    is_banned_from_posting: user.isBannedFromPosting,
    created_time: millisToTs(user.createdTime),
  })
}

export function convertPrivateUser(row: Row<'private_users'>): PrivateUser
export function convertPrivateUser(row: Row<'private_users'> | null): PrivateUser | null {
  if (!row) return null
  return row.data as PrivateUser
}

export const displayUserColumns = `id,name,username, avatar_url as "avatarUrl",is_banned_from_posting as "isBannedFromPosting"`
