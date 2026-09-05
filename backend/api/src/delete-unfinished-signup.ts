import {createSupabaseDirectClient} from 'shared/supabase/init'
import {deleteUnfinishedLogin} from 'shared/unfinished-signups'

import {APIHandler} from './helpers/endpoint'

/**
 * The "delete this login now" link from the unfinished-sign-up notice.
 *
 * Unauthenticated by necessity — the person has no account to be authenticated as, and asking them
 * to sign in to delete the thing they never finished signing up for would be its own small cruelty.
 * The token is the credential: 32 random bytes that only ever went to the address on the login.
 *
 * Three answers, none of them an error. An unknown token and an already-deleted login both come
 * back as `gone`, so the endpoint cannot be used to probe which tokens exist. `has_account` is the
 * one case where the link must do nothing: they came back and finished after the notice went out,
 * and a full account is deleted from settings, on purpose, with a survey — not from a link in an
 * old email.
 */
export const deleteUnfinishedSignup: APIHandler<'delete-unfinished-signup'> = async ({token}) => {
  const pg = createSupabaseDirectClient()

  const row = await pg.oneOrNone<{
    firebase_uid: string
    auth_created_at: Date
    deleted_at: Date | null
  }>(
    `select firebase_uid, auth_created_at, deleted_at
     from unfinished_signups
     where token = $1`,
    [token],
  )
  if (!row || row.deleted_at) return {status: 'gone' as const}

  const account = await pg.oneOrNone<{id: string}>(`select id from users where id = $1`, [
    row.firebase_uid,
  ])
  if (account) return {status: 'has_account' as const}

  await deleteUnfinishedLogin(
    {uid: row.firebase_uid, authCreatedAt: row.auth_created_at, reason: 'self'},
    pg,
  )
  return {status: 'deleted' as const}
}
