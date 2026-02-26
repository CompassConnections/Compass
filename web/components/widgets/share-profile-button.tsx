import {ENV_CONFIG} from 'common/envs/constants'
import {Button} from 'web/components/buttons/button'
import {CopyLinkOrShareButton} from 'web/components/buttons/copy-link-button'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'

export const ShareProfileButton = (props: {username: string; className?: string}) => {
  const {username, className} = props
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
      color={'gray-outline'}
    >
      <div className="ml-2 text-sm">{t('button.share.label', 'Copy sharing link')}</div>
    </CopyLinkOrShareButton>
  )
}

const share = async (url: string) => {
  if (navigator.share) {
    try {
      await navigator.share({
        title: 'My Compass profile',
        text: 'Thoughtful connections > swiping.',
        url: url,
      })
    } catch (error) {
      console.error('Failed to share:', error)
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  } else {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export const shareOnX = (profileUrl: string, text: string) => {
  const encodedText = encodeURIComponent(text)
  const encodedUrl = encodeURIComponent(profileUrl)

  const shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`

  share(shareUrl)
}

export const shareOnLinkedIn = (profileUrl: string) => {
  const encodedUrl = encodeURIComponent(profileUrl)

  const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`

  share(shareUrl)
}

export const ShareProfileOnXButton = (props: {username: string; className?: string}) => {
  const {username, className} = props

  return (
    <Button
      className={className}
      onClick={() =>
        shareOnX(`https://compassmeet.com/${username}`, `Thoughtful connections > swiping.`)
      }
    >
      Share on X
    </Button>
  )
}

export const ShareProfileOnLinkedinButton = (props: {username: string; className?: string}) => {
  const {username, className} = props

  return (
    <Button
      className={className}
      onClick={() => shareOnLinkedIn(`https://compassmeet.com/${username}`)}
    >
      Share on LinkedIn
    </Button>
  )
}
