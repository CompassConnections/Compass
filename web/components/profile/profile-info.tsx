import {ArrowsPointingOutIcon, LockClosedIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {debug} from 'common/logger'
import {Profile} from 'common/profiles/profile'
import {UserActivity} from 'common/user'
import Link from 'next/link'
import React, {ReactNode, useRef} from 'react'
import {ProfileAnswers} from 'web/components/answers/profile-answers'
import {ProfileBio} from 'web/components/bio/profile-bio'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {SignUpButton} from 'web/components/nav/sidebar'
import {ConnectActions} from 'web/components/profile/connect-actions'
import {ProfileHeaderActions} from 'web/components/profile/profile-header'
import ProfileHero from 'web/components/profile/profile-hero'
import {HERO_GALLERY_MIN_WIDTH_PX} from 'web/components/profile/profile-hero-photo'
import ProfilePhotoCarousel from 'web/components/profile/profile-photo-carousel'
import {useProfilePhotos} from 'web/components/profile/profile-photos'
import {Section, SectionHeading} from 'web/components/profile/section'
import ProfileAbout, {
  hasAccessibility,
  hasBigFive,
  hasOnlineCommunities,
  hasPersonality,
  ProfileAccessibility,
  ProfileBigFive,
  ProfileCauses,
  ProfileInterests,
  ProfileLinks,
  ProfileOnlineCommunities,
  ProfilePersonality,
} from 'web/components/profile-about'
import {ProfileCommentSection} from 'web/components/profile-comment-section'
import {ScrollPanel} from 'web/components/widgets/scroll-panel'
import {linkClass} from 'web/components/widgets/site-link'
import {shortenName} from 'web/components/widgets/user-link'
import {useElementSize} from 'web/hooks/use-element-size'
import {useGetter} from 'web/hooks/use-getter'
import {useHiddenProfiles} from 'web/hooks/use-hidden-profiles'
import {useMinWidth} from 'web/hooks/use-min-width'
import {useCompatibilityQuestionGroups} from 'web/hooks/use-questions'
import {useScrolledPast} from 'web/hooks/use-scrolled-past'
import {useUser} from 'web/hooks/use-user'
import {useUserActivity} from 'web/hooks/use-user-activity'
import {User} from 'web/lib/firebase/users'
import {useT} from 'web/lib/locale'
import {getStars} from 'web/lib/supabase/stars'
import {promptSignIn} from 'web/lib/util/signup'

import {BackButton} from '../back-button'

const signupMessage = 'Sign up to connect with them for free'

export function ProfileInfo(props: {
  profile: Profile
  user: User
  refreshProfile: () => void
  fromProfilePage?: Profile
  fromSignup?: boolean
  // Shown beside an open conversation (the wide-screen panel on /messages/[channelId]) rather than
  // as its own page: no Back button, which would leave the chat, and no "Message" button, since
  // that is where you already are.
  embedded?: boolean
}) {
  const {profile, refreshProfile, fromProfilePage, fromSignup, embedded} = props
  const t = useT()

  const currentUser = useUser()
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
  const showMessageButton = !embedded // liked || likedBack || !areCompatible

  // Members-only profiles are the default here (see `profiles.visibility`), and the gate is enforced
  // on the server: what arrives for a signed-out visitor is a display name and nothing else. This
  // flag decides what to *draw*, not what to hide — see common/profiles/visibility.
  const isProfileVisible = currentUser || profile.visibility === 'public'

  // Not asked for when the profile is gated: "last online" is still something about the person, and
  // a request in the network tab is a request whether or not anything renders from it.
  const {data: userActivity} = useUserActivity(isProfileVisible ? user?.id : undefined)

  const {ref: heroRef, scrolledPast: scrolledPastHero} = useScrolledPast<HTMLDivElement>()

  // const isCurrentUser = currentUser?.id === user.id

  return (
    <>
      {/* The bar sticks to the viewport top, which on native sits under the Android/iOS status bar.
          `--tnh` is that inset (globals.css): the bar pins at `top-0` and carries the inset as its
          own padding, so its background fills the status-bar strip while its buttons stay clear of
          the native nav. The variable is 0 in a browser, so one rule covers both.
          `hides-on-scroll` slides it away on the same cue as the mobile bottom nav — down while
          reading, back on the first scroll up — so it never sits on a line someone is reading. */}
      <div
        className="hides-on-scroll bg-canvas-50/95 border-canvas-300 sticky top-0 z-20 mb-6 flex items-center border-b px-4 sm:px-9 py-4 pt-[calc(1rem+var(--tnh))] backdrop-blur"
        style={{
          borderBottomWidth: '1px',
          gap: '10px',
        }}
      >
        <div className="flex w-full items-center gap-2">
          {embedded ? (
            // Where Back sits on the full page: the panel's way out is to the full-width profile.
            <Link
              href={`/${user.username}`}
              className="border-canvas-300 mr-3 flex items-center rounded-lg border p-2.5 text-ink-500 transition-colors hover:border-primary-400 hover:bg-primary-50"
              title={t('messages.profile_panel.open_full', 'Open full profile')}
              aria-label={t('messages.profile_panel.open_full', 'Open full profile')}
              data-testid="chat-profile-panel-expand"
            >
              <ArrowsPointingOutIcon className="h-4 w-4" aria-hidden="true" />
            </Link>
          ) : (
            <BackButton className={'hidden sm:flex'} />
          )}

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
            {/* Nudged down: the heading serif draws its letters above the middle of its line box,
                so centred by the box it sat visibly higher than the buttons beside it. */}
            <span className="font-heading truncate text-lg font-medium translate-y-0.5">
              {user.name}
            </span>
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
              isProfileVisible={!!isProfileVisible}
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
          {/* Hung off the top of the band rather than centred in it: the rule above "Looking for" is
              drawn over whatever sits behind it, and a letter centred on the band lands square on
              that rule at every width — it read as a struck-through glyph rather than a watermark.
              Anchoring to the top keeps it beside the name, where it belongs, and the size is capped
              so that even the shortest hero (no tagline, no keywords) still has room for it above
              the rule. The small negative shift lets the glyph's cap height, not its empty line-box
              top, sit level with the eyebrow. */}
          <div
            style={{
              position: 'absolute',
              right: '0%',
              top: 0,
              transform: 'translateY(-22%)',
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 'clamp(5rem, 10vw, 11rem)',
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
              locked={!isProfileVisible}
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
            embedded={embedded}
            // likesGiven={likesGiven ?? []}
            // likesReceived={likesReceived ?? []}
            // ships={ships ?? []}
            // refreshShips={refresh}
          />
        ) : (
          <MembersOnlyPanel name={user.name} />
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

/**
 * What a signed-out visitor gets instead of the profile.
 *
 * The grey bars this replaces were a lie in two directions: they mimicked three lines of hidden text
 * that may not exist, and they implied the rest of the page was merely unrendered when in fact none
 * of it was ever sent. Saying plainly what is behind the gate — and that the same gate is on by
 * default for their own profile — is both honest and a better argument for signing up than a
 * teaser is.
 */
function MembersOnlyPanel(props: {name: string}) {
  const {name} = props
  const t = useT()

  return (
    <Col
      data-testid="profile-members-only"
      className="border-canvas-300 bg-canvas-50 mt-10 w-full max-w-xl gap-5 rounded-2xl border p-7"
    >
      <Row className="text-ink-500 font-microcaps items-center gap-2">
        <LockClosedIcon className="h-3.5 w-3.5 flex-none" />
        {t('profile.info.members_only_label', 'Members only')}
      </Row>

      <div
        className="font-heading text-ink-1000"
        style={{fontSize: 'clamp(1.35rem, 2vw, 1.75rem)', lineHeight: 1.3}}
      >
        {t('profile.info.members_only_title', '{name} shares their profile with members only.', {
          name,
        })}
      </div>

      <div className="text-ink-600 max-w-[46ch] text-[15px] leading-relaxed">
        {t(
          'profile.info.members_only_body',
          'Their photos, their story and what they are looking for are for members to read, not for the open web.',
        )}
      </div>

      <Col className="gap-3 pt-1 sm:max-w-sm">
        <SignUpButton text={t('profile.info.signup_to_see', signupMessage)} />
        <div className="text-ink-500 text-sm">
          {t('profile.info.already_member', 'Already a member?')}{' '}
          <button type="button" className={linkClass} onClick={promptSignIn}>
            {t('profile.info.sign_in', 'Sign in')}
          </button>
        </div>
      </Col>
    </Col>
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

        <div className="mt-10 grid grid-cols-1 items-start gap-x-12 gap-y-12 lg:grid-cols-[minmax(0,650px)_minmax(300px,1fr)]">
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
  // Two columns whenever two readable ones fit in the rail's own width, wherever it is: beside the
  // bio on a wide screen, full width under the bio, or in the profile panel beside a chat. Keyed to
  // the window it split by screen size alone, cutting the panel's narrow rail into slivers and
  // leaving a full-width rail under the bio in one long column. Until measured, the old window
  // breakpoint stands in.
  const railRef = useRef<HTMLDivElement>(null)
  const railSize = useElementSize(railRef)
  const columnsClass = !railSize
    ? '3xl:columns-2 3xl:gap-x-10'
    : railSize.width >= RAIL_TWO_COLUMNS_MIN_PX
      ? 'columns-2 gap-x-10'
      : ''

  // Blocks are spaced apart rather than divided inside a shared panel — with no card there is nothing
  // for a divider to belong to, and whitespace is what separates the sections on the left too.
  //
  // Two column blocks stacked, rather than one column flow or two hand-assigned columns. Details is
  // reliably several times taller than everything else put together, so giving it a column of its
  // own set the rail's height from its longest block and left the other column half empty — a rail
  // you had to scroll while it had space to spare beside it. Balancing everything as one flow fixed
  // the height but ran Details into the sections below it, so one column read attributes while the
  // other had already moved on to interests. Splitting Details evenly on its own and starting the
  // rest under it keeps both: half the height, and one thing at a time across the rail.
  return (
    <div ref={railRef}>
      {/* Full width because the block under it is: this heads both columns of Details, not one. */}
      <RailHeading>{t('profile.details', 'Details')}</RailHeading>

      {/* The rows are individually atomic, so the split lands between two attributes, and the two
          halves come out level because this block is balanced on its own. No padding of its own at
          either end — every row brings the same 16px, which is what makes the top of column two
          match the top of column one — so the gap below is `mb-6` plus that row padding, landing on
          the same 40px every other block is spaced by. */}
      <div className={clsx(columnsClass, 'mb-6 overflow-hidden')}>
        <ProfileAbout
          profile={profile}
          userActivity={userActivity}
          isCurrentUser={isCurrentUser}
          omitConnectionGoals
        />
      </div>

      {/* Everything below Details is short enough to stay whole, so these balance as blocks: the
          browser fills the shorter column next and no section is ever cut in two. */}
      <div className={clsx(columnsClass, '[&>*:last-child]:mb-0')}>
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

        {/* Handles and online communities share one block, as they share one section of the form:
            where you broadcast, then where you gather. */}
        {((profile.links && Object.keys(profile.links).length > 0) ||
          hasOnlineCommunities(profile)) && (
          <RailSection title={t('profile.links', 'Links')}>
            <Col className="gap-3">
              <ProfileLinks profile={profile} />
              <ProfileOnlineCommunities profile={profile} />
            </Col>
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
 * A block of the attribute rail: label, rule, content — the same object as `Section` on the left, with
 * a rule added because the rail's rows are also rule-separated and the heading needs to sit outside
 * that run rather than look like the first of them.
 *
 * No card. `bg-canvas-50` is the elevated-surface token and should mean "raised, or you can act on
 * this"; the rail is reference text, the same class of thing as the bio beside it. Boxing one and not
 * the other was the last place two visual languages ran side by side on this page.
 *
 * Spacing is a bottom margin rather than a parent `gap` because the rail is a column flow at `3xl`,
 * where there is no gap to inherit. Sections stay whole when that flow splits — a break through
 * Interests would strand a middot. Details is the exception and is composed by hand in `RailBlocks`.
 */
function RailSection(props: {title?: ReactNode; children: ReactNode}) {
  const {title, children} = props
  if (children == null) return null
  return (
    // `!mt-0`: headings carry a 1.5rem top margin from the global type styles, which collapses out
    // through this block. Between two sections it vanishes into the larger gap below them, but at
    // the top of a column flow it is the only margin there, and it started column one that much
    // lower than column two. Spacing between sections is unchanged — it was never coming from here.
    <div className="mb-10 min-w-0 break-inside-avoid [&_h2]:!mt-0">
      {title != null && <RailHeading>{title}</RailHeading>}
      {/* Every section gets the same breathing room under its rule. The sections that are not
          row-based — interests, causes, Big Five, links — have no padding of their own and sat hard
          against the rule without it. Details is the one that does, and heads its own rows in
          `RailBlocks` so that padding is the same in every column it breaks into. */}
      <div className={clsx(title != null && 'pt-4')}>{children}</div>
    </div>
  )
}

/**
 * The label-and-rule that heads a rail block. Its own component because the Details heading sits
 * outside the column block it heads (see `RailBlocks`) and must still be the same object as the
 * headings inside one. `break-after-avoid` keeps a heading from being stranded at the foot of a
 * column, which reads as a section with nothing in it.
 */
function RailHeading(props: {children: ReactNode}) {
  return (
    <div className="break-inside-avoid break-after-avoid">
      <SectionHeading className="!mb-3">{props.children}</SectionHeading>
      <div className="border-canvas-300 border-t" />
    </div>
  )
}

const BIO_COLUMN_PX = 650
const RAIL_GAP_PX = 48 // gap-x-12
const RAIL_MIN_PX = 300
/**
 * Two Details columns of at least 400px and their 40px gap (gap-x-10). Narrower than that, each row's
 * label and value squeeze against each other and the values wrap a word or two per line.
 */
const RAIL_TWO_COLUMNS_MIN_PX = 2 * 400 + 40
/** 650px bio track + 48px gap + 300px rail. */
const DETAILS_BESIDE_BIO_MIN_PX = BIO_COLUMN_PX + RAIL_GAP_PX + RAIL_MIN_PX

// Literal class strings (Tailwind only generates what it can read). The two-column set is the old
// `lg:` set unprefixed; the window set is that same layout keyed to the `lg` breakpoint.
const CONTENT_LAYOUT_TWO_COLUMNS = {
  grid: 'grid grid-cols-[minmax(0,650px)_minmax(300px,1fr)] items-start gap-x-12 gap-y-14',
  bio: 'col-start-1 row-start-1',
  rail: 'sticky top-6 col-start-2 row-span-2 row-start-1',
  railScroll: 'overflow-y-auto max-h-[calc(100vh-3rem)] pr-5',
  rest: 'col-start-1 row-start-2',
}
const CONTENT_LAYOUT_BY_WINDOW = {
  grid: 'lg:grid lg:grid-cols-[minmax(0,650px)_minmax(300px,1fr)] lg:items-start lg:gap-x-12 lg:gap-y-14',
  bio: 'lg:col-start-1 lg:row-start-1',
  rail: 'lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1',
  railScroll: 'lg:overflow-y-auto lg:max-h-[calc(100vh-3rem)] lg:pr-5',
  rest: 'lg:col-start-1 lg:row-start-2',
}
const CONTENT_LAYOUT_STACKED = {grid: '', bio: '', rail: '', railScroll: '', rest: ''}

function ProfileContent(props: {
  user: User
  userActivity?: UserActivity
  profile: Profile
  refreshProfile: () => void
  fromProfilePage?: Profile
  fromSignup?: boolean
  // See ProfileInfo's prop of the same name.
  embedded?: boolean
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
    embedded,
    // likesGiven,
    // likesReceived,
    // ships,
    // refreshShips,
  } = props

  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user.id
  const t = useT()

  const photos = useProfilePhotos(profile)
  // Details sits beside the bio only when the bio still gets its full ~80-character measure (the
  // 650px track) next to the 300px rail; narrower, it drops under the bio. Measured on this block,
  // not the window, so the profile panel beside a chat follows the same rule. Until measured, the
  // old window breakpoint stands in, so the first paint matches the usual result.
  const contentRef = useRef<HTMLDivElement>(null)
  const contentSize = useElementSize(contentRef)
  const layout = !contentSize
    ? CONTENT_LAYOUT_BY_WINDOW
    : contentSize.width >= DETAILS_BESIDE_BIO_MIN_PX
      ? CONTENT_LAYOUT_TWO_COLUMNS
      : CONTENT_LAYOUT_STACKED
  // On the profile page (not the panel beside a chat) the bio column also grows until sidebar plus
  // bio cover half the window, so on a wide screen the profile's main column isn't the narrow one.
  // The rail keeps at least its 300px. Re-read whenever this block resizes, which a window resize or
  // a sidebar collapse both cause.
  const bioColumnPx =
    !embedded && layout === CONTENT_LAYOUT_TWO_COLUMNS && contentSize && contentRef.current
      ? Math.min(
          Math.max(
            BIO_COLUMN_PX,
            window.innerWidth / 2 - contentRef.current.getBoundingClientRect().left,
          ),
          contentSize.width - RAIL_GAP_PX - RAIL_MIN_PX,
        )
      : undefined
  const heroShowsAllPhotos = useMinWidth(HERO_GALLERY_MIN_WIDTH_PX)
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
        ref={contentRef}
        className={clsx('mt-10 flex flex-col gap-14', layout.grid)}
        style={
          bioColumnPx
            ? {gridTemplateColumns: `${Math.round(bioColumnPx)}px minmax(${RAIL_MIN_PX}px, 1fr)`}
            : undefined
        }
        data-testid="profile-content"
      >
        <Col className={clsx('min-w-0 gap-14', layout.bio)}>
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

          {/* The rest of the photos, sideways under the bio rather than as thumbnails beside the
              hero: here they are large enough to be looked at instead of counted. */}
          {/* On very wide windows the hero already shows every photo (ProfileHeroGallery). */}
          {!heroShowsAllPhotos && (
            <ProfilePhotoCarousel
              urls={photos.visibleUrls.slice(1)}
              descriptions={profile.image_descriptions as Record<string, string>}
              indexOffset={1}
              onSelect={photos.openAt}
            />
          )}
          {photos.lightbox}
        </Col>

        {/* Pinned beside the prose, and scrollable within itself — see ScrollPanel for the cues that
            make the second half of that obvious. Once wide enough for two readable columns it splits,
            which roughly halves its height and leaves far less to scroll.
            `row-span-2` gives the sticky element a containing block taller than itself, which is what
            it needs to have anywhere to travel. */}
        <ScrollPanel
          className={layout.rail}
          // `lg:pr-5` is the gutter the card's padding used to provide: without it the values, the
          // Big Five numbers in particular, sit hard against the scrollbar and get clipped by it.
          // The offset is small because nothing is pinned over the top of this page on desktop — the
          // nav is the left column, not a bar — so anything larger is just unused viewport: the rail
          // is the tallest thing here and every pixel of the cap is a pixel less to scroll.
          scrollClassName={layout.railScroll}
          fadeColorClass="from-canvas-100 to-transparent"
        >
          <RailBlocks profile={profile} userActivity={userActivity} isCurrentUser={isCurrentUser} />
        </ScrollPanel>

        <Col className={clsx('min-w-0 gap-14', layout.rest)}>
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

          {/* Endorsements and Connect are one movement — what others vouch for, then how to reach out —
              so they sit closer to each other than to the sections above. Nested rather than given a
              margin: the parent's gap would still apply between siblings and fight it.
              Gated on `currentUser` because an empty wrapper is still a flex item, and would add a
              phantom 56px gap for logged-out visitors. */}
          {currentUser && (
            <Col className="min-w-0 gap-8">
              {/* No wrapper surface: the section supplies its own — a dashed invitation while empty, the
                  endorsements themselves once there are any. A box around either just doubles the border. */}
              <Section title={t('profile.comments.section_title', 'Endorsements')}>
                <ProfileCommentSection
                  onUser={user}
                  profile={profile}
                  currentUser={currentUser}
                  simpleView={!!fromProfilePage}
                />
              </Section>

              {/* Renders its own sections — reaching out and signalling interest privately are two
                  separate things to do, and each gets the same heading as everything else here. */}
              {!isCurrentUser && (
                <ConnectActions user={user} profile={profile} hideMessageButton={embedded} />
              )}
            </Col>
          )}
          {!currentUser && <SignUpButton text={t('profile.info.signup_to_see', signupMessage)} />}
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
