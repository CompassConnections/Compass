import {Row} from 'web/components/layout/row'
import {HeartIcon, UserIcon} from '@heroicons/react/solid'
import {Profile} from 'common/profiles/profile'
import Image from 'next/image'
import {Col} from 'web/components/layout/col'
import clsx from 'clsx'

export function MatchAvatars(props: {
  profileProfile: Profile
  matchedProfile: Profile
  className?: string
}) {
  const {profileProfile, matchedProfile, className} = props

  return (
    <Row className={clsx(className, 'mx-auto items-center gap-1')}>
      {profileProfile.pinned_url ? (
        <Image
          src={profileProfile.pinned_url}
          // You must set these so we don't pay an extra $1k/month to vercel
          width={100}
          height={100}
          alt={profileProfile.user.username}
          className="h-24 w-24 rounded-full object-cover"
        />
      ) : (
        <Col className="bg-ink-300 h-full w-full items-center justify-center">
          <UserIcon className="h-16 w-16" />
        </Col>
      )}

      <HeartIcon className="text-ink-300 h-6 w-6" />
      {matchedProfile.pinned_url ? (
        <Image
          src={matchedProfile.pinned_url}
          // You must set these so we don't pay an extra $1k/month to vercel
          width={100}
          height={100}
          alt={matchedProfile.user.username}
          className="h-24 w-24 rounded-full object-cover"
        />
      ) : (
        <Col className="bg-ink-300 h-full w-full items-center justify-center">
          <UserIcon className="h-16 w-16" />
        </Col>
      )}
    </Row>
  )
}
