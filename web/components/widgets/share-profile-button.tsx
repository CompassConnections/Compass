import clsx from 'clsx'
import {ENV_CONFIG} from 'common/envs/constants'
import {ColorType} from 'web/components/buttons/button'
import {
  CopyLinkOrShareButton,
  ShareProfileOnLinkedinButton,
  ShareProfileOnXButton,
} from 'web/components/buttons/copy-link-button'
import {Row} from 'web/components/layout/row'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

export const ShareProfileButton = (props: {
  username: string
  className?: string
  color?: ColorType
}) => {
  const {username, className, color} = props
  const currentUser = useUser()
  const t = useT()
  const shareUrl =
    currentUser && currentUser.username !== username
      ? `https://${ENV_CONFIG.domain}/${username}?referrer=${currentUser.username}`
      : `https://${ENV_CONFIG.domain}/${username}`

  return (
    <CopyLinkOrShareButton
      className={className}
      url={shareUrl}
      eventTrackingName="shareprofile"
      color={color}
    >
      <div className="ml-2 text-sm">{t('button.share.label', 'Copy profile link')}</div>
    </CopyLinkOrShareButton>
  )
}

export const ShareProfileButtons = (props: {
  username: string | undefined
  className?: string
  buttonClassName?: string
}) => {
  const {username, className, buttonClassName} = props
  if (!username) return

  return (
    <Row className={clsx('gap-4', className)}>
      <ShareProfileOnXButton username={username} className={buttonClassName} />
      <ShareProfileOnLinkedinButton username={username} className={buttonClassName} />
      <ShareProfileButton username={username} color={'gray-outline'} className={buttonClassName} />
    </Row>
  )
}
