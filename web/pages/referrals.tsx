import {ENV_CONFIG} from 'common/envs/constants'
import {useEffect, useState} from 'react'
import {Col} from 'web/components/layout/col'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {Input} from 'web/components/widgets/input'
import {QRCode} from 'web/components/widgets/qr-code'
import {ShareCTAButton} from 'web/components/widgets/share-cta-button'
import {Title} from 'web/components/widgets/title'
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
    </PageBase>
  )
}
