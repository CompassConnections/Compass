import {useState} from 'react'
import toast from 'react-hot-toast'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SwitchSetting} from 'web/components/switch-setting'
import {useProfile} from 'web/hooks/use-profile'
import {updateProfile} from 'web/lib/api'
import {useT} from 'web/lib/locale'

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

  const handleUpdate = async (field: string, value: boolean) => {
    setIsUpdating(true)
    try {
      await updateProfile({[field]: value})
      // toast.success(t('settings.connection_preferences.updated', 'Preferences updated'))
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
    <Col className="gap-4">
      <div className="text-sm text-ink-500">
        {t(
          'settings.connection_preferences.description',
          'Control how others can connect with you.',
        )}
      </div>

      <Row className="items-center justify-between gap-4">
        <div className="flex-1">
          <div className="font-medium">
            {t('settings.connection_preferences.direct_messaging', 'Direct Messaging')}
          </div>
          <div className="text-ink-500 text-sm">
            {t(
              'settings.connection_preferences.dm_description',
              'Let anyone start a conversation with you immediately.',
            )}
          </div>
        </div>
        <SwitchSetting
          checked={allowDirectMessaging}
          onChange={handleDirectMessagingChange}
          disabled={isUpdating}
          colorMode={'primary'}
        />
      </Row>

      <Row className="items-center justify-between gap-4">
        <div className="flex-1">
          <div className="font-medium">
            {t('settings.connection_preferences.interest_indicator', 'Private interest signals')}
          </div>
          <div className="text-ink-500 text-sm">
            {t(
              'settings.connection_preferences.indicator_description',
              'Allow people to privately signal interest. You are only notified if the interest is mutual.',
            )}
          </div>
        </div>
        <SwitchSetting
          checked={allowInterestIndicating}
          onChange={handleInterestIndicatingChange}
          disabled={isUpdating}
          colorMode={'primary'}
        />
      </Row>
    </Col>
  )
}
