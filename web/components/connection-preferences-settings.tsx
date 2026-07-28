import {CheckIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {useEffect, useState} from 'react'
import toast from 'react-hot-toast'
import {Row} from 'web/components/layout/row'
import {SettingsRow} from 'web/components/settings/settings-card'
import {SwitchSetting} from 'web/components/switch-setting'
import {useProfile} from 'web/hooks/use-profile'
import {updateProfile} from 'web/lib/api'
import {useT} from 'web/lib/locale'

/**
 * Renders as bare `SettingsRow`s so it can sit inside the Connections card on the settings page —
 * the card header now carries the title and the "control how others can connect with you" line that
 * this component used to print itself.
 */
export function ConnectionPreferencesSettings() {
  const t = useT()
  const profile = useProfile()

  const [allowDirectMessaging, setAllowDirectMessaging] = useState(
    profile?.allow_direct_messaging !== false,
  )
  const [allowInterestIndicating, setAllowInterestIndicating] = useState(
    profile?.allow_interest_indicating !== false,
  )

  const [isUpdating, setIsUpdating] = useState(false)
  // A fresh object per save, not just the field name: flipping the same toggle twice must show the
  // confirmation twice, and a state value that compares equal to itself would not re-fire the effect
  // that shows it.
  const [saved, setSaved] = useState<{field: string; at: number} | null>(null)

  const handleUpdate = async (field: string, value: boolean) => {
    setIsUpdating(true)
    try {
      await updateProfile({[field]: value})
      // toast.success(t('settings.connection_preferences.updated', 'Preferences updated'))
      setSaved({field, at: Date.now()})
    } catch (error) {
      console.error('Error updating preferences:', error)
      toast.error(
        t('settings.connection_preferences.update_failed', 'Failed to update preferences'),
      )
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDirectMessagingChange = (checked: boolean) => {
    setAllowDirectMessaging(checked)
    handleUpdate('allow_direct_messaging', checked)
  }

  const handleInterestIndicatingChange = (checked: boolean) => {
    setAllowInterestIndicating(checked)
    handleUpdate('allow_interest_indicating', checked)
  }

  return (
    <>
      <SettingsRow
        label={t('settings.connection_preferences.direct_messaging', 'Direct Messaging')}
        description={t(
          'settings.connection_preferences.dm_description',
          'Let anyone start a conversation with you immediately.',
        )}
      >
        <Row className="items-center gap-3">
          <SavedFlash field="allow_direct_messaging" saved={saved} />
          <SwitchSetting
            testId="settings-direct-message-toggle"
            checked={allowDirectMessaging}
            onChange={handleDirectMessagingChange}
            disabled={isUpdating}
            colorMode={'primary'}
          />
        </Row>
      </SettingsRow>

      <SettingsRow
        label={t('settings.connection_preferences.interest_indicator', 'Private interest signals')}
        description={t(
          'settings.connection_preferences.indicator_description',
          'Allow people to privately signal interest. You are only notified if the interest is mutual.',
        )}
      >
        <Row className="items-center gap-3">
          <SavedFlash field="allow_interest_indicating" saved={saved} />
          <SwitchSetting
            testId="settings-private-interest-signal-toggle"
            checked={allowInterestIndicating}
            onChange={handleInterestIndicatingChange}
            disabled={isUpdating}
            colorMode={'primary'}
          />
        </Row>
      </SettingsRow>
    </>
  )
}

/**
 * These toggles write straight through with no confirmation of any kind — the success toast has been
 * commented out for a while — so flipping one and being told nothing is indistinguishable from
 * flipping one and having it fail silently. A checkmark that fades after two seconds is the smallest
 * thing that closes that loop without a toast covering the page on every tap.
 */
function SavedFlash(props: {field: string; saved: {field: string; at: number} | null}) {
  const {field, saved} = props
  const [visible, setVisible] = useState(false)
  const t = useT()

  useEffect(() => {
    if (saved?.field !== field) return
    setVisible(true)
    const timer = setTimeout(() => setVisible(false), 2000)
    return () => clearTimeout(timer)
  }, [saved, field])

  return (
    <span
      aria-hidden={!visible}
      className={clsx(
        'text-ink-500 flex items-center gap-1 text-xs transition-opacity duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      )}
    >
      <CheckIcon className="h-3.5 w-3.5" />
      {t('settings.saved', 'Saved')}
    </span>
  )
}
