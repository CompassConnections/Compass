import clsx from 'clsx'
import {debug} from 'common/logger'
import {Profile} from 'common/profiles/profile'
import {UserActivity} from 'common/user'
import React, {ReactNode} from 'react'
import {ProfileAnswers} from 'web/components/answers/profile-answers'
import {ProfileBio} from 'web/components/bio/profile-bio'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SignUpButton} from 'web/components/nav/sidebar'
import {ConnectActions} from 'web/components/profile/connect-actions'
import ProfileHeader, {ProfileHeaderActions} from 'web/components/profile/profile-header'
import ProfileAbout, {
  ProfileInterestsAndCauses,
  ProfileLinks,
  ProfilePersonality,
} from 'web/components/profile-about'
import ProfileCarousel from 'web/components/profile-carousel'
import {ProfileCommentSection} from 'web/components/profile-comment-section'
import {Subtitle} from 'web/components/widgets/subtitle'
import {shortenName} from 'web/components/widgets/user-link'
import {useGetter} from 'web/hooks/use-getter'
import {useHiddenProfiles} from 'web/hooks/use-hidden-profiles'
import {useCompatibilityQuestionGroups} from 'web/hooks/use-questions'
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
  const {profile, refreshProfile, fromProfilePage, fromSignup} = props

  const currentUser = useUser()
  const t = useT()
  // const currentProfile = useProfile()

  const isCurrentUser = currentUser?.id === props.user.id
  const user = isCurrentUser ? currentUser : props.user // to refresh user info after update

  debug('Rendering Profile for', user.username, user.name, props)

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

  // const isCurrentUser = currentUser?.id === user.id

  return (
    <>
      <div
        className="bg-canvas-50 border-canvas-300 mb-6 flex items-center border-b px-4 sm:px-9 py-4"
        style={{
          borderBottomWidth: '1px',
          gap: '10px',
        }}
      >
        <div className="flex w-full items-center gap-2">
          <BackButton className={'hidden sm:flex'} />

          <div className="ml-auto flex items-center gap-2">
            <ProfileHeaderActions
              user={user}
              profile={profile}
              starredUserIds={starredUserIds ?? []}
              refreshStars={refreshStars}
              showMessageButton={showMessageButton}
              refreshProfile={refreshProfile}
              isHiddenFromMe={isHiddenFromMe}
            />
          </div>
        </div>
      </div>

      <div className="mx-auto w-full px-4 sm:px-8 pb-6 pt-0">
        <Row className="relative items-start gap-6">
          {/* Gradient overlay */}
          {/*<div*/}
          {/*  style={{*/}
          {/*    position: 'absolute',*/}
          {/*    inset: 0,*/}
          {/*    pointerEvents: 'none',*/}
          {/*    background: `radial-gradient(ellipse 55% 70% at 100% 30%, rgba(193,127,62,0.07) 0%, transparent 65%), radial-gradient(ellipse 30% 40% at 0% 90%, rgba(193,127,62,0.05) 0%, transparent 55%)`,*/}
          {/*  }}*/}
          {/*/>*/}
          {/* First letter of name */}
          <div
            style={{
              position: 'absolute',
              right: '0%',
              top: '40%',
              transform: 'translateY(-50%)',
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(7rem, 14vw, 16rem)',
              fontWeight: 500,
              color: 'rgba(193,127,62,0.04)',
              lineHeight: 1,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          >
            {user.name?.charAt(0).toUpperCase()}
          </div>
          <div
            className={clsx('min-w-0 flex-1 animate-profile-appear', !profile.pinned_url && 'ml-6')}
          >
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
            // likesGiven={likesGiven ?? []}
            // likesReceived={likesReceived ?? []}
            // ships={ships ?? []}
            // refreshShips={refresh}
          />
        ) : (
          <Col className="bg-canvas-50 border-canvas-300 w-full gap-4 rounded-xl border p-6">
            {/*<div className="text-sm text-gray-500 dark:text-gray-400">*/}
            {/*  <Content className="w-full line-clamp-6" content={profile.bio as JSONContent} />*/}
            {/*</div>*/}
            <Col className="relative gap-4">
              <div className="bg-ink-200 dark:bg-ink-400 h-4 w-2/5" />
              <div className="bg-ink-200 dark:bg-ink-400 h-4 w-3/5" />
              <div className="bg-ink-200 dark:bg-ink-400 h-4 w-1/2" />
              <div className="from-canvas-50 absolute bottom-0 h-12 w-full bg-gradient-to-t to-transparent" />
            </Col>
            <Row className="gap-2">
              <SignUpButton
                text={t(
                  'profile.info.signup_to_see',
                  'Sign up to see their full profile or connect with them',
                )}
              />
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

export function ProfileInfoSkeleton() {
  return (
    <>
      <div
        className="bg-canvas-50 border-canvas-300 mb-6 flex items-center border-b px-4 sm:px-9 py-4"
        style={{
          borderBottomWidth: '1px',
          gap: '10px',
        }}
      >
        <div className="flex w-full items-center gap-2 min-h-7">
          <BackButton className={'hidden sm:flex'} />
        </div>
      </div>

      <div className="mx-auto w-full px-4 sm:px-8 pb-6 pt-0 animate-pulse">
        <Row className="gap-6 flex-wrap">
          <div className="bg-canvas-200 h-[108px] w-[108px] flex-none rounded-2xl" />
          <Col className="flex-1 gap-3 py-1 min-w-[160px]">
            <div className="bg-canvas-200 h-8 w-2/3 max-w-[240px] rounded" />
            <div className="bg-canvas-200 h-4 w-1/2 max-w-[180px] rounded" />
            <div className="bg-canvas-200 h-4 w-2/5 max-w-[140px] rounded" />
          </Col>
        </Row>

        <Row className="gap-2 flex-wrap py-3 mt-2 max-w-full sm:max-w-[500px]">
          <div className="bg-canvas-200 h-7 w-16 rounded-full" />
          <div className="bg-canvas-200 h-7 w-20 rounded-full" />
          <div className="bg-canvas-200 h-7 w-14 rounded-full" />
          <div className="bg-canvas-200 h-7 w-24 rounded-full" />
        </Row>

        <div
          className="bg-canvas-50 border-canvas-300 border mt-6"
          style={{borderRadius: '14px', padding: '22px 24px'}}
        >
          <div className="bg-canvas-200 h-6 w-24 rounded mb-5" />
          <Col className="gap-4">
            {[...Array(6)].map((_, i) => (
              <Row key={i} className="items-center gap-2.5">
                <div className="bg-canvas-200 h-8 w-8 flex-none rounded-lg" />
                <Col className="flex-1 gap-1.5">
                  <div className="bg-canvas-200 h-3 w-20 rounded" />
                  <div className="bg-canvas-200 h-4 w-3/5 rounded" />
                </Col>
              </Row>
            ))}
          </Col>
        </div>
      </div>
    </>
  )
}

function ProfileCard(props: {title?: ReactNode; children: ReactNode; className?: string}) {
  const {title, children, className} = props
  // Check if children is null or undefined
  if (children == null) {
    return null
  }
  return (
    <div
      className={clsx('bg-canvas-50 border-canvas-300 border', className)}
      style={{borderRadius: '14px', padding: '22px 24px'}}
    >
      {title != null && <CardTitle>{title}</CardTitle>}
      {children}
    </div>
  )
}

function CardTitle(props: {children: ReactNode; className?: string}) {
  const {children, className} = props
  return (
    // <div
    //   className={clsx(
    //     'text-ink-900 mb-3.5 font-cormorant text-xl font-medium tracking-wide',
    //     className,
    //   )}
    //   style={{letterSpacing: '0.01em'}}
    // >
    //   {children}
    // </div>
    <Subtitle
      className={clsx('!mt-0 !mb-4 font-cormorant text-xl font-medium tracking-wide', className)}
    >
      {children}
    </Subtitle>
  )
}

function ProfileContent(props: {
  user: User
  userActivity?: UserActivity
  profile: Profile
  refreshProfile: () => void
  fromProfilePage?: Profile
  fromSignup?: boolean
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
    // likesGiven,
    // likesReceived,
    // ships,
    // refreshShips,
  } = props

  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user.id
  const t = useT()

  const {answeredQuestions} = useCompatibilityQuestionGroups(user.id)
  const showCompatibilityPrompts = currentUser && (isCurrentUser || answeredQuestions.length > 0)

  return (
    <>
      <div
        className="mt-4 grid grid-cols-1 items-start gap-6 md:grid-cols-[1fr_500px] xl:grid-cols-[1fr_800px]"
        data-testid="profile-content"
      >
        <Col className="gap-6">
          <ProfileCard title="Details" className="p-5">
            <ProfileAbout
              profile={profile}
              userActivity={userActivity}
              isCurrentUser={isCurrentUser}
            />
          </ProfileCard>

          {(!!profile.interests?.length || !!profile.causes?.length) && (
            <ProfileCard title={t('profile.interests_and_causes', 'Interests')} className="p-5">
              <ProfileInterestsAndCauses profile={profile} />
            </ProfileCard>
          )}

          {(profile.mbti || profile.big5_agreeableness) && (
            <ProfileCard title={t('profile.personality', 'Personality')} className="p-5">
              <ProfilePersonality profile={profile} />
            </ProfileCard>
          )}

          {profile.links && Object.keys(profile.links).length > 0 && (
            <ProfileCard title={t('profile.links', 'Links')} className="p-5">
              <ProfileLinks profile={profile} />
            </ProfileCard>
          )}
        </Col>
        <Col className="gap-6">
          {profile.bio && (
            <ProfileCard title={t('profile.bio.about_me', 'About Me')} className="p-0">
              <ProfileBio
                isCurrentUser={isCurrentUser}
                profile={profile}
                refreshProfile={refreshProfile}
                fromProfilePage={fromProfilePage}
              />
            </ProfileCard>
          )}

          <ProfileCarousel profile={profile} />

          {showCompatibilityPrompts && (
            <ProfileCard
              className="p-5"
              title={
                isCurrentUser
                  ? t('answers.display.your_prompts', 'Compatibility Prompts')
                  : t('answers.display.user_prompts', 'Compatibility Prompts', {
                      name: shortenName(user.name),
                    })
              }
            >
              <ProfileAnswers
                isCurrentUser={isCurrentUser}
                user={user}
                fromSignup={fromSignup}
                fromProfilePage={fromProfilePage}
                profile={profile}
              />
            </ProfileCard>
          )}

          {currentUser && (
            <ProfileCard
              className="p-5"
              title={t('profile.comments.section_title', 'Endorsements')}
            >
              <ProfileCommentSection
                onUser={user}
                profile={profile}
                currentUser={currentUser}
                simpleView={!!fromProfilePage}
              />
            </ProfileCard>
          )}

          {!isCurrentUser && currentUser && (
            <ProfileCard title={t('profile.connect.title', 'Connect')}>
              <ConnectActions user={user} profile={profile} />
            </ProfileCard>
          )}
          {!currentUser && (
            <SignUpButton
              text={t(
                'profile.info.signup_to_see',
                'Sign up to see their full profile or connect with them',
              )}
            />
          )}
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
