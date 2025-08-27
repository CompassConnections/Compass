import { ENV_CONFIG } from 'common/envs/constants'
import { LovePage } from 'web/components/love-page'
import { SEO } from 'web/components/SEO'
import { CopyLinkRow } from 'web/components/buttons/copy-link-button'
import { Col } from 'web/components/layout/col'
import { QRCode } from 'web/components/widgets/qr-code'
import { Title } from 'web/components/widgets/title'
import { useUser } from 'web/hooks/use-user'

export default function ReferralsPage() {
  const user = useUser()

  const url = user
    ? `https://${ENV_CONFIG.domain}/?referrer=${user.username}`
    : `https://${ENV_CONFIG.domain}/`

  return (
    <LovePage trackPageView={'love referrals'} className="items-center">
      <SEO
        title="Share the love"
        description={`Invite someone to join Compass!`}
      />

      <Col className="bg-canvas-0 rounded-lg p-4 sm:p-8">
        <Title>Share the love!</Title>

        <div className="mb-4">Invite someone to join</div>

        <CopyLinkRow url={url} eventTrackingName="copy love referral" />

        <QRCode url={url} className="mt-4 self-center" />
      </Col>
    </LovePage>
  )
}
