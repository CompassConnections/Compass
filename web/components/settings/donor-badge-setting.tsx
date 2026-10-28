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
 * The member's switch for the supporter badge (see `common/donations.ts`).
 *
 * On by default: the badge appears once an admin records a donation, and this takes it off. Shown
 * to every member rather than only to donors, because knowing whether someone has donated would
 * need a signed-in read that the public, cached badge endpoint deliberately is not — and a switch
 * that says "if you have donated" is cheap to leave in place for someone who has not.
 *
 * Same derive-then-override pattern as `SpotlightConsentSetting`: the profile arrives a beat after
 * first render, and the cached profile is not refetched after our write.
 */
export function DonorBadgeSetting() {
  const t = useT()
  const profile = useProfile()

  const [pendingShown, setPendingShown] = useState<boolean | null>(null)
  const shown = pendingShown ?? profile?.donor_badge_hidden !== true
  const [isUpdating, setIsUpdating] = useState(false)
  const [saved, setSaved] = useState<number | null>(null)

  const handleChange = async (checked: boolean) => {
    const previous = shown
    setPendingShown(checked)
    setIsUpdating(true)
    try {
      await updateProfile({donor_badge_hidden: !checked})
      setSaved(Date.now())
      setTimeout(() => setSaved(null), 2000)
    } catch (_error) {
      setPendingShown(previous)
      toast.error(t('settings.donor_badge.failed', 'Could not save that — try again?'))
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <SettingsRow
      label={t('settings.donor_badge.label', 'Show your supporter badge')}
      description={t(
        'settings.donor_badge.description',
        'If you have donated to Compass in the past year, your profile shows a small badge with the total, as a thank-you and a nudge to others. Turn this off to keep your support private.',
      )}
    >
      <Row className="items-center gap-3">
        {saved ? (
          <span className="text-primary-700 flex items-center gap-1 text-xs">
            <CheckIcon className="h-4 w-4" aria-hidden />
            {t('settings.donor_badge.saved', 'Saved')}
          </span>
        ) : null}
        <SwitchSetting
          testId="settings-donor-badge-toggle"
          checked={shown}
          onChange={handleChange}
          disabled={isUpdating || profile === undefined}
          colorMode={'primary'}
        />
      </Row>
    </SettingsRow>
  )
}
