import {ShareIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {ENV_CONFIG} from 'common/envs/constants'
import {getLinkedInShareProfileUrl, getXShareProfileUrl} from 'common/socials'
import {
  ShareProfileOnLinkedinButton,
  ShareProfileOnXButton,
} from 'web/components/buttons/copy-link-button'
import {Row} from 'web/components/layout/row'
import {SharePanel} from 'web/components/widgets/share-panel'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

/**
 * The link a share of `username`'s profile should carry: tagged with the sharer's `?referrer=` so the
 * share gets credited to them, bare when the sharer is signed out or is the profile's own owner.
 */
export const useProfileShareUrl = (username: string) => {
  const currentUser = useUser()
  return currentUser && currentUser.username !== username
    ? `https://${ENV_CONFIG.domain}/${username}?referrer=${currentUser.username}`
    : `https://${ENV_CONFIG.domain}/${username}`
}

export const ShareProfileButton = (props: {
  username: string
  className?: string
  /** Set false where X/LinkedIn already have their own buttons alongside, so the panel doesn't repeat them. */
  showSocials?: boolean
}) => {
  const {username, className, showSocials = true} = props
  const t = useT()
  const shareUrl = useProfileShareUrl(username)

  return (
    <SharePanel
      triggerClassName={clsx(
        className,
        'border-canvas-300 text-ink-500 hover:border-primary-400 hover:bg-primary-50 flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors',
      )}
      url={shareUrl}
      xShareUrl={showSocials ? getXShareProfileUrl(t, username, shareUrl) : undefined}
      linkedinUrl={showSocials ? getLinkedInShareProfileUrl(t, username, shareUrl) : undefined}
      eventTrackingName="shareprofile"
      trackingProps={{username}}
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
      <ShareIcon strokeWidth={'2.5'} className="hidden h-[1.1rem] sm:inline" aria-hidden="true" />
      <div className="text-sm">{t('button.share.label', 'Share')}</div>
    </SharePanel>
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
      <ShareProfileButton username={username} showSocials={false} className={buttonClassName} />
    </Row>
  )
}
