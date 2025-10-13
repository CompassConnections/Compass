import {getUser} from 'shared/utils'
import {APIError, APIHandler} from './helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import * as admin from "firebase-admin";
import {deleteUserFiles} from "shared/firebase-utils";

export const deleteMe: APIHandler<'me/delete'> = async (body, auth) => {
  const {username} = body
  const user = await getUser(auth.uid)
  if (!user) {
    throw new APIError(401, 'Your account was not found')
  }
  if (user.username != username) {
    throw new APIError(
      400,
      `Incorrect username. You are logged in as ${user.username}. Are you sure you want to delete this account?`
    )
  }
  const userId = user.id
  if (!userId) {
    throw new APIError(400, 'Invalid user ID')
  }

  // Remove user data from Supabase
  const pg = createSupabaseDirectClient()
  await pg.none('DELETE FROM users WHERE id = $1', [userId])
  await pg.none('DELETE FROM private_users WHERE id = $1', [userId])
  await pg.none('DELETE FROM profiles WHERE user_id = $1', [userId])
  await pg.none('DELETE FROM bookmarked_searches WHERE creator_id = $1', [userId])
  await pg.none('DELETE FROM love_compatibility_answers WHERE creator_id = $1', [userId])
  // May need to also delete from other tables in the future (such as messages, compatibility responses, etc.)

  // Delete user files from Firebase Storage
  await deleteUserFiles(user.username)

  // Remove user from Firebase Auth
  try {
    const auth = admin.auth()
    await auth.deleteUser(userId)
    console.debug(`Deleted user ${userId} from Firebase Auth and Supabase`)
  } catch (e) {
    console.error('Error deleting user from Firebase Auth:', e)
  }
}
