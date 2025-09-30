import {Profile} from 'common/love/profile'
import {CompatibilityScore} from 'common/love/compatibility-score'
import {LoadingIndicator} from 'web/components/widgets/loading-indicator'
import {LoadMoreUntilNotVisible} from 'web/components/widgets/visibility-observer'
import {track} from 'web/lib/service/analytics'
import {Col} from './layout/col'
import clsx from 'clsx'
import {JSONContent} from "@tiptap/core";
import {Content} from "web/components/widgets/editor";
import React from "react";
import Link from "next/link";
import {Row} from "web/components/layout/row";
import {CompatibleBadge} from "web/components/widgets/compatible-badge";
import {useUser} from "web/hooks/use-user";

export const ProfileGrid = (props: {
  profiles: Profile[]
  loadMore: () => Promise<boolean>
  isLoadingMore: boolean
  isReloading: boolean
  compatibilityScores: Record<string, CompatibilityScore> | undefined
  starredUserIds: string[] | undefined
  refreshStars: () => Promise<void>
}) => {
  const {
    profiles,
    loadMore,
    isLoadingMore,
    isReloading,
    compatibilityScores,
    starredUserIds,
    refreshStars,
  } = props

  const user = useUser()

  const other_profiles = profiles.filter((profile) => profile.user_id !== user?.id);

  return (
    <div className="relative">
      <div
        className={clsx(
          'grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-1 xl:grid-cols-2 gap-6 py-4',
          isReloading && 'animate-pulse opacity-80'
        )}
      >
        {other_profiles
          .map((profile) => (
            <ProfilePreview
              key={profile.id}
              profile={profile}
              compatibilityScore={compatibilityScores?.[profile.user_id]}
              hasStar={starredUserIds?.includes(profile.user_id) ?? false}
              refreshStars={refreshStars}
            />
          ))}
      </div>

      <LoadMoreUntilNotVisible loadMore={loadMore}/>

      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <LoadingIndicator/>
        </div>
      )}

      {!isLoadingMore && !isReloading && other_profiles.length === 0 && (
        <div className="py-8 text-center">
          <p>No profiles found.</p>
          <p>Feel free to bookmark your search and we'll notify you when new users match it!</p>
        </div>
      )}
    </div>
  )
}

function ProfilePreview(props: {
  profile: Profile
  compatibilityScore: CompatibilityScore | undefined
  hasStar: boolean
  refreshStars: () => Promise<void>
}) {
  const {profile, compatibilityScore} = props
  const {user} = profile
  // const currentUser = useUser()

  let bio = profile.bio as JSONContent;

  if (bio && bio.content) {
    // Convert heading and list to paragraph
    bio.content = bio.content?.map(c => {
      if (c.type === 'heading' || c.type === 'list') {
        return {
          type: 'paragraph',
          content: c.content
        }
      }
      return c
    })
  }

  return (
    <Link
      onClick={() => track('click love profile preview')}
      href={`/${user.username}`}
      className="cursor-pointer group block bg-canvas-100 rounded-lg overflow-hidden shadow hover:shadow-md transition-shadow duration-200 h-full"
    >
      <Col
        className="relative h-40 w-full overflow-hidden rounded transition-all hover:scale-y-105 hover:drop-shadow">
        {/*{pinned_url ? (*/}
        {/*  <Image*/}
        {/*    src={pinned_url}*/}
        {/*    width={180}*/}
        {/*    height={240}*/}
        {/*    alt=""*/}
        {/*    className="h-full w-full object-cover"*/}
        {/*    loading="lazy"*/}
        {/*    priority={false}*/}
        {/*  />*/}
        {/*) : (*/}
        {/*  <Col className="bg-ink-300 h-full w-full items-center justify-center">*/}
        {/*    <UserIcon className="h-20 w-20" />*/}
        {/*  </Col>*/}
        {/*)}*/}

        <Row
          className="absolute top-2 right-2 items-start justify-end px-2 pb-3">
          {/*  {currentUser ? (*/}
          {/*    <StarButton*/}
          {/*      className="!pt-0"*/}
          {/*      isStarred={hasStar}*/}
          {/*      refresh={refreshStars}*/}
          {/*      targetProfile={profile}*/}
          {/*      hideTooltip*/}
          {/*    />*/}
          {/*  ) : (*/}
          {/*    <div />*/}
          {/*  )}*/}
          {compatibilityScore && (
            <CompatibleBadge compatibility={compatibilityScore}/>
          )}
        </Row>

        <Col className="absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-4 pb-2 pt-6">
          <div>
            <div className="flex-1 min-w-0">
              {/* <OnlineIcon last_online_time={last_online_time} /> */}
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                {user.name}
              </h3>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {/*TODO: fix nested <a> links warning (one from Link above, one from link in bio below)*/}
                <Content className="w-full line-clamp-4" content={bio}/>
              </div>
              {/*{age}*/}
            </div>
          </div>
          {/*<Row className="gap-1 text-xs">*/}
          {/*  {city} • {capitalize(convertGender(gender as Gender))}*/}
          {/*</Row>*/}
        </Col>
      </Col>
    </Link>
  )
}
