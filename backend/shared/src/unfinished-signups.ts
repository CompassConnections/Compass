import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import {debug} from 'common/logger'
import {
  DELETE_UNFINISHED_SIGNUP_PATH,
  UnfinishedSignupDeleteReason,
} from 'common/unfinished-signups'
import crypto from 'crypto'
import * as admin from 'firebase-admin'
import {getBucket} from 'shared/firebase-utils'
import {createSupabaseDirectClient, SupabaseDirectClient} from 'shared/supabase/init'

/**
 * Claim the one notice a login gets, and hand back the token for its delete link.
 *
 * Same shape as `recordOutreachSend`: the insert is the lock. Two runs racing on the same uid both
 * try to insert, one wins, and only the winner gets a token back — so only the winner sends.
 * Returns null when the row already exists, whether the notice went out an hour ago or the login
 * was already deleted.
 */
export const claimUnfinishedSignupNotice = async (
  uid: string,
  authCreatedAt: Date,
  pg: SupabaseDirectClient = createSupabaseDirectClient(),
): Promise<string | null> => {
  const token = crypto.randomBytes(32).toString('hex')
  const row = await pg.oneOrNone<{token: string}>(
    `insert into unfinished_signups (firebase_uid, auth_created_at, token, notified_at)
     values ($1, $2, $3, now())
     on conflict (firebase_uid) do nothing
     returning token`,
    [uid, authCreatedAt, token],
  )
  return row?.token ?? null
}

export const getDeleteUnfinishedSignupUrl = (token: string) =>
  `${DEPLOYED_WEB_URL}${DELETE_UNFINISHED_SIGNUP_PATH}?token=${token}`

/**
 * Remove a login that never became an account, and everything that came with it.
 *
 * Three things go, in this order: the Firebase Auth user, any files under `user-images/<uid>` (the
 * onboarding form uploads photos before the account exists — see `deleteUserFiles` for why the uid
 * prefix is the one that catches them), and then the ledger row is marked. Firebase first so that a
 * crash between the steps leaves a ledger that under-reports a deletion rather than one that claims
 * a deletion which never happened; the next sweep simply finds the login gone.
 *
 * Idempotent on the Firebase side: a login already deleted — by an earlier partial run, or by the
 * person through the link — is not an error.
 *
 * The caller is responsible for having checked that no `users` row exists for the uid. This helper
 * does not re-check, because the endpoint and the sweep each do so in the way that suits them, and
 * a second check here would be the kind of belt-and-braces that hides which one was load-bearing.
 */
export const deleteUnfinishedLogin = async (
  {
    uid,
    authCreatedAt,
    reason,
  }: {uid: string; authCreatedAt: Date; reason: UnfinishedSignupDeleteReason},
  pg: SupabaseDirectClient = createSupabaseDirectClient(),
) => {
  // `user-images/` with nothing after it would match the whole bucket.
  if (!uid) throw new Error('deleteUnfinishedLogin: uid is required')

  try {
    await admin.auth().deleteUser(uid)
  } catch (e: any) {
    if (e?.code !== 'auth/user-not-found') throw e
    debug(`Login ${uid} already gone from Firebase Auth`)
  }

  const [files] = await getBucket().getFiles({prefix: `user-images/${uid}`})
  await Promise.all(files.map((file) => file.delete()))
  if (files.length) debug(`Deleted ${files.length} files for unfinished login ${uid}`)

  // Upsert rather than update: `stale` and `no_email` deletions never had a notice row.
  await pg.none(
    `insert into unfinished_signups (firebase_uid, auth_created_at, token, deleted_at, delete_reason)
     values ($1, $2, $3, now(), $4)
     on conflict (firebase_uid) do update
         set deleted_at = excluded.deleted_at,
             delete_reason = excluded.delete_reason`,
    [uid, authCreatedAt, crypto.randomBytes(32).toString('hex'), reason],
  )
}
