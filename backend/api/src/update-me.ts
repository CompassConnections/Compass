import { toUserAPIResponse } from 'common/api/user-types'
import { RESERVED_PATHS } from 'common/envs/constants'
import { cleanDisplayName, cleanUsername } from 'common/util/clean-username'
import { removeUndefinedProps } from 'common/util/object'
import { cloneDeep, mapValues } from 'lodash'
import { createSupabaseDirectClient } from 'shared/supabase/init'
import { getUser, getUserByUsername } from 'shared/utils'
import { APIError, APIHandler } from './helpers/endpoint'
import { updateUser } from 'shared/supabase/users'
import { broadcastUpdatedUser } from 'shared/websockets/helpers'
import { strip } from 'common/socials'

export const updateMe: APIHandler<'me/update'> = async (props, auth) => {
  const update = cloneDeep(props)

  const user = await getUser(auth.uid)
  if (!user) throw new APIError(401, 'Your account was not found')

  if (update.name) {
    update.name = cleanDisplayName(update.name)
  }

  if (update.username) {
    const cleanedUsername = cleanUsername(update.username)
    if (!cleanedUsername) throw new APIError(400, 'Invalid username')
    const reservedName = RESERVED_PATHS.includes(cleanedUsername)
    if (reservedName) throw new APIError(403, 'This username is reserved')
    const otherUserExists = await getUserByUsername(cleanedUsername)
    if (otherUserExists) throw new APIError(403, 'Username already taken')
    update.username = cleanedUsername
  }

  const pg = createSupabaseDirectClient()

  const { name, username, avatarUrl, link = {}, ...rest } = update
  await updateUser(pg, auth.uid, removeUndefinedProps(rest))

  if (update.website != undefined) link.site = update.website
  if (update.twitterHandle != undefined) link.x = update.twitterHandle
  if (update.discordHandle != undefined) link.discord = update.discordHandle

  const stripped = mapValues(
    link,
    (value, site) => value && strip(site as any, value)
  )

  const adds = {} as { [key: string]: string }
  const removes = []
  for (const [key, value] of Object.entries(stripped)) {
    if (value === null || value === '') {
      removes.push(key)
    } else if (value) {
      adds[key] = value
    }
  }

  let newLinks: any = null
  if (Object.keys(adds).length > 0 || removes.length > 0) {
    const data = await pg.oneOrNone(
      `update users 
      set data = jsonb_set(
        data, '{link}',
        (data->'link' || $(adds)) - $(removes)
      )
      where id = $(id)
      returning data->'link' as link`,
      { adds, removes, id: auth.uid }
    )
    newLinks = data?.link
  }

  if (name || username || avatarUrl) {
    if (name) {
      await pg.none(`update users set name = $1 where id = $2`, [
        name,
        auth.uid,
      ])
    }
    if (username) {
      await pg.none(`update users set username = $1 where id = $2`, [
        username,
        auth.uid,
      ])
    }
    if (avatarUrl) {
      await updateUser(pg, auth.uid, { avatarUrl })
    }

    broadcastUpdatedUser(
      removeUndefinedProps({
        id: auth.uid,
        name,
        username,
        avatarUrl,
        link: newLinks ?? undefined,
      })
    )
  }

  return toUserAPIResponse({ ...user, ...update, link: newLinks })
}
