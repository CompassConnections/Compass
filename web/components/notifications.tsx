import {usePersistentInMemoryState} from "web/hooks/use-persistent-in-memory-state";
import {
  notification_destination_types,
  notification_preference,
  notification_preferences
} from "common/user-notification-preferences";
import {useCallback} from "react";
import {debounce} from "lodash";
import {api} from "web/lib/api";
import {MultiSelectAnswers} from "web/components/answers/answer-compatibility-question-content";
import {usePrivateUser} from "web/hooks/use-user";
import {PrivateUser} from "common/user";
import {CompassLoadingIndicator} from "web/components/widgets/loading-indicator";

export const NotificationSettings = () => {
  const privateUser = usePrivateUser()
  if (!privateUser) return <CompassLoadingIndicator/>
  return <LoadedNotificationSettings privateUser={privateUser}/>
}

function LoadedNotificationSettings(props: {
  privateUser: PrivateUser,
}) {
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
        '... matches with you?',
    },
    {
      type: 'new_message',
      question: '... sends you a new message?',
    },
    // {
    //   type: 'new_profile_like',
    //   question: '... likes your profile?',
    // },
    {
      type: 'new_endorsement',
      question: '... endorses you?',
    },
    // {
    //   type: 'new_profile_ship',
    //   question: '... ships you?',
    // },
    {
      type: 'tagged_user',
      question: '... mentions you?',
    },
    // {
    //   type: 'on_new_follow',
    //   question: '... follows you?',
    // },
    {
      type: 'new_search_alerts',
      question: 'Alerts from bookmarked searches?',
    },
    {
      type: 'opt_out_all',
      question:
        'Opt out of all notifications? (You can always change this later)',
    },
  ]

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col gap-8 p-4">
        <p className="text-ink-700 font-medium">Where do you want to be notified when someone</p>
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