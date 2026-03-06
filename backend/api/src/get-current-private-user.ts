import {Row} from 'common/supabase/utils'
import {PrivateUser} from 'common/user'
import {tryCatch} from 'common/util/try-catch'
import {createSupabaseDirectClient} from 'shared/supabase/init'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const getCurrentPrivateUser: APIHandler<'me/private'> = async (_, auth) => {
  const pg = createSupabaseDirectClient()

  const {data, error} = await tryCatch(
    pg.oneOrNone<Row<'private_users'>>('select * from private_users where id = $1', [auth.uid]),
  )

  if (error) {
    throw APIErrors.internalServerError('Error fetching private user data: ' + error.message)
  }

  if (!data) {
    throw APIErrors.unauthorized('Your account was not found')
  }

  return data.data as PrivateUser
}
