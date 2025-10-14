import { Socials } from './socials'
import { notification_preferences } from './user-notification-preferences'

export type User = {
  id: string
  createdTime: number

  name: string
  username: string
  avatarUrl: string

  // For their user page
  bio?: string

  // Social links
  link: Socials

  // Legacy fields (deprecated)
  /** @deprecated Use link.site instead */
  website?: string
  /** @deprecated Use link.x instead */
  twitterHandle?: string
  /** @deprecated Use link.discord instead */
  discordHandle?: string
  /** @deprecated Use link.manifold instead */
  manifoldHandle?: string

  isBannedFromPosting?: boolean
  userDeleted?: boolean

  // fromLove?: boolean // whether originally from manifold.love back when it was synced to manifold
  // fromManifold?: boolean // whether has a manifold.markets account

  sweestakesVerified?: boolean
  verifiedPhone?: boolean
  idVerified?: boolean
}

export type PrivateUser = {
  id: string // same as User.id
  email?: string
  initialDeviceToken?: string
  initialIpAddress?: string
  notificationPreferences: notification_preferences
  blockedUserIds: string[]
  blockedByUserIds: string[]
}

export type UserActivity = {
  user_id: string // same as User.id
  last_online_time: string
}

export type UserAndPrivateUser = { user: User; privateUser: PrivateUser }

export function getCurrentUtcTime(): Date {
  const currentDate = new Date()
  const utcDate = currentDate.toISOString()
  return new Date(utcDate)
}
