import {Profile} from 'common/profiles/profile'
import {CompatibilityScore} from 'common/profiles/compatibility-score'
import {CompassLoadingIndicator} from 'web/components/widgets/loading-indicator'
import {LoadMoreUntilNotVisible} from 'web/components/widgets/visibility-observer'
import {Col} from './layout/col'
import clsx from 'clsx'
import {JSONContent} from "@tiptap/core";
import {Content} from "web/components/widgets/editor";
import Link from "next/link";
import {Row} from "web/components/layout/row";
import {CompatibleBadge} from "web/components/widgets/compatible-badge";
import {useUser} from "web/hooks/use-user";
import {useT} from "web/lib/locale";
import {useAllChoices} from "web/hooks/use-choices";
import {getSeekingGenderText} from "web/lib/profile/seeking";
import HideProfileButton from 'web/components/widgets/hide-profile-button'

export const ProfileGrid = (props: {
  profiles: Profile[]
  loadMore: () => Promise<boolean>
  isLoadingMore: boolean
  isReloading: boolean
  compatibilityScores: Record<string, CompatibilityScore> | undefined
  starredUserIds: string[] | undefined
  refreshStars: () => Promise<void>
  onHide?: (userId: string) => void
  hiddenUserIds?: string[]
  onUndoHidden?: (userId: string) => void
}) => {
  const {
    profiles,
    loadMore,
    isLoadingMore,
    isReloading,
    compatibilityScores,
    starredUserIds,
    refreshStars,
    onHide,
    hiddenUserIds,
    onUndoHidden,
  } = props

  const user = useUser()
  const t = useT()

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
              onHide={onHide}
              isHidden={hiddenUserIds?.includes(profile.user_id) ?? false}
              onUndoHidden={onUndoHidden}
            />
          ))}
      </div>

      <LoadMoreUntilNotVisible loadMore={loadMore}/>

      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <CompassLoadingIndicator/>
        </div>
      )}

      {!isLoadingMore && !isReloading && other_profiles.length === 0 && (
        <div className="py-8 text-center">
          <p>{t('profile_grid.no_profiles', 'No profiles found.')}</p>
          <p>{t('profile_grid.notification_cta', 'Feel free to click on Get Notified and we\'ll notify you when new users match your search!')}</p>
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
  onHide?: (userId: string) => void
  isHidden?: boolean
  onUndoHidden?: (userId: string) => void
}) {
  const {profile, compatibilityScore, onHide, isHidden, onUndoHidden} = props
  const {user} = profile
  const choicesIdsToLabels = useAllChoices()
  const t = useT()
  // const currentUser = useUser()

  const bio = profile.bio as JSONContent;

  // If this profile was just hidden, render a compact placeholder with Undo action.
  if (isHidden) {
    return (
      <div className="block rounded-lg border border-canvas-300 bg-canvas-50 dark:bg-gray-800/50 p-3 text-sm">
        <Row className="items-center justify-between gap-2">
          <span className="text-ink-700 dark:text-ink-300">
            {t('profile_grid.profile_hidden_short', "You won't see {name} in your search results anymore.", {name: user?.name})}
          </span>
          <button
            className="text-primary-500 hover:text-primary-700 underline"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onUndoHidden?.(profile.user_id)
            }}
          >
            {t('profile_grid.undo', 'Undo')}
          </button>
        </Row>
      </div>
    )
  }

  if (bio && bio.content) {
    const newBio = []
    let i = 0
    for (const c of bio.content) {
      if ((c?.content?.length || 0) == 0) continue
      if (c.type === 'paragraph') {
        newBio.push(c)
      } else if (['heading'].includes(c.type ?? '')) {
        newBio.push({
          type: 'paragraph',
          content: c.content
        })
      } else if (c.type === 'image') {
        continue
      } else {
        newBio.push(c)
      }
      i += 1
      if (i >= 5) break
    }
    bio.content = newBio
  }

  const seekingGenderText = getSeekingGenderText(profile, t)

  // if (!profile.work?.length && !profile.occupation_title && !profile.interests?.length && (profile.bio_length || 0) < 100) {
  //   return null
  // }

  return (
    <Link
      // onClick={() => track('click profile preview')}
      href={`/${user.username}`}
      className="cursor-pointer group block rounded-lg overflow-hidden bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800/50 h-full border border-canvas-300"
    >
      <Col
        className="relative h-40 w-full overflow-hidden rounded transition-all">
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
          className="absolute top-2 right-2 items-start justify-end px-2 pb-3 z-10">
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
            <CompatibleBadge compatibility={compatibilityScore} className={'pt-1'}/>
          )}
          {/* Hide profile button */}
          {onHide && (
            <HideProfileButton
              hiddenUserId={profile.user_id}
              onHidden={onHide}
              className="ml-2"
              stopPropagation
              eyeOff
            />
          )}
        </Row>

        <Col className="absolute inset-x-0 top-[-15px] bg-gradient-to-b to-transparent px-4 pt-0">
          <div>
            <div className="flex-1 min-w-0">
              {/* <OnlineIcon last_online_time={last_online_time} /> */}
              <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                {user.name}{profile.age && `, ${profile.age}`}
                {/*{profile.gender && <GenderIcon gender={profile.gender} className={clsx('h-4 w-4')} hasColor />}*/}
              </h3>
              <div className="line-clamp-4">
                {/*TODO: fix nested <a> links warning (one from Link above, one from link in bio below)*/}
                <Content className="w-full" content={bio}/>
                {seekingGenderText && <p>{seekingGenderText}.</p>}
                {(!!profile.work?.length || profile.occupation_title) && <p>
                  {t("profile.optional.category.work", "Work")}:{" "}
                  {profile.occupation_title}
                  {profile.occupation_title && !!profile.work?.length && (", ")}
                  {profile.work?.map(id => choicesIdsToLabels['work'][id]).join(', ')}
                  {/*{(profile.work?.length || 0) > 3 && ',...'}*/}
                </p>}
                {!!profile.interests?.length && <p>
                  {t("profile.optional.interests", "Interests")}:{" "}
                  {profile.interests?.map(id => choicesIdsToLabels['interests'][id]).join(', ')}
                </p>}
              </div>
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
