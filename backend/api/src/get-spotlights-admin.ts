import {APIHandler} from 'api/helpers/endpoint'
import {
  SPOTLIGHT_COLUMNS_PREFIXED,
  SPOTLIGHT_SOURCE_SELECT,
  SpotlightAdminQueryRow,
  SpotlightSourceRow,
  toAdminSpotlight,
} from 'api/helpers/spotlights'
import {SpotlightCandidate} from 'common/profiles/spotlights'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Everything the admin page needs, in one call: every spotlight in any state, and every consenting
 * member who does not have one yet.
 *
 * Two queries rather than two endpoints — the page always wants both, and splitting them would put a
 * loading spinner on half the screen for no benefit. See the repo convention against multiple calls
 * where one transaction will do.
 */
export const getSpotlightsAdmin: APIHandler<'get-spotlights-admin'> = async (_, auth) => {
  await throwErrorIfNotAdmin(auth.uid)

  const pg = createSupabaseDirectClient()

  const [spotlights, candidates] = await Promise.all([
    // Drafts first: they are the only group that represents work owed. Then live, then retired.
    pg.any<SpotlightAdminQueryRow>(
      `select ${SPOTLIGHT_COLUMNS_PREFIXED}, p.spotlight_consent as consents
       from profile_spotlights s
                left join profiles p on p.user_id = s.user_id
       order by case s.status when 'draft' then 0 when 'live' then 1 else 2 end,
                s.featured_rank desc nulls last,
                s.created_time desc`,
    ),
    // Consenting members with no snapshot yet. Public profiles only — a members-only profile cannot be
    // spotlighted to logged-out visitors, so offering it would only produce a card that never renders.
    pg.any<SpotlightSourceRow>(
      `${SPOTLIGHT_SOURCE_SELECT}
       where p.spotlight_consent
         and p.visibility = 'public'
         and not exists (select 1 from profile_spotlights s where s.user_id = p.user_id)
       order by p.last_modification_time desc
       limit 200`,
    ),
  ])

  return {
    spotlights: spotlights.map(toAdminSpotlight),
    candidates: candidates.map(
      (row): SpotlightCandidate => ({
        userId: row.user_id,
        name: row.name,
        username: row.username,
        age: row.age,
        city: row.city,
        country: row.country,
        photoUrl: row.photo_url,
        headline: row.headline,
        // The whole document, unsliced: the admin is reading for the one good sentence, and it is
        // rarely in the first paragraph. Capped instead by the candidate list's own `limit 200`.
        bio: row.bio,
        socialConsent: row.social_media_consent,
      }),
    ),
  }
}
