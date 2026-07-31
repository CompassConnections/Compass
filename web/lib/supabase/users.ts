import type {DisplayUser} from 'common/api/user-types'
import {APIError} from 'common/api/utils'
import {convertPartialUser} from 'common/supabase/users'
import {run, TableName} from 'common/supabase/utils'
import {api} from 'web/lib/api'

import {db} from './db'

export type {DisplayUser}

export async function getUserSafe(userId: string) {
  try {
    return await getFullUserById(userId)
  } catch (e) {
    if (e instanceof APIError && e.code === 404) {
      return null
    }
    throw e
  }
}

export async function getPrivateUserSafe() {
  try {
    return await api('me/private')
  } catch (_e) {
    return null
  }
}

// export async function getUserById(id: string) {
//   return unauthedApi('user/by-id/:id/lite', {id})
// }

// export async function getUserByUsername(username: string) {
//   return unauthedApi('user/:username/lite', {username})
// }
//
// export async function getFullUserByUsername(username: string) {
//   return unauthedApi('user/:username', {username})
// }

export async function getFullUserById(id: string) {
  return api('user/by-id/:id', {id})
}

export async function searchUsers(prompt: string, limit: number) {
  return api('search-users', {term: prompt, limit: limit})
}

export async function getDisplayUsers(userIds: string[]) {
  // Direct SELECT on `users` is revoked from the anon/authenticated roles (bulk-read cap). The capped
  // get_display_users() function requires ids and returns at most 100 rows.
  const {data} = await run(db.rpc('get_display_users' as any, {ids: userIds}))

  return (data as any[]).map(convertPartialUser) as unknown as DisplayUser[]
}

// Member-growth series now comes pre-aggregated (daily totals) from the cached /stats endpoint —
// see `Stats.memberGrowth` and backend/api/src/stats.ts. The client no longer pulls one row per
// profile, so nothing here needs an unbounded read of the profiles table.

// Active-member count moved to the cached /stats endpoint (`Stats.activeMembers`) — the client no longer
// reads the whole user_activity table, whose anon SELECT grant is now revoked.
export async function getCount(table: TableName) {
  if (table == 'private_user_messages') {
    const result = await api('get-messages-count')
    return result.count
  }
  if (table == 'private_user_message_channels') {
    // Read via the service-role API: RLS restricts direct PostgREST reads of this table to
    // channel members, so a client-side count would only see the caller's own channels.
    const result = await api('get-channels-count')
    return result.count
  }
  const {count} = await run(db.from(table as any).select('*', {count: 'exact', head: true}))
  return count
}

// export async function getNumberProfiles() {
//   return await getCount('profiles');
// }
