import clsx from 'clsx'
import {PrivateUser} from 'common/user'
import {
  NOTIFICATION_DESTINATION_TYPES,
  notification_destination_types,
  notification_preference,
  notification_preferences,
} from 'common/user-notification-preferences'
import {debounce} from 'lodash'
import {useCallback} from 'react'
import {Col} from 'web/components/layout/col'
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

  const t = useT()

  // Split so the "when someone ..." heading only sits above the rows that actually complete it.
  const socialNotificationTypes: {
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

  const otherNotificationTypes: {
    type: notification_preference
    question: string
  }[] = [
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
  ]

  const renderOption = ({type, question}: {type: notification_preference; question: string}) => (
    <NotificationOption
      key={type}
      type={type}
      question={question}
      selected={prefs[type] ?? NOTIFICATION_DESTINATION_TYPES}
      onUpdate={(selected) => {
        setPrefs((prevPrefs) => ({...prevPrefs, [type]: selected}))
      }}
      optOut={prefs.opt_out_all}
    />
  )

  return (
    <Col className="mt-4 w-full gap-6">
      <Col className="border-canvas-300 bg-canvas-50 overflow-hidden rounded-xl border">
        <div className="border-canvas-300 border-b px-4 py-3">
          <p className="text-ink-900 font-medium">
            {t('notifications.heading', 'Where do you want to be notified when someone')}
          </p>
        </div>
        <DestinationHeader />
        <Col className="divide-canvas-300 divide-y">
          {socialNotificationTypes.map(renderOption)}
        </Col>
      </Col>

      <Col className="border-canvas-300 bg-canvas-50 overflow-hidden rounded-xl border">
        <div className="border-canvas-300 border-b px-4 py-3">
          <p className="text-ink-900 font-medium">
            {t('notifications.section.other', 'Other updates')}
          </p>
        </div>
        <DestinationHeader />
        <Col className="divide-canvas-300 divide-y">{otherNotificationTypes.map(renderOption)}</Col>
      </Col>

      {/* Master switch: its own card so it doesn't read as just another "other update". The toggles
          still line up with the columns above, so it needs no repeated header. */}
      <Col className="border-canvas-300 bg-canvas-50 overflow-hidden rounded-xl border">
        {renderOption({
          type: 'opt_out_all',
          question: t('notifications.question.opt_out_all', 'Opt out of all notifications?'),
        })}
      </Col>
    </Col>
  )
}

// Same grid template as every option row, so the labels sit exactly over their toggles.
const OPTION_GRID = 'grid grid-cols-[minmax(0,1fr)_4.5rem_4.5rem] items-center gap-x-2'

const DestinationHeader = () => {
  const t = useT()
  return (
    <div className={clsx(OPTION_GRID, 'border-canvas-300 border-b px-4 py-2')}>
      <span />
      {SHOWN_NOTIFICATION_DESTINATION_TYPES.map((destinationType) => (
        <span
          key={destinationType}
          className="text-ink-500 text-center text-xs font-medium uppercase tracking-wide"
        >
          {t(
            `notifications.options.${destinationType}`,
            destinationType === 'email' ? 'By email' : 'In the app',
          )}
        </span>
      ))}
    </div>
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
    <div className={clsx(OPTION_GRID, 'hover:bg-canvas-100 px-4 py-3 transition-colors')}>
      <div className="text-ink-700 pr-2 text-sm">{question}</div>
      {SHOWN_NOTIFICATION_DESTINATION_TYPES.map((destinationType) => (
        <div key={destinationType} className="flex justify-center">
          <SwitchSetting
            checked={selectedValues[destinationType]}
            onChange={(checked) => setValue(checked, destinationType)}
            disabled={optOut.includes(destinationType) && type !== 'opt_out_all'}
          />
        </div>
      ))}
    </div>
  )
}
