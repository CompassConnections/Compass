import {debug} from 'common/logger'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIHandler} from './helpers/endpoint'

export async function getChannelsCount() {
  const pg = createSupabaseDirectClient()
  const result = await pg.one(
    `
        SELECT COUNT(*) AS count
        FROM private_user_message_channels;
    `,
    [],
  )
  const count = Number(result.count)
  debug('private_user_message_channels count:', count)
  return {
    count: count,
  }
}

export const getChannelsCountEndpoint: APIHandler<'get-channels-count'> = async (_, _auth) => {
  return await getChannelsCount()
}
