import {ProfileRow} from 'common/profiles/profile'
import {convertUserToSQL} from 'common/supabase/users'
import {User} from 'common/user'
import {removeUndefinedProps} from 'common/util/object'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {broadcastUpdatedPrivateUser, broadcastUpdatedUser} from 'shared/websockets/helpers'

import {DataUpdate, update, updateData} from './utils'

export const updateProfile = async (user_id: string, updated: Partial<ProfileRow>) => {
  updated = removeUndefinedProps(updated)
  // if (!updated) return
  const fullUpdate = {user_id, ...updated}
  const pg = createSupabaseDirectClient()
  return await update(pg, 'profiles', 'user_id', fullUpdate)
}

export const updateUser = async (id: string, updated: Partial<User>) => {
  updated = removeUndefinedProps(updated)
  if (!updated) return
  const fullUpdate = {id, ...updated}
  const pg = createSupabaseDirectClient()
  const result = await update(pg, 'users', 'id', convertUserToSQL(fullUpdate))
  broadcastUpdatedUser(fullUpdate)
  return result
}

/** only updates data column. do not use for name, username */
export const updateUserData = async (
  db: SupabaseDirectClient,
  id: string,
  updated: DataUpdate<'users'>,
) => {
  updated = removeUndefinedProps(updated)
  if (!updated) return
  const fullUpdate = {id, ...updated}
  const result = await updateData(db, 'users', 'id', fullUpdate)
  broadcastUpdatedUser(fullUpdate as any) // maybe fix
  return result
}

export const updatePrivateUser = async (
  db: SupabaseDirectClient,
  id: string,
  updated: DataUpdate<'private_users'>,
) => {
  updated = removeUndefinedProps(updated)
  if (!updated) return
  const result = await updateData(db, 'private_users', 'id', {id, ...updated})
  broadcastUpdatedPrivateUser(id)
  return result
}
