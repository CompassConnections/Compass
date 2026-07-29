import {EyeSlashIcon, LockClosedIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {Profile} from 'common/profiles/profile'
import {User, UserActivity} from 'common/user'
import Link from 'next/link'
import React, {useRef} from 'react'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import ProfileHeroPhoto from 'web/components/profile/profile-hero-photo'
import {useProfilePhotos} from 'web/components/profile/profile-photos'
import {ProfileConnectionGoals} from 'web/components/profile-about'
import {linkClass} from 'web/components/widgets/site-link'
import {useElementSize} from 'web/hooks/use-element-size'
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
}) {
  const {user, profile, isHiddenFromMe, simpleView} = props
  const currentUser = useUser()
  const isCurrentUser = currentUser?.id === user.id
  const t = useT()

  const photos = useProfilePhotos(profile)

  // The photo is matched to the height of the text, so both are measured rather than guessed.
  const bandRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const bandSize = useElementSize(bandRef)
  const textSize = useElementSize(textRef)

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

      {/* The text is capped rather than left to fill the row, and the photo follows it directly:
          pinned to the far margin it read as a second column with a gutter of dead space between
          the two, and the tagline stretched to a measure nobody wants to read. Whatever is left
          over on a wide screen sits to the right of the photo. */}
      {/* `items-start`, never `stretch`: the photo takes its size from the text column, so stretching
          that column to the row height would feed the photo its own height back. A short profile
          then kept whatever size the photo happened to start at instead of shrinking to the text. */}
      <div ref={bandRef} className="flex flex-col gap-10 md:flex-row md:items-start md:gap-[72px]">
        {photos.visibleUrls.length > 0 && (
          <ProfileHeroPhoto
            // Right of the text on desktop, above it when stacked: a photo is what you look at
            // first either way, and on a wide screen the name should still open the line.
            className="md:order-last"
            url={photos.visibleUrls[0]}
            textHeight={textSize?.height}
            bandWidth={bandSize?.width}
            onClick={photos.isLocked ? undefined : () => photos.openAt(0)}
          />
        )}

        <Col ref={textRef} className="min-w-0 flex-1 gap-7 md:max-w-3xl">
          {/* Place, age, height, gender read as an eyebrow above the name rather than a line under
              it: they are how you file someone, not what you call them, and above the display type
              they are read once and passed over instead of competing with the tagline. */}
          {/* The eyebrow needs air under it: at display size the name's own line box provides
              almost none, and 8px read as the two lines being one block. */}
          <Col className="gap-4">
            <ProfilePrimaryInfo profile={profile} eyebrow />
            <div data-testid="profile-display-name-age">
              {simpleView ? (
                <Link className={linkClass} href={`/${user.username}`}>
                  {name}
                </Link>
              ) : (
                name
              )}
            </div>
          </Col>

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
        </Col>
      </div>

      {photos.lightbox}
    </Col>
  )
}

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
