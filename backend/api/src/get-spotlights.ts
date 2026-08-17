import {APIHandler} from 'api/helpers/endpoint'
import {
  SPOTLIGHT_COLUMNS_PREFIXED,
  SpotlightQueryRow,
  toPublicSpotlight,
} from 'api/helpers/spotlights'
import {HOME_SPOTLIGHT_LIMIT} from 'common/profiles/spotlights'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The home-page rail. Live rows only — `draft` and `retired` never leave the server.
 *
 * Three conditions, and all three are checked here rather than trusted from the row:
 *
 *   1. `status = 'live'` — an admin published this snapshot.
 *   2. `p.spotlight_consent` — the member still consents *right now*. Enforced on read, not on write,
 *      so unticking the box in settings removes the card within the cache window without an admin
 *      having to notice. This is the one place the live profile is consulted, and it is consulted only
 *      to answer "may we still show this?", never for content.
 *   3. `p.visibility = 'public'` — a member who has since made their profile members-only is not put
 *      back in front of logged-out visitors by a card we made earlier.
 *
 * The join also drops rows whose account is gone, which is correct: a spotlight of a deleted member is
 * a face on the front page with nothing behind it.
 */
export const getSpotlights: APIHandler<'get-spotlights'> = async (props) => {
  const pg = createSupabaseDirectClient()

  const rows = await pg.any<SpotlightQueryRow>(
    `select ${SPOTLIGHT_COLUMNS_PREFIXED}
     from profile_spotlights s
              join profiles p on p.user_id = s.user_id
     where s.status = 'live'
       and p.spotlight_consent
       and p.visibility = 'public'
     order by s.featured_rank desc nulls last, s.created_time desc
     limit $(limit)`,
    {limit: props.limit ?? HOME_SPOTLIGHT_LIMIT},
  )

  return {spotlights: rows.map(toPublicSpotlight)}
}
