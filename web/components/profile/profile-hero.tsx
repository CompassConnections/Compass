import {EyeSlashIcon, FunnelIcon, LockClosedIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {MIN_BIO_LENGTH} from 'common/constants'
import {isAdminUserId} from 'common/envs/constants'
import {Profile} from 'common/profiles/profile'
import {User, UserActivity} from 'common/user'
import Link from 'next/link'
import React, {useRef} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import ProfileHeroPhoto, {
  HERO_GALLERY_MIN_WIDTH_PX,
  ProfileHeroGallery,
} from 'web/components/profile/profile-hero-photo'
import {useProfilePhotos} from 'web/components/profile/profile-photos'
import {ProfileConnectionGoals} from 'web/components/profile-about'
import {DonorBadge} from 'web/components/widgets/donor-badge'
import {linkClass} from 'web/components/widgets/site-link'
import {AdminBadge} from 'web/components/widgets/user-link'
import {useAdminOrMod} from 'web/hooks/use-admin'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useElementSize} from 'web/hooks/use-element-size'
import {useMinWidth} from 'web/hooks/use-min-width'
import {useUser} from 'web/hooks/use-user'
import {useT} from 'web/lib/locale'
import {capitalizePure} from 'web/lib/util/time'

import ProfilePrimaryInfo from './profile-primary-info'

/**
 * The first screen of a profile: photos, identity, connection goals, tagline.
 *
 * These are the things a visitor decides on before reading anything else, so they share one band at the
 * top instead of being spread across the page. Everything ranked below them lives in `ProfileContent`.
 *
 * No call to action here on purpose: reaching out belongs to the top bar (always reachable) and the
 * Connect section at the end, not to the moment someone is still deciding who they are looking at.
 *
 * One photo shares the band, matched to the height of the text beside it; the rest run as a
 * carousel underneath, where they get room to be seen.
 */
export default function ProfileHero(props: {
  user: User
  profile: Profile
  userActivity?: UserActivity
  simpleView?: boolean
  isHiddenFromMe: boolean | undefined
  /**
   * A members-only profile being read by someone who is not signed in. The server has already
   * stripped the row down to its display name, so almost everything below would render empty
   * anyway — but the band is drawn deliberately rather than accidentally, so that a stale cached
   * profile can never put back what the redaction took out.
   */
  locked?: boolean
}) {
  const {user, profile, isHiddenFromMe, simpleView, locked} = props
  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user.id
  const isMod = useAdminOrMod()
  const t = useT()

  const photos = useProfilePhotos(profile)

  const {data: donorBadge} = useAPIGetter('get-donor-badge', locked ? undefined : {userId: user.id})
  const donorAmountCents = donorBadge?.amountCents ?? 0

  // Mirrors the `shortBio` filter in the backend's `get-profiles`: keep the two in sync.
  const isFilteredFromSearch = !(
    (profile.bio_length ?? 0) >= MIN_BIO_LENGTH || profile.headline != null
  )

  // The photo is matched to the height of the text, so both are measured rather than guessed.
  const bandRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const bandSize = useElementSize(bandRef)
  const textSize = useElementSize(textRef)
  // Every photo up here instead of one; ProfileContent drops the strip under the bio to match.
  const showGallery = useMinWidth(HERO_GALLERY_MIN_WIDTH_PX) && photos.visibleUrls.length > 1
  // Side by side, the text column beside the photo gets narrow well before the band does (the
  // profile panel beside a chat, a small laptop with the sidebar open): the tagline ends up a word
  // per line. Below this band width only the name and the line above it stay beside the photo, and
  // the rest runs full width underneath. Phones keep the stacked layout (photo above text).
  // Measured on the band, not the window, so the panel gets it at any window size.
  const isSideBySide = useMinWidth(768)
  // Photo above all the text, as on a phone, whenever the band is too narrow for the photo, the gap
  // and a readable name column side by side — on a narrow window, or in the profile panel beside a
  // chat at any window size. Undefined until the band is measured: the `md:` classes then decide,
  // so the server-rendered first paint is unchanged.
  const stacked = !bandSize
    ? undefined
    : !isSideBySide || bandSize.width < HERO_STACK_BELOW_REM * rootFontPx()
  const splitHero =
    stacked === false && !!bandSize && bandSize.width < HERO_SPLIT_BELOW_REM * rootFontPx()

  // Right of the text side by side, above it when stacked.
  const photoOrderClass =
    stacked === undefined ? 'md:order-last' : stacked ? undefined : 'order-last'

  const name = (
    <span
      className="font-heading text-ink-1000 font-normal"
      style={{
        fontSize: 'clamp(2.75rem, 4.4vw, 4.25rem)',
        lineHeight: '1.02',
        letterSpacing: '-0.02em',
      }}
    >
      {user.name}
    </span>
  )

  // Just the name, at the same display size it has on any other profile: this is a person's page,
  // not an error state, and the panel underneath does the explaining.
  if (locked) {
    return (
      <Col className="gap-5">
        <div
          data-testid="profile-display-name-age"
          className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2"
        >
          {name}
          {isAdminUserId(user.id) && <AdminBadge className="px-2 py-1 text-xs" />}
        </div>
      </Col>
    )
  }

  // Headline, keywords and goals: beside the photo on a wide band, below the name-and-photo row on
  // a narrower one (see splitHero).
  const heroDetails = (
    <>
      {/* The tagline is the one thing on this page written to be read as a voice, so it gets the
              serif italic at display size instead of a quoted aside pinned behind a rule.
              The colour has to be per-theme, because the primary ramp inverts and no single step is an
              accent on both grounds. Dark gets `primary-700` (#DCAB71), warm gold that steps down from
              the name's white — as `primary-900` it was #F3E4CE, within a few percent of the name, so
              the amber did no work. Light gets no accent at all: any amber dark enough to clear AA on
              the beige canvas is a mid-brown (700 is #855022), which reads as muddy rather than warm.
              There the italic serif is already doing the differentiating, and `ink-700` just steps it
              back from the black of the name.
              The negative indent hangs the opening quote into the margin so the first word lines up
              with the name's first letter; without it the glyph pushes the text right by ~0.35em and
              the tagline looks accidentally indented. */}
      {profile.headline && (
        <div
          className="font-heading text-primary-900 max-w-[38ch] italic sm:max-w-[52ch]"
          data-testid="profile-headline"
          style={{
            fontSize: 'clamp(1.15rem, 1.5vw, 1.5rem)',
            lineHeight: '1.5',
            fontWeight: 400,
            textIndent: '-0.38em',
          }}
        >
          “{profile.headline}”
        </div>
      )}

      {/* Unboxed: the rail already established that an outline means "you can click this" (see the
              `Chip` docstring in profile-about), and nothing here is clickable. The border was also
              carrying almost no weight — `canvas-300` sits at 1.30:1 on the light canvas and 1.75:1 on
              the dark one, so the boxes read as ghosts rather than as objects, and no single value
              fixes both: the ink ramp inverts, so any border strong enough to register in light is a
              cage in dark.
              Separation comes from the gap instead, opened to 24px because without a box the only
              thing dividing two tags is space, and 8px against the 0.16em tracking inside them read as
              one continuous run.
              Colour is off the brand ramp on purpose: as `primary-800` these were near-cream in dark
              mode, so the thing meant to be read last was as bright as the tagline, and amber stopped
              meaning anything by being used twice. */}
      {profile.keywords && profile.keywords.length > 0 && (
        <Row className="max-w-3xl flex-wrap gap-x-6 gap-y-2.5" data-testid="profile-keywords">
          {profile.keywords.map(capitalizePure).map((tag, i) => (
            <span key={i} className="text-ink-700 font-microcaps">
              {tag.trim()}
            </span>
          ))}
        </Row>
      )}

      <ProfileConnectionGoals profile={profile} />
    </>
  )

  return (
    <Col className="gap-5">
      {currentUser && !isCurrentUser && isHiddenFromMe && (
        <Notice icon={<EyeSlashIcon className="h-4 w-4 flex-none" />}>
          {t(
            'profile_grid.hidden_notice',
            "You hid this person, so they don't appear in your search results.",
          )}
        </Notice>
      )}
      {currentUser && isCurrentUser && profile.disabled && (
        <Notice icon={<LockClosedIcon className="h-4 w-4 flex-none" />} tone="danger">
          {t(
            'profile.header.disabled_notice',
            'You disabled your profile, so no one else can access it.',
          )}
        </Notice>
      )}
      {currentUser && isCurrentUser && !profile.disabled && isFilteredFromSearch && (
        <Notice icon={<FunnelIcon className="h-4 w-4 flex-none" />} tone="danger">
          {t(
            'profile.bio.too_short_tooltip',
            "Since you have no headline and your bio is too short, Compass' algorithm filters out your profile from search results by default. This ensures searches show meaningful profiles.",
          )}
        </Notice>
      )}
      {/* Everyone else is turned away at the page level, so a mod reading this is the only visitor
          there is — say so, or the page looks like an ordinary profile. */}
      {!isCurrentUser && isMod && profile.disabled && (
        <Notice icon={<LockClosedIcon className="h-4 w-4 flex-none" />} tone="danger">
          {t(
            'profile.header.disabled_notice_mod',
            '{name} disabled their profile. Only moderators can see this page.',
            {name: user.name},
          )}
        </Notice>
      )}

      {/* The text is capped rather than left to fill the row, and the photo follows it directly:
          pinned to the far margin it read as a second column with a gutter of dead space between
          the two, and the tagline stretched to a measure nobody wants to read. Whatever is left
          over on a wide screen sits to the right of the photo. */}
      {/* `items-start`, never `stretch`: the photo takes its size from the text column, so stretching
          that column to the row height would feed the photo its own height back. A short profile
          then kept whatever size the photo happened to start at instead of shrinking to the text. */}
      <div
        ref={bandRef}
        className={clsx(
          // One gap class per branch: two unprefixed gaps tie, and stylesheet order, not this list,
          // decides which wins.
          'flex',
          stacked === undefined
            ? 'flex-col gap-10 md:flex-row md:items-start md:gap-[72px]'
            : stacked
              ? 'flex-col gap-10'
              : clsx('flex-row items-start', splitHero ? 'gap-8' : 'gap-[72px]'),
        )}
      >
        {showGallery ? (
          <ProfileHeroGallery
            className={photoOrderClass}
            stacked={stacked}
            urls={photos.visibleUrls}
            textHeight={textSize?.height}
            bandWidth={bandSize?.width}
            onSelect={photos.isLocked ? undefined : photos.openAt}
          />
        ) : (
          photos.visibleUrls.length > 0 && (
            <ProfileHeroPhoto
              // Right of the text on desktop, above it when stacked: a photo is what you look at
              // first either way, and on a wide screen the name should still open the line.
              className={photoOrderClass}
              stacked={stacked}
              url={photos.visibleUrls[0]}
              textHeight={textSize?.height}
              bandWidth={bandSize?.width}
              onClick={photos.isLocked ? undefined : () => photos.openAt(0)}
            />
          )
        )}

        {/* Beside the gallery the text takes its natural width first (`flex-auto`) and the photos
            get what is left, rather than the two splitting the row evenly. */}
        <Col
          ref={textRef}
          className={clsx(
            'min-w-0 gap-7',
            stacked === undefined ? 'md:max-w-3xl' : !stacked && 'max-w-3xl',
            // Split, this column is only the name, so it keeps its own width and the photos follow
            // straight after it instead of the row's spare width opening a gap between them.
            splitHero ? 'flex-initial' : showGallery ? 'flex-auto' : 'flex-1',
          )}
        >
          {/* Place, age, height, gender read as an eyebrow above the name rather than a line under
              it: they are how you file someone, not what you call them, and above the display type
              they are read once and passed over instead of competing with the tagline. */}
          {/* The eyebrow needs air under it: at display size the name's own line box provides
              almost none, and 8px read as the two lines being one block. */}
          <Col className="gap-4">
            <ProfilePrimaryInfo profile={profile} eyebrow />
            {/* The badge is a sibling of the link, not part of it: on the card view the whole name
                is a link to the profile, and a badge that navigates when you reach for its tooltip
                is a badge people learn not to touch. Sized up from its default 10px, which next to
                display type reads as a stray pixel rather than a mark of office. */}
            <div
              data-testid="profile-display-name-age"
              className="flex flex-wrap items-center gap-x-4 gap-y-2"
            >
              {simpleView ? (
                <Link className={linkClass} href={`/${user.username}`}>
                  {name}
                </Link>
              ) : (
                name
              )}
              {isAdminUserId(user.id) && <AdminBadge className="px-2 py-1 text-xs" />}
              {donorAmountCents > 0 && (
                <DonorBadge amountCents={donorAmountCents} className="px-2 py-1 text-xs" />
              )}
            </div>
          </Col>

          {!splitHero && heroDetails}
        </Col>
      </div>

      {splitHero && <Col className="gap-7">{heroDetails}</Col>}

      {photos.lightbox}
    </Col>
  )
}

/** Band width below which the photo goes above the text: 200px photo + 32px gap + ~280px name. */
const HERO_STACK_BELOW_REM = 32

/**
 * Band width below which the hero splits (see `splitHero`). Above it the photo stays large on the
 * right of all the text: at its cap of 46% of the band, with the 72px gap, this still leaves the
 * text column ~320px, about the narrowest the tagline reads well at. (It was 904px; that dropped
 * to the small split photo on ordinary laptop widths where the full layout fit fine.)
 */
const HERO_SPLIT_BELOW_REM = 45

const rootFontPx = () =>
  typeof window === 'undefined'
    ? 16
    : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16

function Notice(props: {
  icon: React.ReactNode
  tone?: 'default' | 'danger'
  children: React.ReactNode
}) {
  const {icon, tone = 'default', children} = props
  return (
    <div
      className={clsx(
        'flex w-fit items-center gap-2 rounded-lg px-4 py-3 text-sm',
        tone === 'danger' ? 'bg-red-50 text-red-700' : 'bg-canvas-200 text-primary-800',
      )}
    >
      {icon}
      {children}
    </div>
  )
}
