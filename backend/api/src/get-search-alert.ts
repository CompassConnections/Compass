import {loadProfiles} from 'api/get-profiles'
import {APIErrors, APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

/**
 * The people one delivered saved-search alert was about.
 *
 * Reads the recorded match set rather than re-running the search, which is the point of recording it:
 * the alert was a diff against the previous profile snapshot, and that diff is not reproducible from
 * the filters alone.
 */
export const getSearchAlert: APIHandler<'get-search-alert'> = async (props, auth) => {
  const pg = createSupabaseDirectClient()

  const send = await pg.oneOrNone<{
    // bigint[] comes back from pg as strings, not numbers.
    search_ids: string[]
    matched_user_ids: string[]
    created_time: string
  }>(
    `select search_ids, matched_user_ids, created_time
     from search_alert_sends
     where id = $(id) and creator_id = $(uid)`,
    {id: props.id, uid: auth.uid},
  )
  // Not-found rather than forbidden for someone else's alert: whether an id exists is itself a fact
  // about another member.
  if (!send) throw APIErrors.notFound('No such alert')

  const [{profiles}, searches] = await Promise.all([
    loadProfiles({
      userIds: send.matched_user_ids,
      userId: auth.uid,
      skipId: auth.uid,
      skipCount: true,
      limit: send.matched_user_ids.length,
      // No filtering here — whether a thin profile belongs in this alert was decided when the alert
      // was generated, against the search's own toggle. Re-deciding it at read time can only
      // disagree with what was sent, reporting people as "no longer available" while their profile
      // is sitting right there.
      shortBio: true,
    }),
    // A member may have deleted the search since; the alert it produced still stands, it just loses
    // its description.
    pg.manyOrNone<{id: number; search_name: string | null; search_filters: any; location: any}>(
      `select id, search_name, search_filters, location
       from bookmarked_searches
       where id = any($(searchIds)::bigint[]) and creator_id = $(uid)`,
      {searchIds: send.search_ids, uid: auth.uid},
    ),
  ])

  return {
    profiles,
    searches: searches.map((row) => ({
      id: Number(row.id),
      name: row.search_name,
      filters: row.search_filters,
      location: row.location,
    })),
    createdTime: new Date(send.created_time).valueOf(),
    // Named rather than silently shortened: a list that came up two people short with no explanation
    // reads as the alert having lied.
    goneCount: send.matched_user_ids.length - profiles.length,
  }
}
