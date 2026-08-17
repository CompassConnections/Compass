import {CheckIcon} from '@heroicons/react/24/outline'
import {useState} from 'react'
import toast from 'react-hot-toast'
import {Row} from 'web/components/layout/row'
import {SettingsRow} from 'web/components/settings/settings-card'
import {SwitchSetting} from 'web/components/switch-setting'
import {useProfile} from 'web/hooks/use-profile'
import {updateProfile} from 'web/lib/api'
import {useT} from 'web/lib/locale'

/**
 * The member half of the spotlight gate (see `common/profiles/spotlights.ts`).
 *
 * Ticking this is permission, not publication: nothing happens until an admin builds a snapshot and
 * sets it live, and unticking it pulls any live card off the home page within a minute. The
 * description says so in as many words, because "may we feature you" and "are you featured" are the
 * two things a reader will confuse here, and the cost of that confusion is somebody discovering their
 * face on the front page when they thought they had opted into a maybe.
 *
 * Lives in Data & Privacy rather than Connection Preferences: the other toggles there govern who may
 * contact you, and this one governs where your profile is shown.
 */
export function SpotlightConsentSetting() {
  const t = useT()
  const profile = useProfile()

  const [consent, setConsent] = useState(profile?.spotlight_consent === true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [saved, setSaved] = useState<number | null>(null)

  const handleChange = async (checked: boolean) => {
    setConsent(checked)
    setIsUpdating(true)
    try {
      await updateProfile({spotlight_consent: checked})
      setSaved(Date.now())
      setTimeout(() => setSaved(null), 2000)
    } catch (_error) {
      // Put the switch back where it was: leaving it showing the state the member asked for, after
      // the write that would have made it true failed, is the one outcome this setting must not have.
      setConsent(!checked)
      toast.error(t('settings.spotlight.failed', 'Could not save that — try again?'))
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <SettingsRow
      label={t('settings.spotlight.label', 'Let Compass feature your profile')}
      description={t(
        'settings.spotlight.description',
        'Admins may quote a passage from your bio, with your name, photo and city, on the public home page. You can turn this off at any time, which removes it.',
      )}
    >
      <Row className="items-center gap-3">
        {saved && (
          <span className="text-primary-600 flex items-center gap-1 text-xs">
            <CheckIcon className="h-4 w-4" aria-hidden />
            {t('settings.spotlight.saved', 'Saved')}
          </span>
        )}
        <SwitchSetting
          testId="settings-spotlight-consent-toggle"
          checked={consent}
          onChange={handleChange}
          disabled={isUpdating}
          colorMode={'primary'}
        />
      </Row>
    </SettingsRow>
  )
}
