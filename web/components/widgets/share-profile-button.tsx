import {ShareIcon} from '@heroicons/react/24/outline'
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
      className={clsx(
        className,
        'border-canvas-300 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm text-ink-500 transition-colors hover:border-primary-400 hover:bg-primary-50',
      )}
      url={shareUrl}
      eventTrackingName="shareprofile"
      color={color}
      size="sm"
      icon={ShareIcon}
      iconClassName={'hidden sm:inline'}
      // Same three-beat framing as the /about "Share Compass" message, trimmed to one line for a
      // single-profile share: what Compass is, and why this profile is worth a look.
      shareData={{
        title: t('share_profile.share.title', 'A profile worth seeing on Compass'),
        text: t(
          'share_profile.share.text',
          'Thought you might want to see this profile on Compass — a free directory for finding your people, searchable by values, interests, and demographics. No ads, no swiping, no dubious algorithm.',
        ),
      }}
    >
      <div className="text-sm">{t('button.share.label', 'Share')}</div>
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
