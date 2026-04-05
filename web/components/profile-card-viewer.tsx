import {getProfileOgImageUrl} from 'common/profiles/og-image'
import {Profile} from 'common/profiles/profile'
import {User} from 'common/user'
import Image from 'next/image'
import {useState} from 'react'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {useT} from 'web/lib/locale'

export const ProfileCardViewer = (props: {
  user: User
  profile: Profile
  width?: number
  height?: number
}) => {
  const {user, profile, width = 800, height = 200} = props
  const t = useT()
  const [loaded, setLoaded] = useState(false)

  const src = getProfileOgImageUrl(user, profile)

  return (
    <>
      {!loaded && <CompassLoadingIndicator />}
      {!loaded && (
        <p className={'text-ink-1000/50 text-xl justify-center mx-auto'}>
          {t('profile_card.crafting', 'Crafting the profile card...')}
        </p>
      )}
      <Image
        src={src}
        width={width}
        height={height}
        alt={t('profile_card.alt', "{username}'s profile card", {username: user.username})}
        className={`rounded-2xl transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        priority
        loading="eager"
        fetchPriority={'high'}
      />
    </>
  )
}
