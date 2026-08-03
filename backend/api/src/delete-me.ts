import {debug} from 'common/logger'
import * as admin from 'firebase-admin'
import {deleteUserFiles} from 'shared/firebase-utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getUser} from 'shared/utils'

import {APIErrors, APIHandler} from './helpers/endpoint'
import {
  insertTestimonial,
  notifyTestimonialSubmitted,
  TestimonialQueryRow,
} from './helpers/testimonials'

export const deleteMe: APIHandler<'me/delete'> = async (
  {reasonCategory, reasonDetails, testimonial},
  auth,
) => {
  const user = await getUser(auth.uid)
  if (!user) {
    throw APIErrors.unauthorized('Your account was not found')
  }
  const userId = user.id
  if (!userId) {
    throw APIErrors.badRequest('Invalid user ID')
  }

  const pg = createSupabaseDirectClient()

  // A parting testimonial, written on the way out. Saved before anything is destroyed, and best-effort
  // for the same reason the reason log is: someone who has decided to leave must not be held hostage
  // by a failing insert. The `on delete set null` on author_id is what lets it outlive the row below.
  let testimonialRow: TestimonialQueryRow | null = null
  if (testimonial) {
    try {
      testimonialRow = await insertTestimonial(pg, {
        authorId: userId,
        authorName: user.name,
        authorUsername: user.username,
        authorAvatarUrl: user.avatarUrl ?? null,
        body: testimonial.body,
        headline: testimonial.headline,
        rating: testimonial.rating,
        showAuthor: testimonial.showAuthor,
        source: 'deletion_survey',
      })
    } catch (e) {
      console.error('Error storing parting testimonial:', e)
    }
  }

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

  // Bound to a const so the narrowing survives into the closure below.
  const row = testimonialRow
  if (!row) return

  // After the response, so a slow or down Discord cannot make a deletion look like it failed to the
  // person who just asked for it.
  return {
    result: undefined,
    continue: async () => {
      try {
        await notifyTestimonialSubmitted(row, {fromDeletion: true})
      } catch (e) {
        console.error('Failed to send discord testimonial notification', e)
      }
    },
  }
}
