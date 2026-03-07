import {debug} from 'common/logger'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

export async function getMessagesCount() {
  const pg = createSupabaseDirectClient()
  const result = await pg.one(
    `
        SELECT COUNT(*) AS count
        FROM private_user_messages;
    `,
    [],
  )
  const count = Number(result.count)
  debug('private_user_messages count:', count)
  return {
    count: count,
  }
}

export const getMessagesCountEndpoint: APIHandler<'get-messages-count'> = async (_, _auth) => {
  return await getMessagesCount()
}
