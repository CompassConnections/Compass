import {type Notification, NOTIFICATION_TYPES_TO_SELECT, NOTIFICATIONS_PER_PAGE,} from 'common/notifications'
import {PrivateUser, type User} from 'common/src/user'
import {
  notification_destination_types,
  notification_preference,
  notification_preferences,
} from 'common/user-notification-preferences'
import {Fragment, useCallback, useEffect, useMemo, useState} from 'react'
import {NoSEO} from 'web/components/NoSEO'
import {Col} from 'web/components/layout/col'
import {UncontrolledTabs} from 'web/components/layout/tabs'
import {LovePage} from 'web/components/love-page'
import {NotificationItem} from 'web/components/notification-items'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {Pagination} from 'web/components/widgets/pagination'
import {Title} from 'web/components/widgets/title'
import {useGroupedNotifications} from 'web/hooks/use-notifications'
import {usePrivateUser, useUser} from 'web/hooks/use-user'
import {api} from 'web/lib/api'
import {MultiSelectAnswers} from 'web/components/answers/answer-compatibility-question-content'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {debounce} from 'lodash'
import {useRedirectIfSignedOut} from "web/hooks/use-redirect-if-signed-out";

export default function NotificationsPage() {
  useRedirectIfSignedOut()
  return (
    <LovePage trackPageView={'notifications page'}>
      <NoSEO/>
      <Title>Updates</Title>
      <UncontrolledTabs
        tabs={[
          {title: 'Notifications', content: <NotificationsContent/>},
          {title: 'Settings', content: <NotificationSettings/>},
        ]}
        trackingName={'notifications page'}
      />
    </LovePage>
  )
}

const NotificationsContent = () => {
  const user = useUser()
  if (!user) return <CompassLoadingIndicator/>
  return <LoadedNotificationsContent user={user}/>
}

function LoadedNotificationsContent(props: { user: User }) {
  const {user} = props
  const privateUser = usePrivateUser()

  const {groupedNotifications, mostRecentNotification} =
    useGroupedNotifications(user, NOTIFICATION_TYPES_TO_SELECT)

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
    <div className="relative mt-2 h-full w-full">
      <Col className={'min-h-[100vh] gap-0 text-sm'}>
        {groupedNotifications === undefined ||
        paginatedGroupedNotifications === undefined ? (
          <CompassLoadingIndicator/>
        ) : paginatedGroupedNotifications.length === 0 ? (
          <div className={'mt-2'}>You don't have any notifications, yet.</div>
        ) : (
          <RenderNotificationGroups
            notificationGroups={paginatedGroupedNotifications}
            totalItems={groupedNotifications.length}
            page={page}
            setPage={setPage}
          />
        )}
      </Col>
    </div>
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
      {notificationGroups.map((notification) => {
        return notification.notifications.map((notification: Notification) => (
          <Fragment key={notification.id}>
            <NotificationItem notification={notification}/>
            <div className="bg-ink-300 mx-2 box-border h-[1.5px]"/>
          </Fragment>
        ))
      })}

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

const NotificationSettings = () => {
  const privateUser = usePrivateUser()
  if (!privateUser) return null
  return <LoadedNotificationSettings privateUser={privateUser}/>
}

const LoadedNotificationSettings = (props: { privateUser: PrivateUser }) => {
  const {privateUser} = props

  const [prefs, setPrefs] =
    usePersistentInMemoryState<notification_preferences>(
      privateUser.notificationPreferences,
      'notification-preferences'
    )

  const notificationTypes: {
    type: notification_preference
    question: string
  }[] = [
    {
      type: 'new_match',
      question:
        'Where do you want to be notified when someone ... matches with you?',
    },
    {
      type: 'new_message',
      question: '... sends you a new message?',
    },
    {
      type: 'new_profile_like',
      question: '... likes your profile?',
    },
    {
      type: 'new_endorsement',
      question: '... endorses you?',
    },
    {
      type: 'new_profile_ship',
      question: '... ships you?',
    },
    {
      type: 'tagged_user',
      question: '... mentions you?',
    },
    {
      type: 'on_new_follow',
      question: '... follows you?',
    },
    {
      type: 'new_search_alerts',
      question: 'Alerts from bookmarked searches?',
    },
    {
      type: 'opt_out_all',
      question:
        'Regardless, do you NEVER want to be notified via any of these channels?',
    },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col gap-8 p-4">
        {notificationTypes.map(({type, question}) => (
          <NotificationOption
            key={type}
            type={type}
            question={question}
            selected={prefs[type]}
            onUpdate={(selected) => {
              setPrefs((prevPrefs) => ({...prevPrefs, [type]: selected}))
            }}
          />
        ))}
      </div>
    </div>
  )
}

const NotificationOption = (props: {
  type: notification_preference
  question: string
  selected: notification_destination_types[]
  onUpdate: (selected: notification_destination_types[]) => void
}) => {
  const {type, question, selected, onUpdate} = props

  const getSelectedValues = (destinations: string[]) => {
    const values: number[] = []
    if ((destinations ?? []).includes('email')) values.push(0)
    if ((destinations ?? []).includes('browser')) values.push(1)
    return values
  }

  const setValue = async (value: number[]) => {
    const newDestinations: notification_destination_types[] = []
    if (value.includes(0)) newDestinations.push('email')
    if (value.includes(1)) newDestinations.push('browser')

    onUpdate(newDestinations)
    save(selected, newDestinations)
  }

  const save = useCallback(
    debounce(
      (
        oldDestinations: notification_destination_types[],
        newDestinations: notification_destination_types[]
      ) => {
        // for each medium, if it changed, trigger a save
        const mediums = ['email', 'browser'] as const
        mediums.forEach((medium) => {
          const wasEnabled = oldDestinations.includes(medium)
          const isEnabled = newDestinations.includes(medium)
          if (wasEnabled !== isEnabled) {
            api('update-notif-settings', {
              type,
              medium,
              enabled: isEnabled,
            })
          }
        })
      },
      500
    ),
    []
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="text-ink-700 font-medium">{question}</div>
      <MultiSelectAnswers
        options={['By email', 'On notifications page']}
        values={getSelectedValues(selected)}
        setValue={setValue}
      />
    </div>
  )
}
