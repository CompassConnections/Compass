import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

export const setVoteMute: APIHandler<'set-vote-mute'> = async ({voteId, muted}, auth) => {
  const pg = createSupabaseDirectClient()

  // Upserted rather than deleted on unmute: the row also carries last_notified_time, and throwing it
  // away would reset the notification throttle every time someone toggles the switch.
  await pg.none(
    `insert into vote_subscriptions (user_id, vote_id, muted)
       values ($1, $2, $3)
     on conflict (user_id, vote_id) do update set muted = excluded.muted`,
    [auth.uid, voteId, muted],
  )

  return {muted}
}

export const getVoteMute: APIHandler<'get-vote-mute'> = async ({voteId}, auth) => {
  const pg = createSupabaseDirectClient()

  const row = await pg.oneOrNone<{muted: boolean}>(
    `select muted from vote_subscriptions where user_id = $1 and vote_id = $2`,
    [auth.uid, voteId],
  )

  return {muted: row?.muted ?? false}
}
