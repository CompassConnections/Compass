import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {setProfileOptions} from 'api/update-options'
import {trimStrings} from 'common/parsing'
import {type Row} from 'common/supabase/utils'
import {tryCatch} from 'common/util/try-catch'
import {recomputeCompatibilityScoresForUser} from 'shared/compatibility/compute-scores'
import {removePinnedUrlFromPhotoUrls} from 'shared/profiles/parse-photos'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {updateProfile, updateUser} from 'shared/supabase/users'
import {log} from 'shared/utils'

/**
 * Update Profile API Handler
 *
 * Updates an existing user's profile information in the database.
 * Performs validation and sanitization on input data before applying changes.
 *
 * Features:
 * - Trims whitespace from string fields
 * - Handles avatar/photo updates
 * - Updates related user data when profile photo changes
 * - Proper error handling with rollback support
 *
 * @param parsedBody - Profile data to update (validated against schema)
 * @param auth - Authenticated user information
 * @returns Updated profile data
 * @throws {APIError} 404 if profile doesn't exist, 500 for database errors
 */
export const updateProfileEndpoint: APIHandler<'update-profile'> = async (parsedBody, auth) => {
  trimStrings(parsedBody)
  const pg = createSupabaseDirectClient()

  const {data: existingProfile} = await tryCatch(
    pg.oneOrNone<Row<'profiles'>>('select * from profiles where user_id = $1', [auth.uid]),
  )

  if (!existingProfile) {
    throw APIErrors.notFound('Profile not found')
  }

  log('Updating profile', {userId: auth.uid, parsedBody})

  await removePinnedUrlFromPhotoUrls(parsedBody)

  if (parsedBody.pinned_url) {
    await updateUser(auth.uid, {avatarUrl: parsedBody.pinned_url})
  }

  // Interests, causes and work live in their own join tables, not on `profiles`, so they are split
  // off and written through `setProfileOptions` in the same transaction as the row. They used to be
  // separate `update-options` calls from the profile form, and since every one of those rebuilt the
  // compatibility cache after its response, one save ran the recompute four times in parallel.
  const {interests, causes, work, ...profileFields} = parsedBody
  const {data, error} = await tryCatch(
    pg.tx(async (tx) => {
      const updated = await updateProfile(auth.uid, profileFields, tx)
      if (interests !== undefined)
        await setProfileOptions(tx, existingProfile.id, auth.uid, 'interests', interests)
      if (causes !== undefined)
        await setProfileOptions(tx, existingProfile.id, auth.uid, 'causes', causes)
      if (work !== undefined)
        await setProfileOptions(tx, existingProfile.id, auth.uid, 'work', work)
      return updated
    }),
  )

  if (error) {
    log('Error updating profile', error)
    throw APIErrors.internalServerError('Error updating profile')
  }

  // Most profile fields feed the compatibility score (common/profiles/compatibility-factors), so the
  // pair cache is rebuilt for this member after the response, as answering a prompt does.
  return {
    result: data,
    continue: async () => {
      await recomputeCompatibilityScoresForUser(auth.uid)
    },
  }
}
