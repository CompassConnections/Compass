import {UserIcon} from '@heroicons/react/solid'
import {LikeData, ShipData} from 'common/api/profile-types'
import {Profile} from 'common/profiles/profile'
import {keyBy, orderBy} from 'lodash'
import Image from 'next/image'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'
import {SendMessageButton} from 'web/components/messaging/send-message-button'
import {Avatar, EmptyAvatar} from 'web/components/widgets/avatar'
import {Carousel} from 'web/components/widgets/carousel'
import {UserLink} from 'web/components/widgets/user-link'
import {useProfileByUserId} from 'web/hooks/use-profile'
import {useUser} from 'web/hooks/use-user'
import {useUserById} from 'web/hooks/use-user-supabase'

import {Subtitle} from './profile-subtitle'
import {ShipsList} from './ships-display'

export const LikesDisplay = (props: {
  likesGiven: LikeData[]
  likesReceived: LikeData[]
  ships: ShipData[]
  refreshShips: () => Promise<void>
  profileProfile: Profile
}) => {
  const {likesGiven, likesReceived, ships, refreshShips, profileProfile} = props

  const likesGivenByUserId = keyBy(likesGiven, (l) => l.user_id)
  const likesReceivedByUserId = keyBy(likesReceived, (l) => l.user_id)
  const mutualLikeUserIds = Object.keys(likesGivenByUserId).filter(
    (userId) => likesReceivedByUserId[userId],
  )

  const mutualLikes = mutualLikeUserIds.map((user_id) => {
    const likeGiven = likesGivenByUserId[user_id]
    const likeReceived = likesReceivedByUserId[user_id]
    const created_time = Math.max(likeGiven.created_time, likeReceived.created_time)
    return {user_id, created_time}
  })
  const sortedMutualLikes = orderBy(mutualLikes, 'created_time', 'desc')
  const onlyLikesGiven = likesGiven.filter((l) => !likesReceivedByUserId[l.user_id])
  const onlyLikesReceived = likesReceived.filter((l) => !likesGivenByUserId[l.user_id])

  if (
    sortedMutualLikes.length === 0 &&
    onlyLikesReceived.length === 0 &&
    onlyLikesGiven.length === 0 &&
    ships.length === 0
  ) {
    return null
  }

  return (
    <Col className="gap-4">
      {sortedMutualLikes.length > 0 && (
        <Col className="gap-2">
          <Subtitle>Mutual likes</Subtitle>
          <Carousel>
            {sortedMutualLikes.map((like) => {
              return (
                <MatchTile
                  key={like.user_id}
                  matchUserId={like.user_id}
                  profileProfile={profileProfile}
                />
              )
            })}
          </Carousel>
        </Col>
      )}

      {onlyLikesReceived.length > 0 && (
        <LikesList label="Likes received" likes={onlyLikesReceived} />
      )}
      {onlyLikesGiven.length > 0 && <LikesList label="Likes given" likes={onlyLikesGiven} />}
      {ships.length > 0 && (
        <ShipsList
          label="Shipped with"
          ships={ships}
          profileProfile={profileProfile}
          refreshShips={refreshShips}
        />
      )}
    </Col>
  )
}

const LikesList = (props: {label: string; likes: LikeData[]}) => {
  const {label, likes} = props

  const maxShown = 50
  const truncatedLikes = likes.slice(0, maxShown)

  return (
    <Col className="gap-1">
      <Subtitle>{label}</Subtitle>
      {truncatedLikes.length > 0 ? (
        <Carousel className="w-full" labelsParentClassName="gap-0">
          {truncatedLikes.map((like) => (
            <UserAvatar className="-ml-1 first:ml-0" key={like.user_id} userId={like.user_id} />
          ))}
        </Carousel>
      ) : (
        <div className="text-ink-500">None</div>
      )}
    </Col>
  )
}

const UserAvatar = (props: {userId: string; className?: string}) => {
  const {userId, className} = props
  const profile = useProfileByUserId(userId)
  const user = useUserById(userId)

  // console.debug('UserAvatar', user?.username, profile?.pinned_url)

  if (!profile) return <EmptyAvatar className={className} size={10} />
  return <Avatar className={className} avatarUrl={profile.pinned_url} username={user?.username} />
}

export const MatchTile = (props: {profileProfile: Profile; matchUserId: string}) => {
  const {matchUserId, profileProfile} = props
  const profile = useProfileByUserId(matchUserId)
  const user = useUserById(matchUserId)
  const currentUser = useUser()
  const isYourMatch = currentUser?.id === profileProfile.user_id

  if (!profile || !user) return <Col className="mb-2 h-[184px] w-[200px] shrink-0"></Col>
  const {pinned_url} = profile

  return (
    <Col className="mb-2 w-[200px] shrink-0 overflow-hidden rounded">
      <Col className="bg-canvas-0 w-full px-4 py-2">
        <UserLink
          className={
            'hover:text-primary-500 text-ink-1000 truncate font-semibold transition-colors'
          }
          user={user}
          hideBadge
        />
      </Col>
      <Col className="relative h-36 w-full overflow-hidden">
        {pinned_url ? (
          <Link href={`/${user.username}`}>
            <Image
              src={pinned_url}
              // You must set these so we don't pay an extra $1k/month to vercel
              width={200}
              height={144}
              alt={`${user.username}`}
              className="h-36 w-full object-cover"
            />
          </Link>
        ) : (
          <Col className="bg-ink-300 h-full w-full items-center justify-center">
            <UserIcon className="h-20 w-20" />
          </Col>
        )}
        {isYourMatch && (
          <Col className="absolute right-3 top-2 gap-2">
            <SendMessageButton toUser={user as any} currentUser={currentUser} circleButton />
          </Col>
        )}
      </Col>
    </Col>
  )
}
