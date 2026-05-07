import {JSONContent} from '@tiptap/core'
import clsx from 'clsx'
import {debug} from 'common/logger'
import {Profile} from 'common/profiles/profile'
import {UserActivity} from 'common/user'
import Image from 'next/image'
import React, {ReactNode} from 'react'
import {ProfileAnswers} from 'web/components/answers/profile-answers'
import {ProfileBio} from 'web/components/bio/profile-bio'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SignUpButton} from 'web/components/nav/sidebar'
import {ConnectActions} from 'web/components/profile/connect-actions'
import ProfileHeader, {ProfileHeaderActions} from 'web/components/profile/profile-header'
import ProfileAbout from 'web/components/profile-about'
import ProfileCarousel from 'web/components/profile-carousel'
import {ProfileCommentSection} from 'web/components/profile-comment-section'
import {Content} from 'web/components/widgets/editor'
import {useGetter} from 'web/hooks/use-getter'
import {useHiddenProfiles} from 'web/hooks/use-hidden-profiles'
import {useUser} from 'web/hooks/use-user'
import {useUserActivity} from 'web/hooks/use-user-activity'
import {User} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'
import {getStars} from 'web/lib/supabase/stars'

import {BackButton} from '../back-button'

export function ProfileInfo(props: {
  profile: Profile
  user: User
  refreshProfile: () => void
  fromProfilePage?: Profile
  fromSignup?: boolean
}) {
  const {profile, user, refreshProfile, fromProfilePage, fromSignup} = props
  debug('Rendering Profile for', user.username, user.name, props)

  const currentUser = useUser()
  const t = useT()
  // const currentProfile = useProfile()
  // const isCurrentUser = currentUser?.id === user.id

  const {data: starredUsers, refresh: refreshStars} = useGetter('stars', currentUser?.id, getStars)
  const starredUserIds = starredUsers?.map((u) => u.id)

  const {hiddenProfiles} = useHiddenProfiles()
  const isHiddenFromMe = hiddenProfiles?.some((v) => v.id === user.id)

  // const { data, refresh } = useAPIGetter('get-likes-and-ships', {
  //   userId: user.id,
  // })
  // const { likesGiven, likesReceived, ships } = data ?? {}
  //
  // const liked =
  //   !!currentUser &&
  //   !!likesReceived &&
  //   likesReceived.map((l) => l.user_id).includes(currentUser.id)
  // const likedBack =
  //   !!currentUser &&
  //   !!likesGiven &&
  //   likesGiven.map((l) => l.user_id).includes(currentUser.id)

  // const shipped =
  //   !!ships && hasShipped(currentUser, fromProfilePage?.user_id, user.id, ships)

  // const areCompatible =
  //   !!currentProfile && areGenderCompatible(currentProfile, profile)

  // Allow everyone to message everyone for now
  const showMessageButton = true // liked || likedBack || !areCompatible

  const isProfileVisible = currentUser || profile.visibility === 'public'

  const {data: userActivity} = useUserActivity(user?.id)

  return (
    <>
      <div className="bg-canvas-50 border-canvas-300 mb-6 flex items-center gap-2 border-b px-8 py-3">
        <div className="flex w-full items-center gap-2">
          <BackButton />

          <div className="ml-auto flex items-center gap-2">
            <ProfileHeaderActions
              user={user}
              profile={profile}
              starredUserIds={starredUserIds ?? []}
              refreshStars={refreshStars}
              showMessageButton={showMessageButton}
              refreshProfile={refreshProfile}
              isHiddenFromMe={isHiddenFromMe}
              // no-op: the visibility modal lives inside ProfileHeader below
              setShowVisibilityModal={() => {}}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full px-8 pb-6 pt-0">
        <Row className="items-start gap-6">
          {profile.pinned_url && (
            <div className="h-[108px] w-[108px] flex-none">
              <Image
                priority={true}
                src={profile.pinned_url}
                height={300}
                width={300}
                sizes="(max-width: 640px) 100vw, 300px"
                alt=""
                className="h-full w-full cursor-pointer rounded-2xl object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <ProfileHeader
              user={user}
              userActivity={userActivity}
              profile={profile}
              simpleView={!!fromProfilePage}
              isHiddenFromMe={isHiddenFromMe}
            />
          </div>
        </Row>
        {isProfileVisible ? (
          <ProfileContent
            user={user}
            userActivity={userActivity}
            profile={profile}
            refreshProfile={refreshProfile}
            fromProfilePage={fromProfilePage}
            fromSignup={fromSignup}
            isProfileVisible={isProfileVisible}
            // likesGiven={likesGiven ?? []}
            // likesReceived={likesReceived ?? []}
            // ships={ships ?? []}
            // refreshShips={refresh}
          />
        ) : (
          <Col className="bg-canvas-50 border-canvas-300 w-full gap-4 rounded-xl border p-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <Content className="w-full line-clamp-6" content={profile.bio as JSONContent} />
            </div>
            <Col className="relative gap-4">
              <div className="bg-ink-200 dark:bg-ink-400 h-4 w-2/5" />
              <div className="bg-ink-200 dark:bg-ink-400 h-4 w-3/5" />
              <div className="bg-ink-200 dark:bg-ink-400 h-4 w-1/2" />
              <div className="from-canvas-50 absolute bottom-0 h-12 w-full bg-gradient-to-t to-transparent" />
            </Col>
            <Row className="gap-2">
              <SignUpButton text={t('profile.info.signup_to_see', 'Sign up to see profile')} />
            </Row>
          </Col>
        )}
      </div>
      {/*{areCompatible &&*/}
      {/*  ((!fromProfilePage && !isCurrentUser) ||*/}
      {/*    (fromProfilePage && fromProfilePage.user_id === currentUser?.id)) && (*/}
      {/*    <Row className="right-0 mr-1 self-end lg:bottom-6">*/}
      {/*      <LikeButton targetProfile={profile} liked={liked} refresh={refresh} />*/}
      {/*    </Row>*/}
      {/*  )}*/}
      {/*{fromProfilePage &&*/}
      {/*  fromProfilePage.user_id !== currentUser?.id &&*/}
      {/*  user.id !== currentUser?.id && (*/}
      {/*    <Row className="sticky bottom-[70px] right-0 mr-1 self-end lg:bottom-6">*/}
      {/*      <ShipButton*/}
      {/*        shipped={shipped}*/}
      {/*        targetId1={fromProfilePage.user_id}*/}
      {/*        targetId2={user.id}*/}
      {/*        refresh={refresh}*/}
      {/*      />*/}
      {/*    </Row>*/}
      {/*  )}*/}
    </>
  )
}

function ProfileCard(props: {title?: ReactNode; children: ReactNode; className?: string}) {
  const {title, children, className} = props
  return (
    <div className={clsx('bg-canvas-50 border-canvas-300 rounded-2xl border p-6', className)}>
      {title != null && <CardTitle>{title}</CardTitle>}
      {children}
    </div>
  )
}

function CardTitle(props: {children: ReactNode; className?: string}) {
  const {children, className} = props
  return (
    <div className={clsx('text-ink-900 mb-4 text-lg font-semibold tracking-tight', className)}>
      {children}
    </div>
  )
}

function ProfileContent(props: {
  user: User
  userActivity?: UserActivity
  profile: Profile
  refreshProfile: () => void
  fromProfilePage?: Profile
  fromSignup?: boolean
  isProfileVisible?: true | User
  // likesGiven: LikeData[]
  // likesReceived: LikeData[]
  // ships: ShipData[]
  // refreshShips: () => Promise<void>
}) {
  const {
    user,
    userActivity,
    profile,
    refreshProfile,
    fromProfilePage,
    fromSignup,
    isProfileVisible,
    // likesGiven,
    // likesReceived,
    // ships,
    // refreshShips,
  } = props

  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user.id

  return (
    <>
      <div className="mt-4 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_480px]">
        <Col className="gap-6">
          <ProfileCard className="p-5">
            <ProfileBio
              isCurrentUser={isCurrentUser}
              profile={profile}
              refreshProfile={refreshProfile}
              fromProfilePage={fromProfilePage}
            />
          </ProfileCard>

          {isProfileVisible && (
            <ProfileCard className="p-5">
              <ProfileCarousel profile={profile} refreshProfile={refreshProfile} />
            </ProfileCard>
          )}

          <ProfileCard className="p-5">
            <ProfileAnswers
              isCurrentUser={isCurrentUser}
              user={user}
              fromSignup={fromSignup}
              fromProfilePage={fromProfilePage}
              profile={profile}
            />
          </ProfileCard>

          <ProfileCard className="p-5">
            <ConnectActions user={user} profile={profile} />
          </ProfileCard>

          <ProfileCard className="p-5">
            <ProfileCommentSection
              onUser={user}
              profile={profile}
              currentUser={currentUser}
              simpleView={!!fromProfilePage}
            />
          </ProfileCard>
        </Col>

        <Col className="gap-6">
          <ProfileCard title="Details" className="p-5">
            <ProfileAbout
              profile={profile}
              userActivity={userActivity}
              isCurrentUser={isCurrentUser}
            />
          </ProfileCard>
        </Col>
      </div>
      {/*<LikesDisplay*/}
      {/*  likesGiven={likesGiven}*/}
      {/*  likesReceived={likesReceived}*/}
      {/*  ships={ships}*/}
      {/*  refreshShips={refreshShips}*/}
      {/*  profileProfile={profile}*/}
      {/*/>*/}
    </>
  )
}
