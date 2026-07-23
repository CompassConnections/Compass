import {createSupabaseDirectClient} from 'shared/supabase/init'
import {updatePrivateUser} from 'shared/supabase/users'
import {broadcastUpdatedPrivateUser} from 'shared/websockets/helpers'

import {type APIHandler} from './helpers/endpoint'

export const updateNotifSettings: APIHandler<'update-notif-settings'> = async (
  {type, medium, enabled},
  auth,
) => {
  const pg = createSupabaseDirectClient()
  if (type === 'opt_out_all' && medium === 'mobile') {
    await updatePrivateUser(pg, auth.uid, {
      interestedInPushNotifications: !enabled,
    })
  } else {
    // deep update array at data.notificationPreferences[type].
    // `type` and `medium` are passed as bound parameters (never interpolated into the SQL
    // text) and are additionally constrained by the Zod enums on the endpoint schema. The
    // jsonb path is built with array[...] so the key is a value, not raw SQL.
    await pg.none(
      `update private_users
      set data = jsonb_set(data, array['notificationPreferences', $1],
        coalesce(data->'notificationPreferences'->$1, '[]'::jsonb)
        ${enabled ? `|| to_jsonb($2::text)` : `- $2`}
      )
      where id = $3`,
      [type, medium, auth.uid],
    )
    broadcastUpdatedPrivateUser(auth.uid)
  }
}
