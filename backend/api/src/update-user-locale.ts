import {createSupabaseDirectClient} from 'shared/supabase/init'
import {updatePrivateUser} from 'shared/supabase/users'
import {broadcastUpdatedPrivateUser} from 'shared/websockets/helpers'

import {APIError, APIHandler} from './helpers/endpoint'

export const updateUserLocale: APIHandler<'update-user-locale'> = async ({locale}, auth) => {
  if (!auth?.uid) throw new APIError(401, 'Not authenticated')

  const pg = createSupabaseDirectClient()

  // Update the private user's data with the new locale
  await updatePrivateUser(pg, auth.uid, {
    locale,
  })

  broadcastUpdatedPrivateUser(auth.uid)
}
