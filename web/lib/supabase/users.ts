import { db } from './db'
import { run } from 'common/supabase/utils'
import { APIError, api } from 'web/lib/api'
import { unauthedApi } from 'common/util/api'
import type { DisplayUser } from 'common/api/user-types'
export type { DisplayUser }

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
  return unauthedApi('user/by-id/:id/lite', { id })
}

export async function getUserByUsername(username: string) {
  return unauthedApi('user/:username/lite', { username })
}

export async function getFullUserByUsername(username: string) {
  return unauthedApi('user/:username', { username })
}

export async function getFullUserById(id: string) {
  return unauthedApi('user/by-id/:id', { id })
}

export async function searchUsers(prompt: string, limit: number) {
  return unauthedApi('search-users', { term: prompt, limit: limit })
}

export async function getDisplayUsers(userIds: string[]) {
  const { data } = await run(
    db
      .from('users')
      .select(`id, name, username, data->avatarUrl, data->isBannedFromPosting`)
      .in('id', userIds)
  )

  return data as unknown as DisplayUser[]
}
