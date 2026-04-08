import {PrivateUser} from 'common/user'
import {
  NOTIFICATION_DESTINATION_TYPES,
  notification_destination_types,
  notification_preference,
  notification_preferences,
} from 'common/user-notification-preferences'
import {debounce} from 'lodash'
import {useCallback} from 'react'
import {Row} from 'web/components/layout/row'
import {SwitchSetting} from 'web/components/switch-setting'
import {WithPrivateUser} from 'web/components/user/with-user'
import {usePersistentInMemoryState} from 'web/hooks/use-persistent-in-memory-state'
import {api} from 'web/lib/api'
import {useT} from 'web/lib/locale'

// Right now, "email" means emails and "browser" means in-app notifications + push notifs
// TODO: figure out what to do with "mobile"
const SHOWN_NOTIFICATION_DESTINATION_TYPES = NOTIFICATION_DESTINATION_TYPES.filter(
  (type) => type !== 'mobile',
)

export const NotificationSettings = () => (
  <WithPrivateUser>{(user) => <LoadedNotificationSettings privateUser={user} />}</WithPrivateUser>
)

function LoadedNotificationSettings(props: {privateUser: PrivateUser}) {
  const {privateUser} = props
  const [prefs, setPrefs] = usePersistentInMemoryState<notification_preferences>(
    privateUser.notificationPreferences,
    'notification-preferences',
  )
  console.log({prefs})

  const t = useT()

  const notificationTypes: {
    type: notification_preference
    question: string
  }[] = [
    {
      type: 'new_message',
      question: t('notifications.question.new_message', '... sends you a new message?'),
    },
    {
      type: 'new_match',
      question: t(
        'notifications.question.new_match',
        '... matches with you (private interest signals)?',
      ),
    },
    {
      type: 'new_endorsement',
      question: t('notifications.question.new_endorsement', '... endorses you?'),
    },
    {
      type: 'tagged_user',
      question: t('notifications.question.tagged_user', '... mentions you?'),
    },
    {
      type: 'new_search_alerts',
      question: t('notifications.question.new_search_alerts', 'Alerts from bookmarked searches?'),
    },
    {
      type: 'platform_updates',
      question: t(
        'notifications.question.platform_updates',
        'Platform updates (share, growth, new features, etc.)?',
      ),
    },
    {
      type: 'opt_out_all',
      question: t('notifications.question.opt_out_all', 'Opt out of all notifications?'),
    },
    // {
    //   type: 'new_profile_like',
    //   question: '... likes your profile?',
    // },
    // {
    //   type: 'new_profile_ship',
    //   question: '... ships you?',
    // },
    // {
    //   type: 'on_new_follow',
    //   question: '... follows you?',
    // },
  ]

  return (
    <Row className="mx-auto">
      <div className="flex flex-col gap-8 p-2">
        <Row className="justify-end gap-2">
          {SHOWN_NOTIFICATION_DESTINATION_TYPES.map((destinationType) => (
            <span className="text-ink-600 max-w-12 w-fit">
              {t(
                `notifications.options.${destinationType}`,
                destinationType === 'email' ? 'By email' : 'In the app',
              )}
            </span>
          ))}
        </Row>
        <p className="text-ink-700 font-medium pr-32">
          {t('notifications.heading', 'Where do you want to be notified when someone')}
        </p>
        {notificationTypes.map(({type, question}) => (
          <NotificationOption
            key={type}
            type={type}
            question={question}
            selected={prefs[type]}
            onUpdate={(selected) => {
              setPrefs((prevPrefs) => ({...prevPrefs, [type]: selected}))
            }}
            optOut={prefs.opt_out_all}
          />
        ))}
      </div>
    </Row>
  )
}

const NotificationOption = (props: {
  type: notification_preference
  question: string
  selected: notification_destination_types[]
  onUpdate: (selected: notification_destination_types[]) => void
  optOut: notification_destination_types[]
}) => {
  const {type, question, selected, onUpdate, optOut} = props

  const selectedValues = {
    email: selected?.includes('email'),
    browser: selected?.includes('browser'),
  } as Record<notification_destination_types, boolean>

  const setValue = async (checked: boolean, destinationType: notification_destination_types) => {
    const newDestinations = new Set(selected)
    if (checked) {
      newDestinations.add(destinationType)
    } else {
      newDestinations.delete(destinationType)
    }

    const result = Array.from(newDestinations)

    onUpdate(result)
    save(selected, result)
  }

  const save = useCallback(
    debounce(
      (
        oldDestinations: notification_destination_types[],
        newDestinations: notification_destination_types[],
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
      500,
    ),
    [],
  )

  if (!selected) return

  return (
    <Row className="gap-2 w-full justify-between">
      <div className="text-ink-700 font-medium">{question}</div>
      <Row className="gap-3">
        {SHOWN_NOTIFICATION_DESTINATION_TYPES.map((destinationType) => (
          <SwitchSetting
            checked={selectedValues[destinationType]}
            onChange={(checked) => setValue(checked, destinationType)}
            disabled={optOut.includes(destinationType) && type !== 'opt_out_all'}
          />
        ))}
      </Row>
    </Row>
  )
}
