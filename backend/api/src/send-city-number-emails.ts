import {debug} from 'common/logger'
import {
  EMPTY_ROOM_MAX_NEARBY,
  OUTREACH_MIN_DAYS_SINCE_SIGNUP,
  OUTREACH_RADIUS_KM,
} from 'common/outreach/outreach'
import {sleep} from 'common/util/time'
import {sendShareCompassEmail} from 'email/functions/helpers'
import {log} from 'shared/monitoring/log'
import {getLocalDensity} from 'shared/outreach/local-density'
import {recordOutreachSend} from 'shared/outreach/sends'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {getPrivateUser, getUser} from 'shared/utils'

/** Emails per run. Small on purpose — see the note on cadence below. */
const DEFAULT_BATCH_SIZE = 20

/** Provider courtesy, matching the pacing `createEmails` already uses for bulk sends. */
const PAUSE_BETWEEN_SENDS_MS = 2000

/**
 * Candidates for the personalised share email.
 *
 * Four exclusions, each load-bearing:
 *
 *   - anyone who joined less than `OUTREACH_MIN_DAYS_SINCE_SIGNUP` days ago. The send is once-only, so
 *     it is worth waiting until the member has been here long enough for the local number to mean
 *     something to them.
 *   - anyone already sent a `city_number` or `empty_room` message. The two are mutually exclusive and
 *     both are once-only, so the ledger is checked for either.
 *   - anyone in an active hand-written founder thread. A member being written to personally must not
 *     also receive a machine-written message making the same argument in the same week; it makes the
 *     personal one look automated, which is the one thing it can never look.
 *   - anyone without a city. There is no honest local number to quote them, and the generic fallback
 *     copy is not worth a once-only send.
 */
const CANDIDATES_SQL = `
  select u.id
  from users u
           join profiles p on p.user_id = u.id
  where not coalesce(u.is_banned_from_posting, false)
    and not coalesce(p.disabled, false)
    and u.created_time < now() - make_interval(days => $(minDaysSinceSignup))
    and p.looking_for_matches
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
 * The automated half of Contact #3a: the honest local number, sent to everyone the founder sequence
 * will never reach by hand.
 *
 * It quotes the same `OUTREACH_RADIUS_KM` figure the dashboard shows, not the wider historical radius,
 * because a member who later hears the tighter number from Martin directly must not find that the two
 * disagree.
 *
 * Members whose local number is *below* the threshold are skipped rather than sent a discouraging
 * count — they are the population Contact #E exists for, and that job picks them up. The two jobs
 * partition the directory between them; nobody gets both, and nobody gets neither.
 */
export const sendCityNumberEmails = async (opts?: {batchSize?: number; dryRun?: boolean}) => {
  const pg = createSupabaseDirectClient()
  const batchSize = opts?.batchSize ?? DEFAULT_BATCH_SIZE
  const dryRun = opts?.dryRun ?? false

  const candidates = await pg.manyOrNone<{id: string}>(CANDIDATES_SQL, {
    batchSize,
    minDaysSinceSignup: OUTREACH_MIN_DAYS_SINCE_SIGNUP,
  })

  let sent = 0
  let skippedThinRoom = 0
  let skippedNoDensity = 0
  let failed = 0

  for (const {id} of candidates) {
    try {
      const density = await getLocalDensity(id, {pg, radiusKm: OUTREACH_RADIUS_KM})
      if (!density) {
        skippedNoDensity++
        continue
      }
      if (density.count < EMPTY_ROOM_MAX_NEARBY) {
        skippedThinRoom++
        continue
      }

      if (dryRun) {
        debug('[city-number] would send', id, density.count, density.city)
        sent++
        continue
      }

      // Claim the send before making it. If a concurrent run got here first the insert loses and we
      // skip, which is the right way round: a missed email costs nothing, a duplicate costs the
      // credibility of a message whose whole point is that a person is behind it.
      const claimed = await recordOutreachSend(
        id,
        'city_number',
        {count: density.count, city: density.city, radiusKm: OUTREACH_RADIUS_KM},
        pg,
      )
      if (!claimed) continue

      const [user, privateUser] = await Promise.all([getUser(id), getPrivateUser(id)])
      if (!user || !privateUser) continue

      await sendShareCompassEmail(user, privateUser, density)
      sent++
      await sleep(PAUSE_BETWEEN_SENDS_MS)
    } catch (e) {
      failed++
      log.error('Failed to send city-number email', {userId: id, error: e})
    }
  }

  const result = {
    candidates: candidates.length,
    sent,
    skippedThinRoom,
    skippedNoDensity,
    failed,
    dryRun,
  }
  log.info('city-number email run complete', result)
  return result
}
