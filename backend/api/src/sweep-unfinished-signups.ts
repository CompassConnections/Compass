import {
  UNFINISHED_SIGNUP_GRACE_DAYS,
  UNFINISHED_SIGNUP_NOTICE_AFTER_DAYS,
  UNFINISHED_SIGNUP_STALE_AFTER_DAYS,
  UnfinishedSignupDeleteReason,
} from 'common/unfinished-signups'
import {DAY_MS} from 'common/util/time'
import {sendUnfinishedSignupEmail} from 'email/functions/helpers'
import * as admin from 'firebase-admin'
import {keyBy} from 'lodash'
import {log} from 'shared/monitoring/log'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {
  claimUnfinishedSignupNotice,
  deleteUnfinishedLogin,
  getDeleteUnfinishedSignupUrl,
} from 'shared/unfinished-signups'

/** Notices per run. Deletions are not capped: they are not emails, and nobody receives them. */
const DEFAULT_BATCH_SIZE = 50
/** Firebase's maximum page size for `listUsers`. */
const FIREBASE_PAGE_SIZE = 1000

export type UnfinishedSignupLedgerRow = {
  firebase_uid: string
  notified_at: Date | null
  deleted_at: Date | null
}

/** The slice of a Firebase user the decision needs. */
export type LoginFacts = {
  createdAt: Date
  /** Null when Firebase has no sign-in on record, which for a fresh login means the creation itself. */
  lastSignInAt: Date | null
  hasEmail: boolean
}

export type SweepAction =
  | {kind: 'skip'; why: 'too_recent' | 'waiting'}
  | {kind: 'notify'}
  | {kind: 'delete'; reason: UnfinishedSignupDeleteReason}

const daysBetween = (later: Date, earlier: Date) => (later.getTime() - earlier.getTime()) / DAY_MS

/**
 * What the retention rule says to do with one unfinished login today. Pure, so the rule can be read
 * and tested without Firebase or a database in the room.
 *
 * The order matters:
 *
 *   1. Anyone who signed in within the last `NOTICE_AFTER` days is left alone whatever else is true.
 *      They may be in the middle of the form right now, and a notice — let alone a deletion —
 *      arriving mid-onboarding is the one outcome worse than doing nothing.
 *   2. A notice already sent starts the grace clock, and the login goes when it runs out. The email
 *      quoted the number of days, so this is the sentence being kept.
 *   3. A login older than `STALE_AFTER` that never got a notice is deleted without one. See the
 *      constant for why silence is the more private choice there.
 *   4. Younger than `NOTICE_AFTER`: not abandoned yet.
 *   5. No address to write to: nothing to say, so the login simply gets the same total window the
 *      notified ones do, and then goes.
 *   6. Otherwise: the notice.
 *
 * A ledger row marked deleted for a login Firebase still lists means an earlier run wrote the row
 * and then the deletion did not stick (the helper deletes Firebase first, so this should not
 * happen — but "should not" is not a retention policy). It is retried with the reason the row
 * implies.
 */
export const decideUnfinishedSignup = (
  login: LoginFacts,
  row: UnfinishedSignupLedgerRow | undefined,
  now: Date,
): SweepAction => {
  const sinceSignIn = daysBetween(now, login.lastSignInAt ?? login.createdAt)
  if (sinceSignIn < UNFINISHED_SIGNUP_NOTICE_AFTER_DAYS) return {kind: 'skip', why: 'too_recent'}

  const age = daysBetween(now, login.createdAt)

  if (row?.deleted_at) {
    return {kind: 'delete', reason: row.notified_at ? 'grace_expired' : 'stale'}
  }
  if (row?.notified_at) {
    return daysBetween(now, row.notified_at) >= UNFINISHED_SIGNUP_GRACE_DAYS
      ? {kind: 'delete', reason: 'grace_expired'}
      : {kind: 'skip', why: 'waiting'}
  }
  if (age >= UNFINISHED_SIGNUP_STALE_AFTER_DAYS) return {kind: 'delete', reason: 'stale'}
  if (age < UNFINISHED_SIGNUP_NOTICE_AFTER_DAYS) return {kind: 'skip', why: 'too_recent'}
  if (!login.hasEmail) {
    return age >= UNFINISHED_SIGNUP_NOTICE_AFTER_DAYS + UNFINISHED_SIGNUP_GRACE_DAYS
      ? {kind: 'delete', reason: 'no_email'}
      : {kind: 'skip', why: 'waiting'}
  }
  return {kind: 'notify'}
}

const toLoginFacts = (user: admin.auth.UserRecord): LoginFacts => ({
  createdAt: new Date(user.metadata.creationTime),
  lastSignInAt: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : null,
  hasEmail: !!user.email,
})

/**
 * The daily sweep over Firebase Auth for logins that never became accounts.
 *
 * Walks every Firebase user, page by page, and for each page asks the database which of those uids
 * have a `users` row. The ones that do not are the unfinished sign-ups; what happens to each is
 * `decideUnfinishedSignup`'s call. It runs daily rather than on a longer cadence because the grace
 * period is a promise made in an email, and a weekly job can be up to six days late keeping it.
 *
 * Running it twice is harmless: the ledger decides whether a notice goes out, not the schedule, and
 * deleting an already-deleted login is a no-op. `dryRun` walks everything and reports the same
 * counts without sending, writing, or deleting — run it once by hand before the first real one, and
 * read the `stale` number before believing it.
 */
export const sweepUnfinishedSignups = async (opts?: {
  batchSize?: number
  dryRun?: boolean
  now?: Date
}) => {
  const pg = createSupabaseDirectClient()
  const batchSize = opts?.batchSize ?? DEFAULT_BATCH_SIZE
  const dryRun = opts?.dryRun ?? false
  const now = opts?.now ?? new Date()

  const result = {
    scanned: 0,
    unfinished: 0,
    notified: 0,
    deleted: {grace_expired: 0, stale: 0, no_email: 0} as Record<
      Exclude<UnfinishedSignupDeleteReason, 'self'>,
      number
    >,
    waiting: 0,
    tooRecent: 0,
    /** Notices the batch cap held back; they go out on the next run. */
    deferred: 0,
    failed: 0,
    dryRun,
  }

  let pageToken: string | undefined
  do {
    const page = await admin.auth().listUsers(FIREBASE_PAGE_SIZE, pageToken)
    pageToken = page.pageToken
    result.scanned += page.users.length
    const uids = page.users.map((u) => u.uid)
    if (uids.length === 0) continue

    const [known, ledger] = await Promise.all([
      pg.manyOrNone<{id: string}>(`select id from users where id = any($1)`, [uids]),
      pg.manyOrNone<UnfinishedSignupLedgerRow>(
        `select firebase_uid, notified_at, deleted_at
         from unfinished_signups
         where firebase_uid = any($1)`,
        [uids],
      ),
    ])
    const knownIds = new Set(known.map((r) => r.id))
    const ledgerByUid = keyBy(ledger, 'firebase_uid')

    for (const fbUser of page.users) {
      if (knownIds.has(fbUser.uid)) continue
      result.unfinished++

      const login = toLoginFacts(fbUser)
      const action = decideUnfinishedSignup(login, ledgerByUid[fbUser.uid], now)

      try {
        if (action.kind === 'skip') {
          if (action.why === 'waiting') result.waiting++
          else result.tooRecent++
          continue
        }

        if (action.kind === 'delete') {
          if (action.reason === 'self') continue // never decided here; keeps the record type honest
          if (!dryRun) {
            await deleteUnfinishedLogin(
              {uid: fbUser.uid, authCreatedAt: login.createdAt, reason: action.reason},
              pg,
            )
          }
          result.deleted[action.reason]++
          continue
        }

        // action.kind === 'notify'
        if (result.notified >= batchSize) {
          result.deferred++
          continue
        }
        if (dryRun) {
          result.notified++
          continue
        }
        const token = await claimUnfinishedSignupNotice(fbUser.uid, login.createdAt, pg)
        if (!token) continue // another run got there first
        const sent = await sendUnfinishedSignupEmail(fbUser.email as string, {
          createdAt: login.createdAt,
          deleteUrl: getDeleteUnfinishedSignupUrl(token),
        })
        if (!sent) {
          // The claim stands: the grace clock has started and the login will go on schedule, which
          // is the outcome the notice announces anyway. Logged so a run of these is visible.
          log.warn('Unfinished-signup notice was not delivered', {uid: fbUser.uid})
        }
        result.notified++
      } catch (e) {
        result.failed++
        log.error('Failed to process unfinished sign-up', {uid: fbUser.uid, error: e})
      }
    }
  } while (pageToken)

  log.info('unfinished-signups sweep complete', result)
  return result
}
