import {ProfileCommentSection} from 'web/components/profile-comment-section'
import ProfileHeader from 'web/components/profile/profile-header'
import ProfileCarousel from 'web/components/profile-carousel'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {useUser} from 'web/hooks/use-user'
import {User} from 'web/lib/firebase/users'
import ProfileAbout from 'web/components/profile-about'
import {ProfileAnswers} from 'web/components/answers/profile-answers'
import {SignUpButton} from 'web/components/nav/love-sidebar'
import {Profile} from 'common/love/profile'
import {ProfileBio} from 'web/components/bio/profile-bio'
import {useGetter} from 'web/hooks/use-getter'
import {getStars} from 'web/lib/supabase/stars'
import {Content} from "web/components/widgets/editor";
import {JSONContent} from "@tiptap/core";
import React from "react";

export function ProfileInfo(props: {
  profile: Profile
  user: User
  refreshProfile: () => void
  fromProfilePage?: Profile
  fromSignup?: boolean
}) {
  console.log('Rendering ProfileProfile for ', props)
  const {profile, user, refreshProfile, fromProfilePage, fromSignup} = props

  const currentUser = useUser()
  // const currentProfile = useProfile()
  // const isCurrentUser = currentUser?.id === user.id

  const {data: starredUserIds, refresh: refreshStars} = useGetter(
    'stars',
    currentUser?.id,
    getStars
  )

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

  return (
    <>
      <ProfileHeader
        user={user}
        profile={profile}
        simpleView={!!fromProfilePage}
        starredUserIds={starredUserIds ?? []}
        refreshStars={refreshStars}
        showMessageButton={showMessageButton}
        refreshProfile={refreshProfile}
      />
      {isProfileVisible ? (
        <ProfileContent
          user={user}
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
        <Col className="bg-canvas-0 w-full gap-4 rounded p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <Content className="w-full line-clamp-6" content={profile.bio as JSONContent}/>
          </div>
          <Col className="relative gap-4">
            <div className="bg-ink-200 dark:bg-ink-400 h-4 w-2/5"/>
            <div className="bg-ink-200 dark:bg-ink-400 h-4 w-3/5"/>
            <div className="bg-ink-200 dark:bg-ink-400 h-4 w-1/2"/>
            <div className="from-canvas-0 absolute bottom-0 h-12 w-full bg-gradient-to-t to-transparent"/>
          </Col>
          <Row className="gap-2">
            <SignUpButton text="Sign up to see profile"/>
          </Row>
        </Col>
      )}
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
      {isProfileVisible && profile.photo_urls && <ProfileCarousel profile={profile}/>}
    </>
  )
}

function ProfileContent(props: {
  user: User
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

  return (
    <>
      <ProfileAbout profile={profile}/>
      <ProfileBio
        isCurrentUser={isCurrentUser}
        profile={profile}
        refreshProfile={refreshProfile}
        fromProfilePage={fromProfilePage}
      />
      <ProfileAnswers
        isCurrentUser={isCurrentUser}
        user={user}
        fromSignup={fromSignup}
        fromProfilePage={fromProfilePage}
        profile={profile}
      />
      <ProfileCommentSection
        onUser={user}
        profile={profile}
        currentUser={currentUser}
        simpleView={!!fromProfilePage}
      />
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
