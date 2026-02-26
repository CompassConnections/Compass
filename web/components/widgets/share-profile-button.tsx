import {ENV_CONFIG} from 'common/envs/constants'
import {ColorType} from 'web/components/buttons/button'
import {CopyLinkOrShareButton} from 'web/components/buttons/copy-link-button'
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
      <div className="ml-2 text-sm">{t('button.share.label', 'Copy sharing link')}</div>
    </CopyLinkOrShareButton>
  )
}
