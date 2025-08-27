import { createSupabaseDirectClient } from 'shared/supabase/init'
import { APIError, APIHandler } from './helpers/endpoint'
import { PrivateUser } from 'common/user'
import { Row } from 'common/supabase/utils'
import { tryCatch } from 'common/util/try-catch'

export const getCurrentPrivateUser: APIHandler<'me/private'> = async (
  _,
  auth
) => {
  const pg = createSupabaseDirectClient()

  const { data, error } = await tryCatch(
    pg.oneOrNone<Row<'private_users'>>(
      'select * from private_users where id = $1',
      [auth.uid]
    )
  )

  if (error) {
    throw new APIError(
      500,
      'Error fetching private user data: ' + error.message
    )
  }

  if (!data) {
    throw new APIError(401, 'Your account was not found')
  }

  return data.data as PrivateUser
}
