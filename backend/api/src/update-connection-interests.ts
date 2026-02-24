import {APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const updateConnectionInterests: APIHandler<'update-connection-interest'> = async (
  props,
  auth,
) => {
  const {targetUserId, connectionType, seeking} = props
  const pg = createSupabaseDirectClient()

  if (!connectionType) {
    throw new Error('Invalid connection type')
  }

  if (seeking) {
    // Insert or update the interest
    await pg.query(
      `INSERT INTO connection_interests (user_id, target_user_id, connection_type)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, target_user_id, connection_type) DO NOTHING`,
      [auth.uid, targetUserId, connectionType],
    )
  } else {
    // Remove the interest
    await pg.query(
      'DELETE FROM connection_interests WHERE user_id = $1 AND target_user_id = $2 AND connection_type = $3',
      [auth.uid, targetUserId, connectionType],
    )
  }

  return {success: true}
}
