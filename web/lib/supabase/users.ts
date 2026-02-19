import type {DisplayUser} from 'common/api/user-types'
import {APIError} from 'common/api/utils'
import {run} from 'common/supabase/utils'
import {MONTH_MS} from 'common/util/time'
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
  const {data} = await run(
    db
      .from('users')
      .select(`id, name, username, data->avatarUrl, data->isBannedFromPosting`)
      .in('id', userIds)
  )

  return data as unknown as DisplayUser[]
}

export async function getProfilesCreations() {
  const {data} = await run(
    db.from('profiles').select(`id, created_time`).order('created_time')
  )
  return data
}

export async function getCompletedProfilesCreations() {
  const {data} = await run(
    db
      .from('profiles')
      .select(`id, created_time`)
      .or(`bio_length.gte.100,occupation_title.not.is.null`)
      .order('created_time')
  )
  return data
}

export async function getCount(table: string) {
  if (table == 'private_user_messages') {
    const result = await api('get-messages-count')
    return result.count
  }
  if (table == 'active_members') {
    const {count} = await run(
      db
        .from('user_activity')
        .select('*', {count: 'exact', head: true})
        .gt('last_online_time', new Date(Date.now() - MONTH_MS).toISOString()) // last month
    )
    return count
  }
  const {count} = await run(
    db.from(table).select('*', {count: 'exact', head: true})
  )
  return count
}

// export async function getNumberProfiles() {
//   return await getCount('profiles');
// }
