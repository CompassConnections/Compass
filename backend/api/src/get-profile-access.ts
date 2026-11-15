import {type APIHandler} from 'api/helpers/endpoint'
import {hasWrittenTo} from 'api/helpers/profile-access'
import {createSupabaseDirectClient} from 'shared/supabase/init'

type AccessUserRow = {
  id: string
  name: string
  username: string
  avatar_url: string | null
  time: Date
}

const toEntry = (row: AccessUserRow) => ({
  id: row.id,
  name: row.name,
  username: row.username,
  avatarUrl: row.avatar_url ?? undefined,
  time: new Date(row.time).toISOString(),
})

/**
 * The caller's approvals, in one read: who they have approved, who is waiting for an answer, and —
 * when `userId` is given — how things stand between the caller and that one member, in both
 * directions, which is what a profile page needs to draw its buttons.
 *
 * `pair.myRequest` is `requested` for a request the other person has silently declined too: the
 * requester is never told.
 */
export const getProfileAccess: APIHandler<'get-profile-access'> = async ({userId}, auth) => {
  const pg = createSupabaseDirectClient()

  const listSql = (status: 'approved' | 'requested') => `
    select users.id, users.name, users.username, users.avatar_url,
           ${status === 'approved' ? 'coalesce(pa.decided_time, pa.created_time)' : 'pa.created_time'} as time
    from profile_access pa
             join users on users.id = pa.viewer_id
    where pa.owner_id = $1
      and pa.status = '${status}'
      ${status === 'requested' ? 'and pa.decided_time is null' : ''}
      and not coalesce(users.is_banned_from_posting, false)
    order by time desc`

  const [approved, requests, pairRows, theyWroteToMe, iWroteToThem] = await Promise.all([
    pg.manyOrNone<AccessUserRow>(listSql('approved'), [auth.uid]),
    pg.manyOrNone<AccessUserRow>(listSql('requested'), [auth.uid]),
    userId && userId !== auth.uid
      ? pg.manyOrNone<{owner_id: string; status: string; decided_time: Date | null}>(
          `select owner_id, status, decided_time from profile_access
           where (owner_id = $1 and viewer_id = $2) or (owner_id = $2 and viewer_id = $1)`,
          [auth.uid, userId],
        )
      : [],
    userId && userId !== auth.uid ? hasWrittenTo(userId, auth.uid) : false,
    userId && userId !== auth.uid ? hasWrittenTo(auth.uid, userId) : false,
  ])

  const mine = pairRows.find((row) => row.owner_id === auth.uid)
  const theirs = pairRows.find((row) => row.owner_id === userId)

  return {
    approved: approved.map(toEntry),
    requests: requests.map(toEntry),
    pair: userId
      ? {
          // What I have granted them.
          approvedByMe: mine?.status === 'approved',
          // They asked me, and I have not answered.
          requestedOfMe: mine?.status === 'requested' && mine.decided_time == null,
          // What I asked of them, as I am allowed to know it.
          myRequest: (theirs?.status === 'approved'
            ? 'approved'
            : theirs?.status === 'requested'
              ? 'requested'
              : 'none') as 'approved' | 'requested' | 'none',
          // Whether I may ask at all: only once they have written to me.
          canRequest: theyWroteToMe,
          // Whether I may add them: they asked or were in my circle before, or we are in a
          // conversation. The same rule `set-profile-access` enforces.
          canAdd: !!mine || theyWroteToMe || iWroteToThem,
        }
      : undefined,
  }
}
