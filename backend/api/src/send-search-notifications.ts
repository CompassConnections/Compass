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
import {FilterFields, hasSearchCriteria} from 'common/filters'
import {debug} from 'common/logger'
import {Notification} from 'common/notifications'
import {MatchesType, MatchUser} from 'common/profiles/bookmarked_searches'
import {Row} from 'common/supabase/utils'
import {getNotificationDestinationsForUser} from 'common/user-notification-preferences'
import {DAY_MS} from 'common/util/time'
import {sendSearchAlertsEmail} from 'email/functions/helpers'
import {groupBy, keyBy, uniq, uniqBy} from 'lodash'
import {createT} from 'shared/locale'
import {sendMobileNotifications, sendWebNotifications} from 'shared/mobile'
import {log} from 'shared/monitoring/log'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'
import {insertNotificationToSupabase} from 'shared/supabase/notifications'

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

/** Everyone this alert named, across all of the creator's searches that matched in this run. */
const matchedUsersOf = (alert: CreatorAlert) =>
  uniqBy(
    alert.matches.flatMap((match) => match.matches),
    'id',
  )

/**
 * Where the notification lands when it is opened.
 *
 * One match goes straight to their profile — an intermediate page listing one person is a click
 * charged for nothing. Anything else goes to the send's own page, which is the only place the alert's
 * people exist as a set: re-running the saved search would return them mixed into every older result,
 * and a member who was *edited* into matching would not stand out at all.
 */
const alertUrl = (matched: MatchUser[], sendId: number) =>
  matched.length === 1 ? `/${matched[0].username}` : `/alerts/${sendId}`

/** The row that gives the push and the bell entry somewhere to point. */
const recordSearchAlertSend = async (
  pg: SupabaseDirectClient,
  creatorId: string,
  alert: CreatorAlert,
) => {
  const {id} = await pg.one<{id: number}>(
    `insert into search_alert_sends (creator_id, search_ids, matched_user_ids)
     values ($(creatorId), $(searchIds), $(matchedUserIds))
     returning id`,
    {
      creatorId,
      searchIds: alert.matchedSearchIds,
      matchedUserIds: matchedUsersOf(alert).map((user) => user.id),
    },
  )
  return Number(id)
}

/**
 * The in-app half of the alert: the bell entry and the push, both pointing at `alertUrl`.
 *
 * Deliberately best-effort. A member who cannot be pushed to has still had their email, and a failure
 * here must not mark the run failed — that would pin the staging snapshot and re-send the email that
 * already went out.
 */
const notifyInProduct = async (
  pg: SupabaseDirectClient,
  creatorId: string,
  alert: CreatorAlert,
  sendId: number,
) => {
  const {sendToBrowser, sendToMobile} = getNotificationDestinationsForUser(
    alert.privateUser,
    'new_search_alerts',
  )
  if (!sendToBrowser && !sendToMobile) return

  const matched = matchedUsersOf(alert)
  if (!matched.length) return

  const t = createT(alert.privateUser?.locale)
  const url = alertUrl(matched, sendId)
  const first = matched[0]

  const title =
    matched.length === 1
      ? t('notifications.search_alert.title_one', '{name} matches your saved search', {
          name: first.name,
        })
      : t('notifications.search_alert.title_many', '{count} people match your saved search', {
          count: matched.length,
        })

  const body =
    matched.length === 1
      ? t(
          'notifications.search_alert.body_one',
          'They just joined, or updated their profile into your search.',
        )
      : matched.map((user) => user.name).join(', ')

  if (sendToBrowser) {
    const notification: Notification = {
      id: `search-alert-${sendId}`,
      userId: creatorId,
      reason: 'new_search_alerts',
      sourceType: 'new_search_alerts',
      sourceUpdateType: 'created',
      createdTime: Date.now(),
      isSeen: false,
      // The bell shows one face and says how many there are; the page behind it shows them all.
      sourceUserName: first.name,
      sourceUserUsername: first.username,
      sourceUserAvatarUrl: first.avatarUrl ?? undefined,
      sourceText: body,
      sourceSlug: url,
      data: {sendId, count: matched.length},
    }
    await insertNotificationToSupabase(notification, pg)
  }

  // One collapse key for every search alert, so today's replaces yesterday's rather than stacking a
  // tray of them for someone who was away for a week.
  const payload = {title, body, url, collapseKey: 'search-alerts'}

  if (sendToBrowser) {
    try {
      await sendWebNotifications(pg, creatorId, JSON.stringify(payload))
    } catch (error) {
      log.error(`Failed to web-push search alerts to ${creatorId}`, {error})
    }
  }
  if (sendToMobile) {
    try {
      await sendMobileNotifications(pg, creatorId, payload)
    } catch (error) {
      log.error(`Failed to push search alerts to ${creatorId}`, {error})
    }
  }
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

        // After the email, so a failed send never leaves a page nobody was told about — and outside
        // the push's own error handling, so a dead push subscription cannot cost them the email.
        const sendId = await recordSearchAlertSend(pg, creatorId, alert)
        try {
          await notifyInProduct(pg, creatorId, alert, sendId)
        } catch (error) {
          log.error(`Failed to notify ${creatorId} in-product about search alerts`, {error})
        }
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
      // Saving one of these is now rejected, but rows predating that rule are still in the table and
      // would match every signup forever. Skipped rather than deleted: it is their row to remove.
      if (!hasSearchCriteria(row.search_filters as Partial<FilterFields>, row.location)) {
        log.info(`Skipping unfiltered saved search ${row.id} — it would match every new member`)
        continue
      }
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
