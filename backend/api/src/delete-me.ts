import {debug} from 'common/logger'
import * as admin from 'firebase-admin'
import {deleteUserFiles} from 'shared/firebase-utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getUser} from 'shared/utils'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const deleteMe: APIHandler<'me/delete'> = async ({reasonCategory, reasonDetails}, auth) => {
  const user = await getUser(auth.uid)
  if (!user) {
    throw APIErrors.unauthorized('Your account was not found')
  }
  const userId = user.id
  if (!userId) {
    throw APIErrors.badRequest('Invalid user ID')
  }

  const pg = createSupabaseDirectClient()

  // Store deletion reason before deleting the account
  try {
    await pg.none(
      `
      INSERT INTO deleted_users (username, reason_category, reason_details)
      VALUES ($1, $2, $3)
      `,
      [user.username, reasonCategory, reasonDetails],
    )
  } catch (e) {
    console.error('Error storing deletion reason:', e)
    // Don't fail the deletion if we can't store the reason
  }

  // Remove user data from Supabase
  await pg.none('DELETE FROM users WHERE id = $1', [userId])
  // Should cascade delete in other tables

  // Delete user files from Firebase Storage
  await deleteUserFiles(user.username)

  // Remove user from Firebase Auth
  try {
    const auth = admin.auth()
    await auth.deleteUser(userId)
    debug(`Deleted user ${userId} from Firebase Auth and Supabase`)
  } catch (e) {
    console.error('Error deleting user from Firebase Auth:', e)
  }
}
