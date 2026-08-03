import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {isAdminId} from 'common/envs/constants'
import {getLookingForSearchFilters, OUTREACH_SEARCH_NAME} from 'common/outreach/outreach'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Create the saved search a member never got around to creating, from the preferences they already
 * put on their profile.
 *
 * Nothing here is invented on their behalf: age range, genders and connection goal come straight off
 * their own profile, so the alerts they start getting are for the people they said they were looking
 * for. Members who stated no preferences get nothing — see `getLookingForSearchFilters`.
 *
 * No location filter, on purpose. `city` is where they live, not the radius they would search, and
 * guessing one would silently hide people they asked to see.
 */
export const createOutreachSearch: APIHandler<'create-outreach-search'> = async (props, auth) => {
  if (!isAdminId(auth.uid)) throw APIErrors.forbidden('Admin only')

  const {userId} = props
  const pg = createSupabaseDirectClient()

  const profile = await pg.oneOrNone<{
    pref_age_min: number | null
    pref_age_max: number | null
    pref_gender: string[] | null
    pref_relation_styles: string[] | null
  }>(
    `select pref_age_min, pref_age_max, pref_gender, pref_relation_styles
     from profiles
     where user_id = $(userId)`,
    {userId},
  )
  if (!profile) throw APIErrors.notFound('No profile for that member')

  const filters = getLookingForSearchFilters({
    prefAgeMin: profile.pref_age_min,
    prefAgeMax: profile.pref_age_max,
    prefGender: profile.pref_gender,
    prefRelationStyles: profile.pref_relation_styles,
  })
  if (!filters) {
    throw APIErrors.badRequest('They have not said who they are looking for')
  }

  // The dashboard only offers this for members with no search, but it reads a snapshot — checking
  // again here keeps a stale page from stacking duplicate alerts on someone.
  const existing = await pg.oneOrNone(
    `select 1 from bookmarked_searches where creator_id = $(userId) limit 1`,
    {userId},
  )
  if (existing) throw APIErrors.conflict('They already have a saved search')

  const {id} = await pg.one<{id: number}>(
    `insert into bookmarked_searches (creator_id, search_filters, location, search_name)
     values ($(userId), $(filters), null, $(name))
     returning id`,
    {userId, filters, name: OUTREACH_SEARCH_NAME},
  )

  return {searchId: Number(id)}
}
