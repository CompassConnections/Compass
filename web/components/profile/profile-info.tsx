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
import {ProfileHeaderActions} from 'web/components/profile/profile-header'
import ProfileHero from 'web/components/profile/profile-hero'
import ProfileAbout, {
  hasAccessibility,
  hasBigFive,
  hasPersonality,
  ProfileAccessibility,
  ProfileBigFive,
  ProfileCauses,
  ProfileInterests,
  ProfileLinks,
  ProfilePersonality,
} from 'web/components/profile-about'
import {ProfileCommentSection} from 'web/components/profile-comment-section'
import {ScrollPanel} from 'web/components/widgets/scroll-panel'
import {shortenName} from 'web/components/widgets/user-link'
import {useGetter} from 'web/hooks/use-getter'
import {useHiddenProfiles} from 'web/hooks/use-hidden-profiles'
import {useCompatibilityQuestionGroups} from 'web/hooks/use-questions'
import {useScrolledPast} from 'web/hooks/use-scrolled-past'
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

  const {ref: heroRef, scrolledPast: scrolledPastHero} = useScrolledPast<HTMLDivElement>()

  // const isCurrentUser = currentUser?.id === user.id

  return (
    <>
      {/* The bar sticks to the viewport top, which on native sits under the Android/iOS status bar.
          Pull it up through the body's safe-area padding and add that inset back as padding, so the
          bar's background fills the status-bar strip while its buttons stay clear of the native nav. */}
      <div
        className="bg-canvas-50/95 border-canvas-300 sticky top-0 z-20 mb-6 flex items-center border-b px-4 sm:px-9 py-4 -mt-[env(safe-area-inset-top)] pt-[calc(1rem+env(safe-area-inset-top))] backdrop-blur"
        style={{
          borderBottomWidth: '1px',
          gap: '10px',
        }}
      >
        <div className="flex w-full items-center gap-2">
          <BackButton className={'hidden sm:flex'} />

          {/* Identity fades in once the hero is gone, so who you are reading about — and how to reach
              them — stays on screen all the way down the page. */}
          <div
            className={clsx(
              'flex min-w-0 items-center gap-2.5 transition-opacity duration-200',
              scrolledPastHero ? 'opacity-100' : 'pointer-events-none opacity-0',
            )}
            aria-hidden={!scrolledPastHero}
          >
            {/*{profile.pinned_url && (*/}
            {/*  <Image*/}
            {/*    src={profile.pinned_url}*/}
            {/*    height={64}*/}
            {/*    width={64}*/}
            {/*    sizes="32px"*/}
            {/*    alt=""*/}
            {/*    className="h-8 w-8 flex-none rounded-lg object-cover"*/}
            {/*  />*/}
            {/*)}*/}
            <span className="font-heading truncate text-lg font-medium">{user.name}</span>
          </div>

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
        <div className="relative" ref={heroRef}>
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
          <div className="animate-profile-appear relative min-w-0">
            <ProfileHero
              user={user}
              userActivity={userActivity}
              profile={profile}
              simpleView={!!fromProfilePage}
              isHiddenFromMe={isHiddenFromMe}
            />
          </div>
        </div>
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

      {/* Mirrors the hero (square gallery + identity) and the two-column body, so nothing jumps on load. */}
      <div className="mx-auto w-full px-4 sm:px-8 pb-6 pt-0 animate-pulse">
        <div className="flex flex-col gap-8 md:flex-row md:gap-10">
          <Col className="flex-none gap-3" style={{width: 260}}>
            <div className="bg-canvas-200 aspect-square w-full rounded-2xl" />
            <Row className="gap-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-canvas-200 h-[52px] w-[52px] rounded-lg" />
              ))}
            </Row>
          </Col>
          <Col className="min-w-[160px] flex-1 gap-3 py-1">
            <div className="bg-canvas-200 h-11 w-2/3 max-w-[320px] rounded" />
            <div className="bg-canvas-200 h-4 w-1/2 max-w-[220px] rounded" />
            <Row className="gap-2 flex-wrap py-2 max-w-full sm:max-w-[500px]">
              <div className="bg-canvas-200 h-7 w-16 rounded-full" />
              <div className="bg-canvas-200 h-7 w-20 rounded-full" />
              <div className="bg-canvas-200 h-7 w-14 rounded-full" />
              <div className="bg-canvas-200 h-7 w-24 rounded-full" />
            </Row>
            <div className="bg-canvas-200 h-16 w-full max-w-[340px] rounded-xl" />
          </Col>
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,700px)_minmax(300px,1fr)]">
          <Col className="gap-3">
            <div className="bg-canvas-200 h-3 w-20 rounded mb-3" />
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-canvas-200 h-4 w-full rounded" />
            ))}
            <div className="bg-canvas-200 h-4 w-2/3 rounded" />
          </Col>

          <div>
            <div className="bg-canvas-200 h-3 w-20 rounded mb-3" />
            <div className="border-canvas-300 mb-4 border-t" />
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
      </div>
    </>
  )
}

/**
 * The attribute rail's contents. Extracted so the rail can sit in its own grid area between the two
 * halves of the prose column without the JSX becoming unreadable.
 */
function RailBlocks(props: {
  profile: Profile
  userActivity?: UserActivity
  isCurrentUser: boolean
}) {
  const {profile, userActivity, isCurrentUser} = props
  const t = useT()

  // Blocks are spaced apart rather than divided inside a shared panel — with no card there is nothing
  // for a divider to belong to, and whitespace is what separates the sections on the left too.
  return (
    <div className="3xl:grid-cols-2 grid grid-cols-1 gap-x-10 gap-y-10">
      <div className="flex min-w-0 flex-col gap-10">
        <RailSection title={t('profile.details', 'Details')}>
          <ProfileAbout
            profile={profile}
            userActivity={userActivity}
            isCurrentUser={isCurrentUser}
            omitConnectionGoals
          />
        </RailSection>
      </div>

      <div className="flex min-w-0 flex-col gap-10">
        {!!profile.interests?.length && (
          <RailSection title={t('profile.interests', 'Interests')}>
            <ProfileInterests profile={profile} />
          </RailSection>
        )}

        {!!profile.causes?.length && (
          <RailSection title={t('profile.causes', 'Causes')}>
            <ProfileCauses profile={profile} />
          </RailSection>
        )}

        {hasPersonality(profile) && (
          <RailSection title={t('profile.personality', 'Personality')}>
            <ProfilePersonality profile={profile} />
          </RailSection>
        )}

        {hasBigFive(profile) && (
          <RailSection title={t('profile.big5', 'Big Five')}>
            <ProfileBigFive profile={profile} />
          </RailSection>
        )}

        {profile.links && Object.keys(profile.links).length > 0 && (
          <RailSection title={t('profile.links', 'Links')}>
            <ProfileLinks profile={profile} />
          </RailSection>
        )}

        {hasAccessibility(profile) && (
          <RailSection title={t('profile.accessibility_notes', 'Accessibility')}>
            <ProfileAccessibility profile={profile} />
          </RailSection>
        )}
      </div>
    </div>
  )
}

/**
 * A section of the main reading column. No border and no card — the column is prose, and whitespace
 * plus a small-caps label separates sections better than five stacked boxes do.
 */
function Section(props: {title?: ReactNode; id?: string; children: ReactNode; testId?: string}) {
  const {title, id, children, testId} = props
  if (children == null) return null
  return (
    <section id={id} className="min-w-0 scroll-mt-24" data-testid={testId}>
      {title != null && <SectionHeading>{title}</SectionHeading>}
      {children}
    </section>
  )
}

/**
 * A block of the attribute rail: label, rule, content — the same object as `Section` on the left, with
 * a rule added because the rail's rows are also rule-separated and the heading needs to sit outside
 * that run rather than look like the first of them.
 *
 * No card. `bg-canvas-50` is the elevated-surface token and should mean "raised, or you can act on
 * this"; the rail is reference text, the same class of thing as the bio beside it. Boxing one and not
 * the other was the last place two visual languages ran side by side on this page.
 */
function RailSection(props: {title?: ReactNode; children: ReactNode}) {
  const {title, children} = props
  if (children == null) return null
  return (
    <div className="min-w-0">
      {title != null && (
        <>
          <SectionHeading className="!mb-3">{title}</SectionHeading>
          <div className="border-canvas-300 border-t" />
        </>
      )}
      {/* Every section gets the same breathing room under its rule. Details used to get it from its
          first row's own padding, which left the sections that are not row-based — interests, causes,
          Big Five, links — sitting hard against the rule. */}
      <div className={clsx(title != null && 'pt-4')}>{children}</div>
    </div>
  )
}

function SectionHeading(props: {children: ReactNode; className?: string}) {
  const {children, className} = props
  return (
    <h2
      className={clsx('text-ink-400 font-dm-sans mb-5 font-normal uppercase', className)}
      style={{fontSize: '10px', letterSpacing: '0.18em'}}
    >
      {children}
    </h2>
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
      {/* Prose on the left, attributes in a sticky rail on the right. Prose is capped at a readable
          measure and the rail takes whatever is left, so wide screens widen the attributes instead of
          opening a gutter between the two columns.

          The prose is split into two grid areas rather than one column so that stacking order on
          mobile can differ from column order on desktop. Flattened into a single column the old DOM
          order put the entire rail after Connect, which buried Details — a top-five thing to check —
          under everything ranked below it. Explicit row/column placement at `lg` keeps the desktop
          layout identical while mobile reads bio → details → prompts → endorsements → connect. */}
      <div
        className="mt-10 flex flex-col gap-14 lg:grid lg:grid-cols-[minmax(0,700px)_minmax(300px,1fr)] lg:items-start lg:gap-x-12 lg:gap-y-14"
        data-testid="profile-content"
      >
        <div className="min-w-0 lg:col-start-1 lg:row-start-1">
          {profile.bio && (
            <Section title={t('profile.bio.about_me', 'About Me')}>
              <ProfileBio
                isCurrentUser={isCurrentUser}
                profile={profile}
                refreshProfile={refreshProfile}
                fromProfilePage={fromProfilePage}
              />
            </Section>
          )}
        </div>

        {/* Pinned beside the prose, and scrollable within itself — see ScrollPanel for the cues that
            make the second half of that obvious. Once wide enough for two readable columns it splits,
            which roughly halves its height and leaves far less to scroll.
            `row-span-2` gives the sticky element a containing block taller than itself, which is what
            it needs to have anywhere to travel. */}
        <ScrollPanel
          className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1"
          // `lg:pr-5` is the gutter the card's padding used to provide: without it the values, the
          // Big Five numbers in particular, sit hard against the scrollbar and get clipped by it.
          scrollClassName="lg:overflow-y-auto lg:max-h-[calc(100vh-8rem)] lg:pr-5"
          fadeColorClass="from-canvas-100 to-transparent"
        >
          <RailBlocks profile={profile} userActivity={userActivity} isCurrentUser={isCurrentUser} />
        </ScrollPanel>

        <Col className="min-w-0 gap-14 lg:col-start-1 lg:row-start-2">
          {showCompatibilityPrompts && (
            <Section
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
            </Section>
          )}

          {/* No wrapper surface: the section supplies its own — a dashed invitation while empty, the
              endorsements themselves once there are any. A box around either just doubles the border. */}
          {currentUser && (
            <Section title={t('profile.comments.section_title', 'Endorsements')}>
              <ProfileCommentSection
                onUser={user}
                profile={profile}
                currentUser={currentUser}
                simpleView={!!fromProfilePage}
              />
            </Section>
          )}

          {!isCurrentUser && currentUser && (
            <Section id="connect" title={t('profile.connect.title', 'Connect')}>
              <ConnectActions user={user} profile={profile} />
            </Section>
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
