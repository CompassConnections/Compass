import {APIHandler} from 'api/helpers/endpoint'
import {createSupabaseDirectClient} from 'shared/supabase/init'

export const getConnectionInterestsEndpoint: APIHandler<'get-connection-interests'> = async (
  props,
  auth,
) => {
  return getConnectionInterests(props, auth.uid)
}

export const getConnectionInterests = async (props: any, userId: string) => {
  const {targetUserId} = props

  if (!targetUserId) {
    throw new Error('Missing target user ID')
  }

  if (targetUserId === userId) {
    throw new Error('Cannot get connection interests for yourself')
  }

  const pg = createSupabaseDirectClient()

  // Get what connection interest I have with them
  const _interests = await pg.query(
    'SELECT connection_type FROM connection_interests WHERE user_id = $1 AND target_user_id = $2',
    [userId, targetUserId],
  )
  const interests = _interests.map((i: {connection_type: string}) => i.connection_type) ?? []
  console.log({_interests, interests})

  // Get what connection interest they have with me (filtering out the ones I haven't expressed interest in
  // so it's risk-free to express interest in them)
  const _targetInterests = await pg.query(
    'SELECT connection_type FROM connection_interests WHERE user_id = $1 AND target_user_id = $2',
    [targetUserId, userId],
  )
  const targetInterests =
    _targetInterests
      ?.map((i: {connection_type: string}) => i.connection_type)
      ?.filter((i: string) => interests.includes(i)) ?? []

  return {
    interests,
    targetInterests,
  }
}
