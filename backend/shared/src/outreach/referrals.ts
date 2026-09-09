import {Notification} from 'common/notifications'
import {isProfileVisibleTo} from 'common/profiles/visibility'
import {
  MAX_REFERRAL_TREE_DEPTH,
  MAX_REFERRAL_TREE_NODES,
  REFERRAL_LEADERBOARD_LIMIT,
  ReferralCount,
  ReferralLeaderboard,
  ReferralLeaderboardEntry,
  ReferralTree,
  ReferralTreeNode,
} from 'common/referrals'
import {getNotificationDestinationsForUser} from 'common/user-notification-preferences'
import {sendMobileNotifications} from 'shared/mobile'
import {log} from 'shared/monitoring/log'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {insertNotificationToSupabase} from 'shared/supabase/notifications'
import {getPrivateUser} from 'shared/utils'

/**
 * Counts worth saying out loud when a member reaches them.
 *
 * Sparse and widening on purpose. Marking every arrival would make the word "milestone" mean nothing,
 * and the interesting thresholds are the ones where a member's own sense of what they are doing
 * changes — the fifth is when it stops being a coincidence, the fiftieth is when they are a reason
 * the place exists.
 */
export const REFERRAL_MILESTONES = [5, 10, 25, 50, 100, 250, 500]

export type ReferredMember = {
  id: string
  name: string
  username: string
  avatarUrl: string | null
  joinedTime: string
}

/**
 * Everyone who signed up carrying this member's username as their referrer.
 *
 * Disabled and banned members are still counted. Credit is for the introduction, which happened; what
 * the person did afterwards is not something the referrer should be silently docked for.
 */
export const getReferredMembers = async (
  username: string,
  pg?: SupabaseDirectClient,
): Promise<ReferredMember[]> => {
  pg = pg ?? createSupabaseDirectClient()
  return await pg.manyOrNone<ReferredMember>(
    `select u.id, u.name, u.username, u.avatar_url as "avatarUrl", u.created_time as "joinedTime"
     from profiles p
              join users u on u.id = p.user_id
     where p.referred_by_username = $1
     order by u.created_time desc`,
    [username],
  )
}

/**
 * Everyone who is on Compass because of this member, recursively.
 *
 * Walks `profiles.referred_by_user_id` outwards from one member: the people they invited, the people
 * *those* people invited, and so on. Ids, not usernames — a username-keyed walk loses a whole subtree
 * the moment someone in the middle renames, and every descendant below them vanishes from the sky of
 * everyone above them for a reason none of those people can see (see the 20260822 migration).
 *
 * Cheap enough to run per request, which is why there is no cache table behind it: with
 * `idx_profiles_referred_by_user_id` each generation is one index scan, so the whole walk costs
 * roughly one index lookup per member returned. If a single tree ever passes a few thousand nodes,
 * the upgrade is a materialised path column on `profiles` — written once at signup, never mutated,
 * turning the whole thing into `path <@ $1` — and *not* a periodically rebuilt denormalised table,
 * which would add a second source of truth that can silently drift from the first.
 *
 * Two guards, both deliberate:
 *
 *   * the `path` array rejects any member already on the way down. A cycle should be unreachable —
 *     `referred_by_user_id` is written once, at signup, and a member cannot be referred by someone who
 *     did not exist yet — but the column is nullable and updatable, and a recursive CTE that meets a
 *     cycle does not return a wrong answer, it never returns at all.
 *   * `depth < $2` bounds the walk independently of that.
 *
 * The outer `limit` drops deepest-first, so the returned set is always prefix-closed: every node's
 * referrer is somewhere above it in the list, and the client never has to draw an edge to a member it
 * was not given.
 */
export const getReferralTree = async (
  rootUserId: string,
  pg?: SupabaseDirectClient,
): Promise<ReferralTree> => {
  pg = pg ?? createSupabaseDirectClient()

  const nodes = await pg.manyOrNone<ReferralTreeNode>(
    `with recursive tree as (select u.id,
                                    u.name,
                                    u.username,
                                    u.avatar_url,
                                    u.created_time,
                                    null::text  as referrer_id,
                                    0           as depth,
                                    array [u.id] as path
                             from users u
                             where u.id = $1

                             union all

                             select u.id,
                                    u.name,
                                    u.username,
                                    u.avatar_url,
                                    u.created_time,
                                    t.id           as referrer_id,
                                    t.depth + 1,
                                    t.path || u.id
                             from tree t
                                      join profiles p on p.referred_by_user_id = t.id
                                      join users u on u.id = p.user_id
                             where t.depth < $2
                               and not (u.id = any (t.path)))
     select id,
            name,
            username,
            avatar_url   as "avatarUrl",
            created_time as "joinedTime",
            referrer_id  as "referrerId",
            depth
     from tree
     order by depth, created_time desc
     limit $3`,
    [rootUserId, MAX_REFERRAL_TREE_DEPTH, MAX_REFERRAL_TREE_NODES],
  )

  const descendants = nodes.filter((n) => n.depth > 0)
  const direct = descendants.filter((n) => n.depth === 1).length

  return {
    nodes,
    stats: {
      total: descendants.length,
      direct,
      indirect: descendants.length - direct,
      maxDepth: descendants.reduce((m, n) => Math.max(m, n.depth), 0),
      truncated: nodes.length >= MAX_REFERRAL_TREE_NODES,
    },
  }
}

/**
 * How many people are on Compass because of this member — the size of the tree, not the shape.
 *
 * Deliberately not `getReferralTree(...).stats`. This one runs on every page for every signed-in
 * member (the sidebar badge), so it never touches `users`: no join, no names, no avatar URLs, and two
 * integers on the wire instead of up to two thousand rows. The walk itself is the same shape and is
 * covered by the same partial index, but it stays inside `profiles` the whole way down.
 */
export const getReferralCounts = async (
  rootUserId: string,
  pg?: SupabaseDirectClient,
): Promise<ReferralCount> => {
  pg = pg ?? createSupabaseDirectClient()

  const row = await pg.one<{total: string; direct: string}>(
    `with recursive tree as (select $1::text     as id,
                                    0             as depth,
                                    array [$1::text] as path

                             union all

                             select p.user_id,
                                    t.depth + 1,
                                    t.path || p.user_id
                             from tree t
                                      join profiles p on p.referred_by_user_id = t.id
                             where t.depth < $2
                               and not (p.user_id = any (t.path)))
     select count(*) filter (where depth > 0) as total,
            count(*) filter (where depth = 1) as direct
     from tree`,
    [rootUserId, MAX_REFERRAL_TREE_DEPTH],
  )

  return {total: Number(row.total), direct: Number(row.direct)}
}

/**
 * The member a `referred_by_username` names, or null when it names nobody.
 *
 * `?referrer=` is whatever was in the URL, so the column can hold a username that never existed or one
 * whose account is gone. Every caller has to handle that: crediting a name that resolves to no member
 * is worse than crediting nobody.
 */
export const getReferrer = async (
  username: string,
  pg?: SupabaseDirectClient,
): Promise<{id: string; name: string; username: string} | null> => {
  pg = pg ?? createSupabaseDirectClient()
  return await pg.oneOrNone<{id: string; name: string; username: string}>(
    `select id, name, username from users where username ilike $1`,
    [username],
  )
}

/**
 * Tell a member that someone they brought has arrived.
 *
 * The gap this closes: `?referrer=` has always been recorded and never surfaced, so bringing someone
 * produced no visible result of any kind. A sharer who is never told it worked has no reason to
 * believe it did, and no reason to do it again — which is most of the difference between a one-time
 * share and a repeat one.
 *
 * Best-effort by design: it is called from the signup continuation, and nothing about a new member's
 * account creation should fail because a notification to a third party could not be written.
 */
export const notifyReferrerOfSignup = async (
  newMember: {name: string; username: string; avatarUrl?: string},
  referrerUsername: string,
  pg?: SupabaseDirectClient,
) => {
  pg = pg ?? createSupabaseDirectClient()

  const referrer = await getReferrer(referrerUsername, pg)
  if (!referrer) return

  const privateUser = await getPrivateUser(referrer.id)
  if (!privateUser) return

  const {sendToBrowser} = getNotificationDestinationsForUser(privateUser, 'platform_updates')
  if (!sendToBrowser) return

  // Need to fix the platform_updates notif setting stuck at ["browser", "email"]
  const sendToMobile = sendToBrowser

  // How many they have brought in total, counted after this signup so it includes them. A single
  // arrival is easy to shrug off; a tally is what makes it read as something they are good at.
  //
  // Counted on the id rather than the username now that both are stored: the name is whatever was in
  // the URL, so a member who renamed would see their tally reset to whoever else picked up their old
  // handle. See the 20260822 migration.
  const {count} = await pg.one<{count: string}>(
    `select count(*) from profiles where referred_by_user_id = $1`,
    [referrer.id],
  )
  const referredCount = Number(count)
  const milestone = REFERRAL_MILESTONES.includes(referredCount) ? referredCount : null

  // A milestone gets its own sentence rather than its own notification. A separate "congratulations"
  // arriving a second after "someone joined" would be two interruptions for one event, and the second
  // one would carry no news.
  const body = milestone
    ? `${newMember.name} joined Compass from your link — that makes ${milestone} people you have brought.`
    : `${newMember.name} joined Compass from your link.`

  if (sendToBrowser) {
    const notification: Notification = {
      id: `referred-joined-${newMember.username}`,
      userId: referrer.id,
      reason: 'referred_member_joined',
      createdTime: Date.now(),
      isSeen: false,
      sourceType: 'referral',
      sourceUpdateType: 'created',
      sourceUserName: newMember.name,
      sourceUserUsername: newMember.username,
      sourceUserAvatarUrl: newMember.avatarUrl,
      sourceText: body,
      // The constellation, not the invite page. The notification has already delivered the news, so
      // what it opens should be the thing the news is about — everyone who is here because of them —
      // rather than the tool for causing more of it.
      isSeenOnHref: '/constellation',
      data: {referredCount},
    }
    await insertNotificationToSupabase(notification, pg)
  }

  console.log({sendToMobile, referrer, privateUser})

  // No collapse key: each arrival is a separate person, and merging them would turn the one moment
  // worth celebrating into a running total. Failure is swallowed — the bell entry is the record, the
  // push is only the nudge to go look at it.
  if (sendToMobile) {
    try {
      await sendMobileNotifications(pg, referrer.id, {
        title: milestone
          ? `That's ${milestone} people you have brought to Compass`
          : 'Someone joined from your link',
        body,
        url: '/constellation',
      })
    } catch (error) {
      log.error(`Failed to push referral signup to ${referrer.id}`, {error})
    }
  }
}

/**
 * The direct-referral leaderboard, plus the caller's own place on it.
 *
 * One statement, not two. The board and "where am I" are the same ranking asked two questions, and
 * splitting them would rank the whole table twice per page load — and, worse, could rank it twice
 * against two different snapshots, so a member could be shown at #11 on a board whose eleventh row is
 * someone else.
 *
 * **`rank` and `rn` are both needed and are not the same thing.** `rank` is what a reader is shown:
 * equal counts share it, so two members who each brought nine people are both third. `rn` is a strict
 * ordinal used only to cut the board at `limit` — cutting on `rank` would return every member of a tie
 * that straddles the boundary, which for a large tie at the bottom is unbounded.
 *
 * **Who is left out.** Banned members and disabled profiles are excluded from the ranking entirely —
 * this is the one referral surface that is a public celebration rather than a private record, and the
 * standing rule that credit survives what someone did afterwards (see `getReferralTree`) is about not
 * docking a count, not about putting that person on a podium. Their referrals still count towards
 * everyone else's trees; it is only the row that goes. Members with no profile row are kept, via the
 * left join: `create-user-and-profile` writes both together, so an absent profile is a data fault, not
 * a deactivation, and it should not silently cost someone their place.
 *
 * **`viewerId` is optional, and decides two things.** The endpoint is public, so it is undefined for
 * an anonymous caller: they get no `you` row, and every member whose profile is members-only comes
 * back without a photo. That is the site's existing rule for a gated profile, not a new one invented
 * for this board — name and username stay, the photo is profile content and goes (see
 * `redactMemberOnlyUser`). It is applied here rather than in the page because a component that merely
 * hides a field has still shipped it, in the response and in the props built from it.
 */
export const getReferralLeaderboard = async (
  viewerId: string | undefined,
  limit = REFERRAL_LEADERBOARD_LIMIT,
  pg?: SupabaseDirectClient,
): Promise<ReferralLeaderboard> => {
  pg = pg ?? createSupabaseDirectClient()

  const rows = await pg.manyOrNone<
    ReferralLeaderboardEntry & {rn: string; totalReferrers: string; visibility: string | null}
  >(
    `with counts as (select p.referred_by_user_id as user_id,
                            count(*)             as direct,
                            max(u.created_time)  as latest_referral_time
                     from profiles p
                              join users u on u.id = p.user_id
                     where p.referred_by_user_id is not null
                     group by p.referred_by_user_id),
          ranked as (select c.user_id,
                            u.name,
                            u.username,
                            u.avatar_url,
                            c.direct,
                            c.latest_referral_time,
                            rp.visibility,
                            rank() over (order by c.direct desc)                                as rank,
                            row_number() over (order by c.direct desc, c.latest_referral_time)  as rn,
                            count(*) over ()                                                    as total_referrers
                     from counts c
                              join users u on u.id = c.user_id
                              left join profiles rp on rp.user_id = u.id
                     where not u.is_banned_from_posting
                       and coalesce(rp.disabled, false) = false)
     select user_id              as "userId",
            name,
            username,
            avatar_url           as "avatarUrl",
            direct::int          as direct,
            latest_referral_time as "latestReferralTime",
            rank::int            as rank,
            visibility,
            rn,
            total_referrers      as "totalReferrers"
     from ranked
     where rn <= $2
        or user_id = $1
     order by rn`,
    // `?? null` rather than leaving it undefined: an anonymous caller must produce a parameter that
    // matches no row, and `user_id = null` is null — never true — which is exactly that.
    [viewerId ?? null, limit],
  )

  // `count(*) over ()` is per-row, so an empty board carries the total nowhere. Zero is the only
  // possible answer in that case anyway: the window counted the rows that would have been ranked.
  const totalReferrers = rows.length ? Number(rows[0].totalReferrers) : 0

  // Drops the two bookkeeping columns and `visibility`, which is an input to the redaction and not
  // something a caller should be told about a member.
  const strip = ({
    rn: _rn,
    totalReferrers: _total,
    visibility,
    ...entry
  }: (typeof rows)[number]): ReferralLeaderboardEntry => ({
    ...entry,
    avatarUrl: isProfileVisibleTo({visibility}, viewerId) ? entry.avatarUrl : null,
  })

  const entries = rows.map(strip)

  return {
    entries: entries.filter((_, i) => Number(rows[i].rn) <= limit),
    // `viewerId` guards the lookup so an undefined caller cannot be matched by an undefined column.
    you: (viewerId && entries.find((r) => r.userId === viewerId)) || null,
    totalReferrers,
  }
}
