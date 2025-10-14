import {db} from './db'
import {run} from 'common/supabase/utils'
import {api, APIError} from 'web/lib/api'
import {unauthedApi} from 'common/util/api'
import type {DisplayUser} from 'common/api/user-types'
import {MIN_BIO_LENGTH} from "common/constants";
import {MONTH_MS} from "common/util/time";

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
  } catch (e) {
    return null
  }
}

export async function getUserById(id: string) {
  return unauthedApi('user/by-id/:id/lite', {id})
}

export async function getUserByUsername(username: string) {
  return unauthedApi('user/:username/lite', {username})
}

export async function getFullUserByUsername(username: string) {
  return unauthedApi('user/:username', {username})
}

export async function getFullUserById(id: string) {
  return unauthedApi('user/by-id/:id', {id})
}

export async function searchUsers(prompt: string, limit: number) {
  return unauthedApi('search-users', {term: prompt, limit: limit})
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
    db.from('profiles')
      .select(`id, created_time`)
      .order('created_time')
  )
  return data
}

export async function getProfilesWithBioCreations() {
  const {data} = await run(
    db
      .from('profiles')
      .select(`id, created_time`)
      .gt('bio_length', MIN_BIO_LENGTH)
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
    return count;
  }
  const {count} = await run(
    db
      .from(table)
      .select('*', {count: 'exact', head: true})
  )
  return count;
}

// export async function getNumberProfiles() {
//   return await getCount('profiles');
// }
