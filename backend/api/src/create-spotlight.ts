import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {
  SPOTLIGHT_COLUMNS,
  SPOTLIGHT_SOURCE_SELECT,
  SpotlightAdminQueryRow,
  SpotlightQueryRow,
  SpotlightSourceRow,
  toAdminSpotlight,
} from 'api/helpers/spotlights'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Snapshot a consenting member's profile into a `draft` spotlight.
 *
 * The split of responsibilities is the whole design:
 *
 *   - the **member** supplies everything factual (name, age, city, photo, headline) by having written
 *     a profile, and supplies permission by ticking the consent box;
 *   - the **admin** supplies only the editorial judgement — which sentence of theirs to quote, how to
 *     frame it, which few tags make them specific.
 *
 * An admin cannot type a member's details by hand, which is deliberate: hand-entered fields are how a
 * spotlight ends up asserting something the profile never said. The quote is the exception, and it is
 * an exception only in the sense that it is *cut down* from the member's own prose, never composed.
 *
 * Creates in `draft`, never `live`. Publishing is a second, separate decision made in the admin UI
 * once someone has looked at the rendered card.
 */
export const createSpotlight: APIHandler<'create-spotlight'> = async (props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)

  const {userId, quote, quoteContext, tags, adminNote} = props

  const pg = createSupabaseDirectClient()

  return await pg.tx(async (tx) => {
    const source = await tx.oneOrNone<SpotlightSourceRow>(
      `${SPOTLIGHT_SOURCE_SELECT} where p.user_id = $(userId)`,
      {userId},
    )

    if (!source) throw APIErrors.notFound('No profile for that user')

    // Re-checked here rather than trusted from the candidate list the admin was looking at: that list
    // may be minutes old, and this is the write that puts a real person on the front page.
    if (!source.spotlight_consent) {
      throw APIErrors.forbidden(`${source.username} has not consented to being spotlighted`)
    }
    if (source.visibility !== 'public') {
      throw APIErrors.forbidden(
        `${source.username}'s profile is members-only, so a spotlight of it would never render`,
      )
    }

    const inserted = await tx.oneOrNone<SpotlightQueryRow>(
      `insert into profile_spotlights (user_id, name, username, age, city, country, photo_url,
                                       headline, quote, quote_context, tags, admin_id, admin_note)
       values ($(userId), $(name), $(username), $(age), $(city), $(country), $(photoUrl),
               $(headline), $(quote), $(quoteContext), $(tags), $(adminId), $(adminNote))
       on conflict do nothing
       returning ${SPOTLIGHT_COLUMNS}`,
      {
        userId,
        name: source.name,
        username: source.username,
        age: source.age,
        city: source.city,
        country: source.country,
        photoUrl: source.photo_url,
        headline: source.headline,
        quote,
        quoteContext: quoteContext?.trim() || null,
        tags: tags ?? [],
        adminId: auth.uid,
        adminNote: adminNote?.trim() || null,
      },
    )

    // The partial unique index caught a second snapshot for this member. Reported rather than
    // upserted: overwriting would silently discard a quote another admin may already have published.
    if (!inserted) {
      throw APIErrors.badRequest(
        `${source.username} already has a spotlight — edit that one instead of creating a second`,
      )
    }

    return {spotlight: toAdminSpotlight({...inserted, consents: true} as SpotlightAdminQueryRow)}
  })
}
