import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {
  SPOTLIGHT_COLUMNS_PREFIXED,
  SpotlightAdminQueryRow,
  toAdminSpotlight,
} from 'api/helpers/spotlights'
import {throwErrorIfNotAdmin} from 'shared/helpers/auth'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * Edit, re-snapshot, publish or take down one spotlight.
 *
 * Every field is independently optional, the same contract as `update-testimonial-status`: the rail's
 * publish button sends only a status, the rank box sends only a rank. `undefined` leaves a column
 * alone and `null` clears it, so publishing a card cannot silently wipe the note explaining why it was
 * held back.
 *
 * Two things are deliberately *not* here:
 *
 *   - **No content refresh on read.** `refreshSnapshot` is an explicit, admin-triggered re-capture and
 *     the only path by which a card's facts ever change. Everything else about this feature exists to
 *     make sure the home page cannot be edited by the person it is about.
 *   - **No delete.** `status: 'retired'` is the takedown, and it is reversible. A hard delete would
 *     also free the member's slot in the one-per-user index, so a fresh snapshot could be created
 *     without anyone noticing the earlier one had been pulled and why.
 */
export const updateSpotlight: APIHandler<'update-spotlight'> = async (props, auth) => {
  await throwErrorIfNotAdmin(auth.uid)

  const {
    id,
    status,
    featuredRank,
    quote,
    quoteContext,
    headline,
    tags,
    adminNote,
    refreshSnapshot,
  } = props

  const pg = createSupabaseDirectClient()

  // Publishing re-checks consent, because the admin page may have been open for a while and this is
  // the action that makes a card public. The read-time check in `get-spotlights` would catch it
  // anyway; failing loudly here means an admin learns it now rather than wondering why the rail is
  // short.
  if (status === 'live') {
    const row = await pg.oneOrNone<{consents: boolean | null; visibility: string | null}>(
      `select p.spotlight_consent as consents, p.visibility
       from profile_spotlights s
                left join profiles p on p.user_id = s.user_id
       where s.id = $(id)`,
      {id},
    )
    if (!row) throw APIErrors.notFound('Spotlight not found')
    if (!row.consents) {
      throw APIErrors.forbidden('That member has withdrawn consent, or their account is gone')
    }
    if (row.visibility !== 'public') {
      throw APIErrors.forbidden('That member’s profile is members-only')
    }
  }

  const updated = await pg.oneOrNone<SpotlightAdminQueryRow>(
    `with source as (select p.user_id,
                            u.name,
                            u.username,
                            p.age,
                            p.city,
                            p.country,
                            coalesce(p.pinned_url, u.avatar_url) as photo_url,
                            p.headline
                     from profile_spotlights s
                              join profiles p on p.user_id = s.user_id
                              join users u on u.id = p.user_id
                     where s.id = $(id))
     update profile_spotlights s
     set status        = coalesce($(status), s.status),
         featured_rank = case when $(rankProvided) then $(featuredRank) else s.featured_rank end,
         quote         = coalesce($(quote), s.quote),
         quote_context = case when $(contextProvided) then $(quoteContext) else s.quote_context end,
         tags          = coalesce($(tags), s.tags),
         admin_note    = case when $(noteProvided) then $(adminNote) else s.admin_note end,
         -- A refresh re-reads every snapshot column from the live profile. An explicit \`headline\`
         -- still wins over the refreshed one, so "re-capture but keep my edited headline" works.
         name          = case when $(refresh) then coalesce((select name from source), s.name) else s.name end,
         username      = case when $(refresh) then coalesce((select username from source), s.username) else s.username end,
         age           = case when $(refresh) then (select age from source) else s.age end,
         city          = case when $(refresh) then (select city from source) else s.city end,
         country       = case when $(refresh) then (select country from source) else s.country end,
         photo_url     = case when $(refresh) then (select photo_url from source) else s.photo_url end,
         headline      = case
                             when $(headlineProvided) then $(headline)
                             when $(refresh) then (select headline from source)
                             else s.headline end,
         -- Only a re-capture moves this. It is what tells an admin how old the quoted bio is.
         captured_time = case when $(refresh) then now() else s.captured_time end,
         admin_id      = $(adminId),
         updated_time  = now()
     where s.id = $(id)
     returning ${SPOTLIGHT_COLUMNS_PREFIXED},
               (select spotlight_consent from profiles where user_id = s.user_id) as consents`,
    {
      id,
      status: status ?? null,
      featuredRank: featuredRank ?? null,
      rankProvided: featuredRank !== undefined,
      quote: quote ?? null,
      quoteContext: quoteContext?.trim() || null,
      contextProvided: quoteContext !== undefined,
      headline: headline?.trim() || null,
      headlineProvided: headline !== undefined,
      tags: tags ?? null,
      adminNote: adminNote?.trim() || null,
      noteProvided: adminNote !== undefined,
      refresh: refreshSnapshot === true,
      adminId: auth.uid,
    },
  )

  if (!updated) throw APIErrors.notFound('Spotlight not found')

  return {spotlight: toAdminSpotlight(updated)}
}
