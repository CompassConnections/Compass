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
 * The member half of the spotlight gate (see `common/profiles/spotlights.ts`), plus the narrower
 * consent nested under it: may we also feature the profile on Compass's own social accounts?
 *
 * Ticking the first is permission, not publication: nothing happens until an admin builds a snapshot
 * and sets it live, and unticking it pulls any live card off the home page within a minute. The
 * description says so in as many words, because "may we feature you" and "are you featured" are the
 * two things a reader will confuse here, and the cost of that confusion is somebody discovering their
 * face on the front page when they thought they had opted into a maybe.
 *
 * The second is nested rather than a sibling because it is strictly the larger ask made of someone who
 * has already said yes to the smaller one, and because the two revoke very differently — a home-page
 * card comes down at read time, an Instagram post does not come down at all. That asymmetry is stated
 * in the sub-row's own description rather than left for a member to discover afterwards.
 *
 * Lives in Data & Privacy rather than Connection Preferences: the other toggles there govern who may
 * contact you, and these govern where your profile is shown.
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
  const [pendingSocial, setPendingSocial] = useState<boolean | null>(null)
  const consent = pendingConsent ?? profile?.spotlight_consent === true
  const socialConsent = pendingSocial ?? profile?.social_media_consent === true
  const [isUpdating, setIsUpdating] = useState(false)
  const [saved, setSaved] = useState<number | null>(null)

  const handleChange = async (checked: boolean) => {
    const previous = consent
    const previousSocial = socialConsent
    setPendingConsent(checked)
    setIsUpdating(true)
    try {
      // Turning the parent off clears the child in the same write. Leaving it stored-but-inert would
      // mean that re-ticking "feature my profile" months later silently restores permission to post
      // the profile to Instagram — consent the member gave once and never re-affirmed. Cheaper to ask
      // again than to assume.
      if (checked) {
        await updateProfile({spotlight_consent: true})
      } else {
        setPendingSocial(false)
        await updateProfile({spotlight_consent: false, social_media_consent: false})
      }
      setSaved(Date.now())
      setTimeout(() => setSaved(null), 2000)
    } catch (_error) {
      // Put the switch back where it was: leaving it showing the state the member asked for, after
      // the write that would have made it true failed, is the one outcome this setting must not have.
      setPendingConsent(previous)
      setPendingSocial(previousSocial)
      toast.error(t('settings.spotlight.failed', 'Could not save that — try again?'))
    } finally {
      setIsUpdating(false)
    }
  }

  const handleSocialChange = async (checked: boolean) => {
    const previous = socialConsent
    setPendingSocial(checked)
    setIsUpdating(true)
    try {
      await updateProfile({social_media_consent: checked})
      setSaved(Date.now())
      setTimeout(() => setSaved(null), 2000)
    } catch (_error) {
      setPendingSocial(previous)
      toast.error(t('settings.spotlight.failed', 'Could not save that — try again?'))
    } finally {
      setIsUpdating(false)
    }
  }

  const savedFlag = saved ? (
    <span className="text-primary-600 flex items-center gap-1 text-xs">
      <CheckIcon className="h-4 w-4" aria-hidden />
      {t('settings.spotlight.saved', 'Saved')}
    </span>
  ) : null

  return (
    <>
      <SettingsRow
        label={t('settings.spotlight.label', 'Let Compass feature your profile')}
        description={t(
          'settings.spotlight.description',
          'We may quote a passage from your bio, with your name, photo and city, on the public home page. Visitors sign up when they see real people rather than statistics, so this is what brings new members in — and yours is the profile they meet first. You can turn this off at any time, which removes it.',
        )}
      >
        <Row className="items-center gap-3">
          {savedFlag}
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

      {/* Only offered once the parent is on — an off parent makes this consent inert, and a live
          switch that changes nothing is worse than no switch. */}
      {consent && (
        <SettingsRow
          className="border-primary-500/30 bg-canvas-50/50 border-l-2 pl-6 sm:pl-8"
          label={t('settings.spotlight.social.label', '…including on our social media')}
          description={t(
            'settings.spotlight.social.description',
            'Lets us post your profile on the Compass accounts — typically a short scroll through your profile page on Instagram or X. That is how most people outside Compass first hear of it, and a clip travels much further than the home page. Turning this off stops us making anything new, but a post that is already public cannot be unpublished everywhere; email us and we will take down what we control.',
          )}
        >
          <Row className="items-center gap-3">
            <SwitchSetting
              testId="settings-social-media-consent-toggle"
              checked={socialConsent}
              onChange={handleSocialChange}
              disabled={isUpdating || profile === undefined}
              colorMode={'primary'}
            />
          </Row>
        </SettingsRow>
      )}
    </>
  )
}
