import {toUserAPIResponse} from 'common/api/user-types'
import {RESERVED_PATHS} from 'common/envs/constants'
import {debug} from 'common/logger'
import {cleanDisplayName, cleanUsername} from 'common/util/clean-username'
import {removeUndefinedProps} from 'common/util/object'
import {cloneDeep} from 'lodash'
import {createSupabaseDirectClient} from 'shared/supabase/init'
import {updateUser, updateUserData} from 'shared/supabase/users'
import {getUser, getUserByUsername} from 'shared/utils'
import {broadcastUpdatedUser} from 'shared/websockets/helpers'

import {APIErrors, APIHandler} from './helpers/endpoint'

export const updateMe: APIHandler<'me/update'> = async (props, auth) => {
  const update = cloneDeep(props)

  const user = await getUser(auth.uid)
  if (!user) throw APIErrors.unauthorized('Your account was not found')

  if (update.name) {
    update.name = cleanDisplayName(update.name)
  }

  if (update.username) {
    const cleanedUsername = cleanUsername(update.username)
    if (!cleanedUsername) throw APIErrors.badRequest('Invalid username')
    const reservedName = RESERVED_PATHS.has(cleanedUsername)
    if (reservedName) throw APIErrors.forbidden('This username is reserved')
    const otherUserExists = await getUserByUsername(cleanedUsername)
    if (otherUserExists && otherUserExists.id !== auth.uid)
      throw APIErrors.conflict('Username is already taken')
    update.username = cleanedUsername
  }

  const pg = createSupabaseDirectClient()

  debug({update})

  const {name, username, avatarUrl, ...rest} = update
  await updateUserData(pg, auth.uid, removeUndefinedProps(rest))

  // Ensure clients listening on `user/{id}` (e.g. AuthContext via useWebsocketUser)
  // get notified about link-only changes as well.
  if (name || username || avatarUrl) {
    await updateUser(auth.uid, {name, username, avatarUrl})

    broadcastUpdatedUser(
      removeUndefinedProps({
        id: auth.uid,
        name,
        username,
        avatarUrl,
      }),
    )
  }

  return toUserAPIResponse({...user, ...update})
}
