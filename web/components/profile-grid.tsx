import { Lover } from 'common/love/lover'
import { CompatibilityScore } from 'common/love/compatibility-score'
import { LoadingIndicator } from 'web/components/widgets/loading-indicator'
import { LoadMoreUntilNotVisible } from 'web/components/widgets/visibility-observer'
import { UserIcon } from '@heroicons/react/solid'
import { capitalize } from 'lodash'
import Link from 'next/link'
import { useUser } from 'web/hooks/use-user'
import { track } from 'web/lib/service/analytics'
import { convertGender, Gender } from 'common/gender'
import { Col } from './layout/col'
import { Row } from './layout/row'
import { CompatibleBadge } from './widgets/compatible-badge'
import { StarButton } from './widgets/star-button'
import clsx from 'clsx'
import Image from 'next/image'

export const ProfileGrid = (props: {
  lovers: Lover[]
  loadMore: () => Promise<boolean>
  isLoadingMore: boolean
  isReloading: boolean
  compatibilityScores: Record<string, CompatibilityScore> | undefined
  starredUserIds: string[] | undefined
  refreshStars: () => Promise<void>
}) => {
  const {
    lovers,
    loadMore,
    isLoadingMore,
    isReloading,
    compatibilityScores,
    starredUserIds,
    refreshStars,
  } = props

  return (
    <div className="relative">
      <div
        className={clsx(
          'grid grid-cols-2 gap-2 opacity-100 transition-opacity duration-75 sm:grid-cols-3 md:grid-cols-4',
          isReloading && 'animate-pulse opacity-80'
        )}
      >
        {lovers.map((lover) => (
          <ProfilePreview
            key={lover.id}
            lover={lover}
            compatibilityScore={compatibilityScores?.[lover.user_id]}
            hasStar={starredUserIds?.includes(lover.user_id) ?? false}
            refreshStars={refreshStars}
          />
        ))}
      </div>

      <LoadMoreUntilNotVisible loadMore={loadMore} />

      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <LoadingIndicator />
        </div>
      )}

      {!isLoadingMore && !isReloading && lovers.length === 0 && (
        <div className="py-8 text-center">No profiles found</div>
      )}
    </div>
  )
}

function ProfilePreview(props: {
  lover: Lover
  compatibilityScore: CompatibilityScore | undefined
  hasStar: boolean
  refreshStars: () => Promise<void>
}) {
  const { lover, compatibilityScore, hasStar, refreshStars } = props
  const { user, gender, age, pinned_url, city } = lover
  const currentUser = useUser()

  return (
    <Link
      href={`/${user.username}`}
      onClick={() => {
        track('click love profile preview')
      }}
    >
      <Col className="relative h-60 w-full overflow-hidden rounded text-white transition-all hover:z-20 hover:scale-110 hover:drop-shadow">
        {pinned_url ? (
          <Image
            src={pinned_url}
            width={180}
            height={240}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            priority={false}
          />
        ) : (
          <Col className="bg-ink-300 h-full w-full items-center justify-center">
            <UserIcon className="h-20 w-20" />
          </Col>
        )}

        <Row className="absolute inset-x-0 right-0 top-0 items-start justify-between bg-gradient-to-b from-black/70 via-black/70 to-transparent px-2 pb-3 pt-2">
          {currentUser ? (
            <StarButton
              className="!pt-0"
              isStarred={hasStar}
              refresh={refreshStars}
              targetLover={lover}
              hideTooltip
            />
          ) : (
            <div />
          )}
          {compatibilityScore && (
            <CompatibleBadge compatibility={compatibilityScore} />
          )}
        </Row>

        <Col className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/70 to-transparent px-4 pb-2 pt-6">
          <div>
            <div className="flex flex-wrap items-center gap-x-1">
              {/* <OnlineIcon last_online_time={last_online_time} /> */}
              <span>
                <span className="break-words font-semibold">{user.name}</span>,
              </span>
              {age}
            </div>
          </div>
          <Row className="gap-1 text-xs">
            {city} • {capitalize(convertGender(gender as Gender))}
          </Row>
        </Col>
      </Col>
    </Link>
  )
}
