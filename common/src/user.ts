import {notification_preferences} from './user-notification-preferences'

export type BaseUser = {
  id: string
  name: string
  username: string
}

export type User = BaseUser & {
  createdTime: number
  avatarUrl: string
  isBannedFromPosting?: boolean
  userDeleted?: boolean
  allow_direct_messaging?: boolean
  allow_interest_indicating?: boolean
}

export type PrivateUser = {
  id: string // same as User.id
  email?: string
  initialDeviceToken?: string
  initialIpAddress?: string
  notificationPreferences: notification_preferences
  blockedUserIds: string[]
  blockedByUserIds: string[]
  locale?: string
}

export type UserActivity = {
  user_id: string // same as User.id
  last_online_time: string
}

export type UserAndPrivateUser = {user: User; privateUser: PrivateUser}
