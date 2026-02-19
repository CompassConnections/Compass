import {User} from 'common/user'
import {SupabaseDirectClient} from 'shared/supabase/init'
import {broadcastUpdatedPrivateUser, broadcastUpdatedUser} from 'shared/websockets/helpers'

import {DataUpdate, updateData} from './utils'

/** only updates data column. do not use for name, username */
export const updateUser = async (db: SupabaseDirectClient, id: string, update: Partial<User>) => {
  const fullUpdate = {id, ...update}
  await updateData(db, 'users', 'id', fullUpdate)
  broadcastUpdatedUser(fullUpdate)
}

export const updatePrivateUser = async (
  db: SupabaseDirectClient,
  id: string,
  update: DataUpdate<'private_users'>,
) => {
  await updateData(db, 'private_users', 'id', {id, ...update})
  broadcastUpdatedPrivateUser(id)
}
