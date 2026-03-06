import {ENV_CONFIG, MOD_USERNAMES, WEB_URL} from 'common/envs/constants'
import {User} from 'common/user'
import {removeUndefinedProps} from 'common/util/object'

export type DisplayUser = {
  id: string
  name: string
  username: string
  avatarUrl: string
  isBannedFromPosting?: boolean
}

export type FullUser = User & {
  url: string
  isBot?: boolean
  isAdmin?: boolean
  isTrustworthy?: boolean
}

export function toUserAPIResponse(user: User): FullUser {
  return removeUndefinedProps({
    ...user,
    url: `${WEB_URL}/${user.username}`,
    isAdmin: ENV_CONFIG.adminIds.includes(user.id),
    isTrustworthy: MOD_USERNAMES.includes(user.username),
  })
}
