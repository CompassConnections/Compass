import {debug} from 'common/logger'
import {Notification} from 'common/notifications'
import {
  EMPTY_ROOM_INACTIVE_DAYS,
  EMPTY_ROOM_MAX_NEARBY,
  OUTREACH_RADIUS_KM,
} from 'common/outreach/outreach'
import {getNotificationDestinationsForUser} from 'common/user-notification-preferences'
import {sleep} from 'common/util/time'
import {sendEmptyRoomEmail} from 'email/functions/helpers'
import {log} from 'shared/monitoring/log'
import {getLocalDensity} from 'shared/outreach/local-density'
import {recordOutreachSend} from 'shared/outreach/sends'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {insertNotificationToSupabase} from 'shared/supabase/notifications'
import {getPrivateUser, getUser} from 'shared/utils'

const DEFAULT_BATCH_SIZE = 50
const PAUSE_BETWEEN_SENDS_MS = 2000

/**
 * Everyone who might be in an empty room, before the count is known.
 *
 * The inactivity arm of the trigger is applied here; the density arm can only be applied per-member
 * below, because it needs a distance query against their own coordinates. Members with no city are
 * excluded — with no coordinates there is no honest number, and this message is nothing but the
 * honest number.
 */
const CANDIDATES_SQL = `
  select u.id,
         (ua.last_online_time is null
             or ua.last_online_time < now() - make_interval(days => $(inactiveDays))) as was_inactive
  from users u
           join profiles p on p.user_id = u.id
           left join user_activity ua on ua.user_id = u.id
  where not coalesce(u.is_banned_from_posting, false)
    and not coalesce(p.disabled, false)
    and p.city is not null
    and p.city_latitude is not null
    and not exists (select 1
                    from outreach_sends os
                    where os.user_id = u.id
                      and os.kind in ('city_number', 'empty_room'))
    and not exists (select 1
                    from outreach_contacts oc
                    where oc.user_id = u.id
                      and coalesce(oc.stage, 'not_started') not in ('not_started', 'closed'))
  order by u.created_time desc
  limit $(batchSize)
`

/**
 * Contact #E, automated.
 *
 * Sends only when the local number is genuinely low. The doc lists two weeks of silence as a second
 * way in, and it is honoured — but only as a *reason to look*, never as a reason to send: telling
 * someone with forty people near them that the room is empty would be false, and this is the one
 * message in the system whose entire value is that it is not.
 *
 * `looking_for_matches` is deliberately not required here, unlike the city-number job. Someone who
 * has switched it off in a city with four members has most likely switched it off *because* of that,
 * and they are exactly who this is for.
 */
export const sendEmptyRoomEmails = async (opts?: {batchSize?: number; dryRun?: boolean}) => {
  const pg = createSupabaseDirectClient()
  const batchSize = opts?.batchSize ?? DEFAULT_BATCH_SIZE
  const dryRun = opts?.dryRun ?? false

  const candidates = await pg.manyOrNone<{id: string; was_inactive: boolean}>(CANDIDATES_SQL, {
    batchSize,
    inactiveDays: EMPTY_ROOM_INACTIVE_DAYS,
  })

  let sent = 0
  let skippedRoomNotEmpty = 0
  let skippedNoDensity = 0
  let failed = 0

  for (const {id, was_inactive: wasInactive} of candidates) {
    try {
      const density = await getLocalDensity(id, {pg, radiusKm: OUTREACH_RADIUS_KM})
      if (!density || !density.city) {
        skippedNoDensity++
        continue
      }
      if (density.count >= EMPTY_ROOM_MAX_NEARBY) {
        skippedRoomNotEmpty++
        continue
      }

      if (dryRun) {
        debug('[empty-room] would send', id, density.count, density.city)
        sent++
        continue
      }

      const claimed = await recordOutreachSend(
        id,
        'empty_room',
        {count: density.count, city: density.city, radiusKm: OUTREACH_RADIUS_KM, wasInactive},
        pg,
      )
      if (!claimed) continue

      const [user, privateUser] = await Promise.all([getUser(id), getPrivateUser(id)])
      if (!user || !privateUser) continue

      await sendEmptyRoomEmail(
        user,
        privateUser,
        {count: density.count, city: density.city},
        {
          wasInactive,
        },
      )
      await notifyInApp(id, privateUser, density.count, density.city)

      sent++
      await sleep(PAUSE_BETWEEN_SENDS_MS)
    } catch (e) {
      failed++
      log.error('Failed to send empty-room email', {userId: id, error: e})
    }
  }

  const result = {
    candidates: candidates.length,
    sent,
    skippedRoomNotEmpty,
    skippedNoDensity,
    failed,
    dryRun,
  }
  log.info('empty-room run complete', result)
  return result
}

/**
 * The in-app copy of the message, so it is waiting for them next time they open Compass rather than
 * only sitting in an inbox they may already have stopped reading.
 */
const notifyInApp = async (
  userId: string,
  privateUser: Awaited<ReturnType<typeof getPrivateUser>>,
  count: number,
  city: string,
) => {
  if (!privateUser) return
  const {sendToBrowser} = getNotificationDestinationsForUser(privateUser, 'platform_updates')
  if (!sendToBrowser) return

  const notification: Notification = {
    // One per member, matching the once-ever rule the ledger enforces on the email.
    id: `empty-room-${userId}`,
    userId,
    reason: 'empty_room',
    createdTime: Date.now(),
    isSeen: false,
    sourceType: 'outreach',
    sourceUpdateType: 'created',
    sourceText: `There are only ${count} members within reach of ${city} so far. The one thing that changes that is someone you bring.`,
    isSeenOnHref: '/referrals',
  }
  await insertNotificationToSupabase(notification)
}
