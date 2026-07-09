import {loadProfiles, profileQueryType} from 'api/get-profiles'
import {
  buildStagingSnapshot,
  getChangedUserIds,
  getStagingTakenAt,
  hasStagingSnapshot,
  isSnapshotUsable,
  promoteStagingSnapshot,
  SNAPSHOT_SCHEMA,
  STAGING_SCHEMA,
  withSchema,
} from 'api/profile-snapshot'
import {sendDiscordMessage} from 'common/discord/core'
import {debug} from 'common/logger'
import {MatchesType} from 'common/profiles/bookmarked_searches'
import {Row} from 'common/supabase/utils'
import {DAY_MS} from 'common/util/time'
import {sendSearchAlertsEmail} from 'email/functions/helpers'
import {groupBy, keyBy, uniq} from 'lodash'
import {log} from 'shared/monitoring/log'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'

/**
 * A staging snapshot is only promoted once every search has been processed, so a search whose email
 * keeps failing would otherwise pin the snapshot in place forever and no new profile would ever be
 * diffed again. Past this age we promote anyway and lose that user's pending alerts.
 */
const MAX_STAGING_AGE_MS = 3 * DAY_MS

// `last_checked_at` lands in the generated types on the next `regen-types-dev`.
type SearchRow = Row<'bookmarked_searches'> & {last_checked_at: string | null}

type CreatorAlert = {
  user: Row<'users'>
  privateUser: any
  matches: MatchesType[]
  /** Every pending search of this creator, matched or not — all of them get a fresh watermark. */
  searchIds: number[]
  matchedSearchIds: number[]
}

const searchProps = (row: SearchRow, userIds: string[]): profileQueryType => {
  // orderBy is meaningless here, and 'compatibility_score' would throw for lack of a target user.
  const {orderBy: _, ...filters} = (row.search_filters ?? {}) as Record<string, any>
  return {
    ...filters,
    skipId: row.creator_id,
    userId: row.creator_id,
    shortBio: true,
    skipCount: true,
    lastModificationWithin: '24 hours',
    userIds,
  }
}

/**
 * The profiles that match `row` now but did not match it at the last run.
 *
 * Both sides run the identical filter query; only the schema they read from differs. Restricting the
 * first side to the profiles that actually changed keeps a broad search ("any woman") from scanning
 * everyone, and lets the second side look at a handful of rows.
 */
const findNewMatches = async (
  pg: SupabaseDirectClient,
  row: SearchRow,
  changedUserIds: string[],
) => {
  const {profiles: candidates} = await withSchema(pg, STAGING_SCHEMA, (db) =>
    loadProfiles(searchProps(row, changedUserIds), db),
  )
  if (!candidates.length) return []

  const {profiles: alreadyMatched} = await withSchema(pg, SNAPSHOT_SCHEMA, (db) =>
    loadProfiles(
      searchProps(
        row,
        candidates.map((profile: any) => profile.user_id),
      ),
      db,
    ),
  )
  const previously = new Set(alreadyMatched.map((profile: any) => profile.user_id))

  return candidates.filter((profile: any) => !previously.has(profile.user_id))
}

/** Emails each creator, then stamps their searches so a crash never re-sends what already went out. */
export const notifyBookmarkedSearch = async (
  pg: SupabaseDirectClient,
  alerts: Record<string, CreatorAlert>,
) => {
  let failed = 0
  let notified = 0

  for (const [creatorId, alert] of Object.entries(alerts)) {
    try {
      if (alert.matches.length) {
        await sendSearchAlertsEmail(alert.user as any, alert.privateUser, alert.matches)
        notified++
      }
      await pg.none(
        `update bookmarked_searches
         set last_checked_at = now(),
             last_notified_at = case when id = any($(matchedSearchIds)) then now()
                                     else last_notified_at end
         where id = any($(searchIds))`,
        {searchIds: alert.searchIds, matchedSearchIds: alert.matchedSearchIds},
      )
    } catch (error) {
      failed++
      log.error(`Failed to send search alerts to ${creatorId}`, {error})
    }
  }

  return {failed, notified}
}

export const sendSearchNotifications = async () => {
  const pg = createSupabaseDirectClient()

  // A crashed run leaves its staging snapshot behind on purpose. Reusing it means the searches it
  // already emailed are skipped by their watermark, and the rest see exactly the diff they would
  // have seen had the run completed.
  const resuming = await hasStagingSnapshot(pg)
  if (resuming) log.info('Resuming search notifications against the existing staging snapshot')
  else await buildStagingSnapshot(pg)

  if (!(await isSnapshotUsable(pg))) {
    await promoteStagingSnapshot(pg)
    log.info('Profile snapshot initialised (or rebuilt after a schema change); alerts skipped')
    return {status: 'success', notified: 0, skipped: true}
  }

  const changedUserIds = await getChangedUserIds(pg)
  debug(`${changedUserIds.length} profiles changed since the last run`)
  if (!changedUserIds.length) {
    await promoteStagingSnapshot(pg)
    return {status: 'success', notified: 0}
  }

  const stagingTakenAt = await getStagingTakenAt(pg)
  const searches = await pg.manyOrNone<SearchRow>(
    `select * from bookmarked_searches
     where last_checked_at is null or last_checked_at < $(stagingTakenAt)`,
    {stagingTakenAt},
  )
  debug(`Running ${searches.length} bookmarked searches`)

  const creatorIds = uniq(searches.map((row) => row.creator_id))
  const users = keyBy(
    await pg.manyOrNone<Row<'users'>>(`select * from users where id = any($(creatorIds))`, {
      creatorIds,
    }),
    'id',
  )
  const privateUsers = keyBy(
    await pg.manyOrNone<Row<'private_users'>>(
      `select * from private_users where id = any($(creatorIds))`,
      {creatorIds},
    ),
    'id',
  )

  const alerts: Record<string, CreatorAlert> = {}

  for (const [creatorId, creatorSearches] of Object.entries(groupBy(searches, 'creator_id'))) {
    if (!users[creatorId] || !privateUsers[creatorId]) continue

    const alert: CreatorAlert = {
      user: users[creatorId],
      privateUser: privateUsers[creatorId]['data'],
      matches: [],
      searchIds: creatorSearches.map((row) => row.id),
      matchedSearchIds: [],
    }

    for (const row of creatorSearches) {
      if (typeof row.search_filters !== 'object') continue
      const profiles = await findNewMatches(pg, row, changedUserIds)
      if (!profiles.length) continue
      log.info(
        `Matches for search from profileId=${row.id}: ${profiles.map((profile: any) => profile.name)}`,
      )

      alert.matchedSearchIds.push(row.id)
      alert.matches.push({
        id: creatorId,
        description: {filters: row.search_filters, location: row.location},
        matches: profiles.map((profile: any) => profile.user),
      })
    }

    alerts[creatorId] = alert
  }

  const {failed, notified} = await notifyBookmarkedSearch(pg, alerts)

  const stagingAgeMs = Date.now() - new Date(stagingTakenAt).getTime()
  if (!failed) {
    await promoteStagingSnapshot(pg)
  } else if (stagingAgeMs > MAX_STAGING_AGE_MS) {
    await promoteStagingSnapshot(pg)
    await sendDiscordMessage(
      `Search alerts failed for ${failed} user(s) ${Math.round(stagingAgeMs / DAY_MS)} days running; ` +
        `promoting the profile snapshot anyway. Their pending alerts are lost.`,
      'health',
    )
  } else {
    // Keep the staging snapshot so the next run resumes and retries only the unstamped searches.
    log.error(`Search alerts failed for ${failed} user(s); snapshot not promoted`)
  }

  return {status: 'success', notified, failed}
}
