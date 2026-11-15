import toast from 'react-hot-toast'
import {SettingsRow} from 'web/components/settings/settings-card'
import {SwitchSetting} from 'web/components/switch-setting'
import {usePauseProfile} from 'web/hooks/use-pause-profile'
import {useT} from 'web/lib/locale'

/**
 * The member's switch for pausing their profile.
 *
 * It sits at the end of the Account card, directly above the Danger Zone, on purpose: this is where
 * someone looking for a break goes looking, and it puts the reversible option in view at the moment
 * they are about to reach for the irreversible one. It used to be an item in the "..." menu on the
 * profile page, between Share and Edit — one click from taking yourself out of search by accident.
 *
 * No confirmation dialog: the description says what it does, the switch shows the state, and
 * undoing it is the same switch.
 */
export function PauseProfileSetting() {
  const t = useT()
  const {paused, setPaused, busy, ready} = usePauseProfile()

  const handleChange = async (checked: boolean) => {
    try {
      await setPaused(checked)
      toast.success(
        checked
          ? t('profile.header.toast.disabled', 'Profile paused')
          : t('profile.header.toast.enabled', 'Profile resumed'),
      )
    } catch {
      toast.error(
        checked
          ? t('profile.header.toast.failed_disable', 'Failed to pause profile')
          : t('profile.header.toast.failed_enable', 'Failed to resume profile'),
      )
    }
  }

  return (
    <SettingsRow
      label={t('settings.pause_profile.label', 'Pause your profile')}
      description={t(
        'settings.pause_profile.description',
        'Takes you out of search and hides your profile from other members. Your conversations and everything you wrote stay, and you can resume at any time.',
      )}
    >
      <SwitchSetting
        testId="settings-pause-profile-toggle"
        checked={paused}
        onChange={handleChange}
        disabled={busy || !ready}
        colorMode={'primary'}
      />
    </SettingsRow>
  )
}
