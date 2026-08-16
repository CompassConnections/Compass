import {useEffect, useState} from 'react'
import {Row} from 'web/components/layout/row'
import {SettingsRow} from 'web/components/settings/settings-card'
import {SwitchSetting} from 'web/components/switch-setting'
import {getConsent, recordConsent} from 'web/lib/consent'
import {useT} from 'web/lib/locale'
import {startConsentedTracking} from 'web/lib/service/analytics'

/**
 * Where the answer given to the consent banner can be changed.
 *
 * Not optional politeness: consent that cannot be withdrawn as easily as it was given is not consent
 * under the GDPR, and the banner itself is a one-time prompt — once answered it never returns. This
 * is the only way back to that decision, so it lives in Data & Privacy beside the export and the
 * spotlight toggle rather than somewhere cleverer.
 *
 * Switching it off does not merely stop future collection: `recordConsent('denied')` also deletes the
 * ids PostHog already wrote. Switching it on takes effect immediately — no reload — because
 * `startConsentedTracking()` initialises PostHog and attaches Sentry's replay recorder on the spot.
 */
export function AnalyticsConsentSetting() {
  const t = useT()
  // Read in an effect, not in the initial state: the cookie is invisible during the static render, so
  // seeding from it directly would hydrate the switch in the wrong position for half the members.
  const [consent, setConsent] = useState(false)

  useEffect(() => {
    setConsent(getConsent() === 'granted')
  }, [])

  const handleChange = (checked: boolean) => {
    setConsent(checked)
    recordConsent(checked ? 'granted' : 'denied')
    if (checked) startConsentedTracking()
  }

  return (
    <SettingsRow
      label={t('settings.analytics.label', 'Allow anonymous analytics')}
      description={t(
        'settings.analytics.description',
        'Counts page views and feature usage so we can see what is worth building, and records the occasional session replay with all text masked. Turning this off deletes what was stored on this device.',
      )}
    >
      <Row className="items-center gap-3">
        <SwitchSetting
          testId="settings-analytics-consent-toggle"
          checked={consent}
          onChange={handleChange}
          // Nothing to wait for — the choice is a cookie write, not a round trip.
          disabled={false}
          colorMode={'primary'}
        />
      </Row>
    </SettingsRow>
  )
}
