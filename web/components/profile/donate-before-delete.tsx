import clsx from 'clsx'
import {
  parsePartingDonationAmount,
  PARTING_DONATION_PRESETS_USD,
  partingDonationUrl,
} from 'common/deletion'
import {DEPLOYED_WEB_URL} from 'common/envs/constants'
import Image from 'next/image'
import {useState} from 'react'
import {buttonClass} from 'web/components/buttons/button'
import {Avatar} from 'web/components/widgets/avatar'
import {ShareCompassButton} from 'web/components/widgets/share-compass-button'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'

import {Col} from '../layout/col'
import {Row} from '../layout/row'

/** Whose ask it is — the same lookup the share prompt and /about use for the founder photo. */
const FOUNDER_USERNAME = 'Martin'

/**
 * A direct image for the founder photo, when there is one better than the profile avatar. Empty means
 * "use the avatar".
 */
const FOUNDER_PHOTO_URL =
  'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/misc%2Ffounder-found-connection.jpg?alt=media&token=4e10dca3-4c13-48ee-bc98-5b370249e3f2'

/**
 * Shown in the deletion survey when the stated reason is that they found someone here: the one moment
 * a member has had the whole of what Compass is for, and the last one at which they can be reached.
 *
 * It asks for money plainly, from a named person, and it never stands between anyone and the delete
 * button. The link opens the payment page in a new tab so the dialog — and whatever they have typed
 * into it — is still there when they come back.
 */
export function DonateBeforeDelete() {
  const t = useT()
  const {data: founder} = useAPIGetter('get-user-and-profile', {username: FOUNDER_USERNAME})
  const [preset, setPreset] = useState<number>(PARTING_DONATION_PRESETS_USD[0])
  const [custom, setCustom] = useState('')

  const customAmount = parsePartingDonationAmount(custom)
  // A filled-in custom amount wins over the preset; a half-typed or invalid one disables the button
  // rather than silently donating the preset the member thought they had replaced.
  const amount = custom.trim() ? customAmount : preset

  return (
    <Col
      className="border-primary-300 bg-primary-50 gap-4 rounded-lg border p-5"
      data-testid="donate-before-delete"
    >
      {/* A photograph, not an avatar: it is of two people, and a 40px circle crops it to one face. Beside
          the text from `sm` up, above it on a phone. */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5">
        {FOUNDER_PHOTO_URL ? (
          <div className="relative aspect-square w-40 shrink-0 overflow-hidden rounded-lg sm:w-48">
            <Image
              src={FOUNDER_PHOTO_URL}
              alt={t('delete_survey.donate.photo_alt', 'Martin and partner')}
              fill
              sizes="192px"
              className="object-cover"
            />
          </div>
        ) : (
          <Avatar
            username={FOUNDER_USERNAME}
            avatarUrl={founder?.user?.avatarUrl}
            size="md"
            noLink
          />
        )}
        <Col className="min-w-0 gap-3">
          <div className="text-ink-900 font-semibold">
            {t('delete_survey.donate.title', 'Would you pay it forward?')}
          </div>
          <Col className="text-ink-700 gap-3 text-sm leading-relaxed">
            <p>
              {t(
                'delete_survey.donate.pay_forward',
                'Compass cost you nothing. No subscription, not even ads. A year on a typical dating app runs about $200.',
              )}
            </p>
            <p>
              {t(
                'delete_survey.donate.anchor',
                'We stay free only because people chip in, but right now we spend more than we receive. $50 would cover a week of running our platform and reach 50 people still looking for the love you just found.',
              )}
            </p>
            {/*<p className="text-ink-900">*/}
            {/*  {t('delete_survey.donate.signature', 'Martin, who built Compass')}*/}
            {/*</p>*/}
          </Col>
        </Col>
      </div>

      <Row className="flex-wrap items-stretch gap-2">
        {PARTING_DONATION_PRESETS_USD.map((usd) => {
          const selected = !custom.trim() && preset === usd
          return (
            <button
              key={usd}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                setPreset(usd)
                setCustom('')
              }}
              className={clsx(
                'rounded-lg border px-5 text-base font-medium transition-colors',
                selected
                  ? 'border-primary-500 bg-canvas-50 text-ink-900'
                  : 'border-canvas-300 text-ink-700 hover:border-primary-400',
              )}
            >
              ${usd}
            </button>
          )
        })}
        <label className="text-ink-700 flex items-center gap-2 text-sm">
          <span className="sr-only">
            {t('delete_survey.donate.custom_label', 'Another amount in dollars')}
          </span>
          <span aria-hidden>$</span>
          <input
            type="text"
            inputMode="numeric"
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            placeholder={t('delete_survey.donate.custom_placeholder', 'Other')}
            className="border-canvas-300 bg-canvas-50 focus:border-primary-500 focus:ring-primary-500 w-24 rounded-lg px-3 py-2.5 text-base"
            data-testid="donate-before-delete-custom"
          />
        </label>
        {/* Same row as the amounts, pushed to the far edge: the choice and the button that acts on it
            read as one line, and the row uses the panel's full width. On a phone it wraps below. */}
        <div className="grow" />
        {amount ? (
          <a
            href={partingDonationUrl(amount)}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx(buttonClass('xl', 'cta'), 'w-fit')}
            onClick={() => track('delete survey donate', {amount})}
            data-testid="donate-before-delete-link"
          >
            {t('delete_survey.donate.cta', 'Donate ${amount}', {amount: String(amount)})}
          </a>
        ) : (
          <span className={clsx(buttonClass('xl', 'cta'), 'w-fit opacity-50')} aria-disabled>
            {t('delete_survey.donate.cta_empty', 'Donate')}
          </span>
        )}
        {/*<span className="text-ink-500 text-xs">*/}
        {/*  {t('delete_survey.donate.new_tab', 'Opens in a new tab. Nothing you wrote here is lost.')}*/}
        {/*</span>*/}
      </Row>

      {/* Open Collective preselects a tip for itself and its donation link has no parameter to turn that
          off, so a $50 gift arrives at checkout as $57.50. Said here so it is not a surprise there. */}
      <p className="text-ink-500 -mt-2 text-xs" data-testid="donate-before-delete-tip-note">
        {t(
          'delete_survey.donate.platform_tip',
          "Open Collective will suggest a tip for its own platform. Tick “I don't want to add a contribution” at checkout to skip it.",
        )}
      </p>

      {/* For the member who will not give money but will give a name. No referrer tag on the link:
          the account it would credit is about to stop existing. */}
      <Row className="border-primary-200 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t pt-4">
        <div className="text-ink-700 text-sm">
          {t(
            'delete_survey.donate.tell_friend',
            'Rather not give money? Tell one single friend about Compass instead.',
          )}
        </div>
        <ShareCompassButton
          url={DEPLOYED_WEB_URL}
          label={t('delete_survey.donate.tell_friend_cta', 'Tell a friend')}
          trackingProps={{source: 'delete-survey'}}
          mobileSheet="bottom"
          // Small and outlined: this is the fallback, and the filled CTA it wears elsewhere was the
          // largest button in the panel, above the donation it is second to.
          triggerClassName={clsx(buttonClass('xs', 'gray-outline'), 'gap-1.5')}
        />
      </Row>
    </Col>
  )
}
