import {ENV_CONFIG} from 'common/envs/constants'
import {CopyLinkRow} from 'web/components/buttons/copy-link-button'
import {Col} from 'web/components/layout/col'
import {PageBase} from 'web/components/page-base'
import {SEO} from 'web/components/SEO'
import {QRCode} from 'web/components/widgets/qr-code'
import {Title} from 'web/components/widgets/title'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

export default function ReferralsPage() {
  const user = useUser()
  const t = useT()

  const url = user
    ? `https://${ENV_CONFIG.domain}/?referrer=${user.username}`
    : `https://${ENV_CONFIG.domain}/`

  const title = t('referrals.title', `Invite someone to join Compass!`)

  return (
    <PageBase trackPageView={'referrals'} className="items-center">
      <SEO title="Compass" description={title} />

      <Col className="bg-canvas-0 rounded-lg p-4 sm:p-8">
        <Title>{title}</Title>

        <CopyLinkRow url={url} eventTrackingName="copyreferral" />

        <QRCode url={url} className="mt-4 self-center" />
      </Col>
    </PageBase>
  )
}
