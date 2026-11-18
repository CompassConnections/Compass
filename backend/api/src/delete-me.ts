import {FOLLOW_UP_EMAIL_DELETION_REASON} from 'common/deletion'
import {debug} from 'common/logger'
import * as admin from 'firebase-admin'
import {deleteUserFiles} from 'shared/firebase-utils'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getPrivateUser, getUser} from 'shared/utils'

import {APIErrors, APIHandler} from './helpers/endpoint'
import {
  insertTestimonial,
  notifyTestimonialSubmitted,
  TestimonialQueryRow,
} from './helpers/testimonials'

export const deleteMe: APIHandler<'me/delete'> = async (
  {reasonCategory, reasonDetails, testimonial, followUpEmailConsent},
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

  // Kept only when they ticked the box asking for one follow-up message, and only for the reason the
  // box is offered on. Read before the delete below, which takes the private row with it.
  let followUpEmail: string | null = null
  if (followUpEmailConsent && reasonCategory === FOLLOW_UP_EMAIL_DELETION_REASON) {
    try {
      followUpEmail = (await getPrivateUser(userId))?.email ?? null
    } catch (e) {
      console.error('Error reading email for the deletion follow-up:', e)
    }
  }

  // Store deletion reason before deleting the account
  try {
    await pg.none(
      `
      INSERT INTO deleted_users (username, reason_category, reason_details, follow_up_email)
      VALUES ($1, $2, $3, $4)
      `,
      [user.username, reasonCategory, reasonDetails, followUpEmail],
    )
  } catch (e) {
    console.error('Error storing deletion reason:', e)
    // Don't fail the deletion if we can't store the reason
  }

  // Remove user data from Supabase
  await pg.tx(async (tx) => {
    // An array, so no foreign key can clear it. Counted so the alert can still say that someone it
    // named is gone. In the same transaction so the account cannot go while its id stays behind.
    await tx.none(
      `update search_alert_sends
       set matched_user_ids    = array_remove(matched_user_ids, $1),
           deleted_match_count = deleted_match_count + 1
       where $1 = any (matched_user_ids)`,
      [userId],
    )
    await tx.none('DELETE FROM users WHERE id = $1', [userId])
    // Should cascade delete in other tables
  })

  // Delete user files from Firebase Storage
  await deleteUserFiles(user.username, userId)

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
