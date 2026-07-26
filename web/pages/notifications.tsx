import {BellIcon} from '@heroicons/react/24/outline'
import {type Notification, NOTIFICATIONS_PER_PAGE} from 'common/notifications'
import {type User} from 'common/src/user'
import {range} from 'lodash'
import {useEffect, useMemo, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {UncontrolledTabs} from 'web/components/layout/tabs'
import {NoSEO} from 'web/components/NoSEO'
import {NotificationItem} from 'web/components/notification-items'
import {NotificationSettings} from 'web/components/notifications'
import {PageBase} from 'web/components/page-base'
import {Pagination} from 'web/components/widgets/pagination'
import {Title} from 'web/components/widgets/title'
import {useGroupedNotifications} from 'web/hooks/use-notifications'
import {useRedirectIfSignedOut} from 'web/hooks/use-redirect-if-signed-out'
import {usePrivateUser, useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

export default function NotificationsPage() {
  useRedirectIfSignedOut()
  const t = useT()

  return (
    <PageBase trackPageView={'notifications page'} className={'mx-4'}>
      <NoSEO title={t('notifications.title', 'Updates')} />
      <Col className={'mx-auto w-full max-w-3xl'}>
        <Title className={'mb-2 sm:mb-3'}>{t('notifications.title', 'Updates')}</Title>
        <UncontrolledTabs
          name={'notifications-page'}
          tabs={[
            {
              title: t('notifications.tabs.notifications', 'Notifications'),
              content: <NotificationsContent />,
            },
            {
              title: t('notifications.tabs.settings', 'Settings'),
              content: <NotificationSettings />,
            },
          ]}
          trackingName={'notifications page'}
        />
      </Col>
    </PageBase>
  )
}

const NotificationsContent = () => {
  const user = useUser()
  if (!user) return <NotificationsSkeleton />
  return <LoadedNotificationsContent user={user} />
}

// Card shell shared by the list, the skeleton and the empty state so they all land on the same frame.
const NotificationCard = (props: {children: React.ReactNode}) => (
  <Col
    className={
      'divide-canvas-300 border-canvas-300 bg-canvas-50 divide-y overflow-hidden rounded-xl border'
    }
  >
    {props.children}
  </Col>
)

const NotificationsSkeleton = () => (
  <NotificationCard>
    {range(0, 5).map((i) => (
      <Row key={i} className={'animate-pulse items-start gap-3 py-3 pl-3 pr-3 sm:pl-4'}>
        <div className={'bg-canvas-200 h-10 w-10 flex-none rounded-full'} />
        <Col className={'min-w-0 flex-1 gap-2 pt-1'}>
          <div className={'bg-canvas-200 h-3 w-1/3 rounded'} />
          <div className={'bg-canvas-200 h-3 w-2/3 rounded'} />
        </Col>
        <div className={'bg-canvas-200 mt-1 h-3 w-8 flex-none rounded'} />
      </Row>
    ))}
  </NotificationCard>
)

function LoadedNotificationsContent(props: {user: User}) {
  const {user} = props
  const t = useT()
  const privateUser = usePrivateUser()

  const {groupedNotifications, mostRecentNotification} = useGroupedNotifications(
    user,
    // NOTIFICATION_TYPES_TO_SELECT
  )

  const [page, setPage] = useState(0)

  const paginatedGroupedNotifications = useMemo(() => {
    const start = page * NOTIFICATIONS_PER_PAGE
    const end = start + NOTIFICATIONS_PER_PAGE
    return groupedNotifications?.slice(start, end)
  }, [groupedNotifications, page])

  // Mark all notifications as seen. Rerun as new notifications come in.
  useEffect(() => {
    if (!privateUser) return
    api('mark-all-notifs-read', {seen: true})
    groupedNotifications
      ?.map((ng) => ng.notifications)
      .flat()
      .forEach((n) => (!n.isSeen ? (n.isSeen = true) : null))
  }, [privateUser, mostRecentNotification?.id])

  if (!privateUser) return null

  return (
    <Col className={'mt-4 w-full gap-4 text-sm'}>
      {groupedNotifications === undefined || paginatedGroupedNotifications === undefined ? (
        <NotificationsSkeleton />
      ) : paginatedGroupedNotifications.length === 0 ? (
        <Col
          className={
            'border-canvas-300 items-center gap-2 rounded-xl border border-dashed px-6 py-16 text-center'
          }
        >
          <BellIcon className={'text-ink-400 h-10 w-10'} aria-hidden="true" />
          <div className={'text-ink-900 font-medium'}>
            {t('notifications.empty', "You don't have any notifications, yet.")}
          </div>
          <div className={'text-ink-500 max-w-xs text-sm'}>
            {t(
              'notifications.empty_subtitle',
              'When someone reciprocates your private interest or endorses you, or when we have platform announcements, it will show up here.',
            )}
          </div>
        </Col>
      ) : (
        <RenderNotificationGroups
          notificationGroups={paginatedGroupedNotifications}
          totalItems={groupedNotifications.length}
          page={page}
          setPage={setPage}
        />
      )}
    </Col>
  )
}

export type NotificationGroup = {
  notifications: Notification[]
  groupedById: string
  isSeen: boolean
}

function RenderNotificationGroups(props: {
  notificationGroups: NotificationGroup[]
  totalItems: number
  page: number
  setPage: (page: number) => void
}) {
  const {notificationGroups, page, setPage, totalItems} = props

  return (
    <>
      <NotificationCard>
        {notificationGroups.map((notification) => {
          return notification.notifications.map((notification: Notification) => (
            <NotificationItem key={notification.id} notification={notification} />
          ))
        })}
      </NotificationCard>

      {notificationGroups.length > 0 && totalItems > NOTIFICATIONS_PER_PAGE && (
        <Pagination
          page={page}
          pageSize={NOTIFICATIONS_PER_PAGE}
          totalItems={totalItems}
          setPage={setPage}
          savePageToQuery={true}
        />
      )}
    </>
  )
}
