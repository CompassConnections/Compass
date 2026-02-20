import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

export const getMessagesCount: APIHandler<'get-messages-count'> = async (_, _auth) => {
  const pg = createSupabaseDirectClient()
  const result = await pg.one(
    `
        SELECT COUNT(*) AS count
        FROM private_user_messages;
    `,
    [],
  )
  const count = Number(result.count)
  console.debug('private_user_messages count:', count)
  return {
    count: count,
  }
}
