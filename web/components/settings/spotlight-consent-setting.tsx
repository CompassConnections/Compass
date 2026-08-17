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

  // `useProfile()` is undefined on the first render and filled in by a fetch in an effect, so seeding
  // this with `useState(profile?.spotlight_consent === true)` froze the switch in the "off" position
  // for a member who had in fact consented — the stored answer arrived a beat too late to be read.
  // Derive from the profile instead, and only hold a local value once the member has flipped it
  // themselves: the cached profile is not refetched after our write, so it would otherwise reassert
  // the pre-write answer over the one they just gave.
  const [pendingConsent, setPendingConsent] = useState<boolean | null>(null)
  const consent = pendingConsent ?? profile?.spotlight_consent === true
  const [isUpdating, setIsUpdating] = useState(false)
  const [saved, setSaved] = useState<number | null>(null)

  const handleChange = async (checked: boolean) => {
    const previous = consent
    setPendingConsent(checked)
    setIsUpdating(true)
    try {
      await updateProfile({spotlight_consent: checked})
      setSaved(Date.now())
      setTimeout(() => setSaved(null), 2000)
    } catch (_error) {
      // Put the switch back where it was: leaving it showing the state the member asked for, after
      // the write that would have made it true failed, is the one outcome this setting must not have.
      setPendingConsent(previous)
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
          // Also inert until the profile lands, so a click can't be made against a switch that is
          // still showing the default rather than the member's stored answer.
          disabled={isUpdating || profile === undefined}
          colorMode={'primary'}
        />
      </Row>
    </SettingsRow>
  )
}
