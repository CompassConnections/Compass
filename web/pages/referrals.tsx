import {ENV_CONFIG} from 'common/envs/constants'
import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {Input} from 'web/components/widgets/input'
import {QRCode} from 'web/components/widgets/qr-code'
import {ShareCTAButton} from 'web/components/widgets/share-cta-button'
import {Title} from 'web/components/widgets/title'
import {UserAvatarAndBadge} from 'web/components/widgets/user-link'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

export default function ReferralsPage() {
  const user = useUser()
  const t = useT()

  const defaultUrl = user
    ? `https://${ENV_CONFIG.domain}/?referrer=${user.username}`
    : `https://${ENV_CONFIG.domain}/`

  // Editable: the share sheet and the QR code follow whatever is in the field, so a user can tweak the
  // link (a different landing path, an extra param) and still share exactly what they see.
  const [url, setUrl] = useState(defaultUrl)

  // `user` arrives after first paint, so the field starts on the logged-out URL and has to catch up.
  useEffect(() => setUrl(defaultUrl), [defaultUrl])

  const title = t('referrals.title', `Invite someone to join Compass!`)

  return (
    <PageBase trackPageView={'referrals'} className="items-center">
      <SEO title="Compass" description={title} />

      <Col className="bg-canvas-50 rounded-lg p-4 sm:p-8">
        <Title>{title}</Title>

        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="mb-4 w-full"
          aria-label={t('referrals.link_label', 'Your referral link')}
        />

        {/* Same share control and copy as the /about closing block — only the URL differs, carrying this
            user's ?referrer= tag so the share is credited to them. */}
        <ShareCTAButton
          url={url}
          shareTitle={t('about.share.title', 'Compass — Find your people')}
          shareText={t(
            'about.share.text',
            "Hi! Reaching out about something I care about: Compass, a free directory for finding your people — fully searchable by values, interests, and demographics. No ads, no swiping, no dubious algorithm.\n\nIt gets better with every person who joins. Even if a friend isn't who you're looking for, they bring their world with them — their circles, the thoughtful people you'd never have met otherwise. So whether you join or simply pass it along, you're widening the circle for both of us.",
          )}
          label={t('about.share.button_cta', 'Share Compass')}
          copiedLabel={t('about.share.copied', 'Link copied!')}
          className="self-center"
        />

        <QRCode url={url} className="mt-4 self-center" />
      </Col>

      {user && <ReferralCredit />}
    </PageBase>
  )
}

/**
 * What this member has actually brought.
 *
 * `?referrer=` has been recorded since the beginning and never shown to anyone, which made sharing a
 * thing you did once into the void. A visible count is most of the difference between a one-time
 * sharer and a repeat one — and when the count is zero the honest framing of that is an invitation,
 * not a scolding.
 */
function ReferralCredit() {
  const t = useT()
  const {data} = useAPIGetter('get-my-referrals', {})

  if (!data) return null

  return (
    <Col className="bg-canvas-50 mt-4 gap-3 rounded-lg p-4 sm:p-8">
      <div className="text-ink-900 text-lg">
        {data.count === 0
          ? t('referrals.none_yet', "You haven't brought anyone yet")
          : t('referrals.count', 'You have brought {count} people to Compass', {
              count: String(data.count),
            })}
      </div>

      {data.count === 0 ? (
        <div className="text-ink-600 text-sm">
          {t(
            'referrals.none_yet_note',
            "Even one person changes your own odds more than anything we could build — they bring their circles with them, and that's where the people you'd never otherwise meet are.",
          )}
        </div>
      ) : (
        <Col className="gap-2">
          {data.members.map((m) => (
            <Row key={m.username} className="items-center gap-2">
              <UserAvatarAndBadge user={{...m, avatarUrl: m.avatarUrl ?? undefined}} />
              <span className="text-ink-400 text-xs">
                {new Date(m.joinedTime).toLocaleDateString()}
              </span>
            </Row>
          ))}
        </Col>
      )}
    </Col>
  )
}
