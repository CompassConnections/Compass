import {type Notification, NOTIFICATIONS_PER_PAGE} from 'common/notifications'
import {type User} from 'common/user'
import {first, groupBy, sortBy} from 'lodash'
import {useEffect, useMemo} from 'react'
import {api} from 'web/lib/api'
import {useApiSubscription} from './use-api-subscription'
import {usePersistentLocalState} from './use-persistent-local-state'

export function useGroupedUnseenNotifications(userId: string, selectTypes?: string[]) {
  const notifications = useUnseenNotifications(userId)?.filter((n) =>
    selectTypes ? selectTypes.includes(n.sourceType) : true,
  )
  return useMemo(() => {
    return notifications ? groupNotificationsForIcon(notifications) : undefined
  }, [notifications])
}

export function useGroupedNotifications(user: User, selectTypes?: string[]) {
  const notifications = useNotifications(user.id)?.filter((n) =>
    selectTypes ? selectTypes.includes(n.sourceType) : true,
  )
  const sortedNotifications = notifications
    ? sortBy(notifications, (n) => -n.createdTime)
    : undefined

  const [groupedNotifications, mostRecentNotification] = groupGeneralNotifications(
    sortedNotifications,
    ['loan_income', 'contract_from_followed_user'],
  )

  return useMemo(
    () => ({
      mostRecentNotification,
      groupedNotifications,
    }),
    [notifications],
  )
}

function groupGeneralNotifications(
  sortedNotifications: Notification[] | undefined,
  except: string[],
) {
  if (!sortedNotifications) return []

  const groupedNotificationsByDayAndContract = groupBy(
    sortedNotifications.filter((n) => !except.includes(n.reason ?? '')),
    (n) =>
      new Date(n.createdTime).toDateString() +
      (n.sourceType === 'betting_streak_bonus' || n.reason === 'quest_payout'
        ? 'quest_payout'
        : n.sourceType === 'profile_like'
          ? 'profile_like'
          : n.sourceType === 'profile_ship'
            ? 'profile_ship'
            : n.data?.isPartner
              ? 'isPartner'
              : 'unknown'),
  )
  const mostRecentNotification = first(sortedNotifications)
  const groupedNotifications = groupNotifications(groupedNotificationsByDayAndContract)

  return [groupedNotifications, mostRecentNotification] as const
}

function useNotifications(userId: string, count = 15 * NOTIFICATIONS_PER_PAGE) {
  const [notifications, setNotifications] = usePersistentLocalState<Notification[] | undefined>(
    undefined,
    'notifications-' + userId,
  )
  useEffect(() => {
    if (userId)
      api('get-notifications', {limit: count}).then((data) => {
        setNotifications(data)
      })
  }, [userId])

  useApiSubscription({
    topics: [`user-notifications/${userId}`],
    onBroadcast: ({data}) => {
      setNotifications((notifs) => [data.notification as Notification, ...(notifs ?? [])])
    },
  })
  return notifications
}

function useUnseenNotifications(userId: string, count = NOTIFICATIONS_PER_PAGE) {
  const notifs = useNotifications(userId, count)
  return notifs?.filter((n) => !n.isSeen)
}

const groupNotifications = (notifications: Record<string, Notification[]>) => {
  return Object.entries(notifications).map(([key, value]) => ({
    notifications: value,
    groupedById: key,
    isSeen: value.every((n: any) => n.isSeen),
  }))
}

function groupNotificationsForIcon(notifications: Notification[]) {
  const sortedNotifications = sortBy(notifications, (n) => -n.createdTime)
  const notificationGroupsByDayOrDayAndContract = groupBy(
    sortedNotifications,
    (notification) => new Date(notification.createdTime).toDateString() + notification.sourceTitle,
  )

  return groupNotifications(notificationGroupsByDayOrDayAndContract)
}
