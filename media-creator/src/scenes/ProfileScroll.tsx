import React from 'react'
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import {colors, fonts, FORMATS} from '../theme'

// A twelve-second silent b-roll scroll of a single profile, made to sit *under* the
// closing sentences of a talking-head clip rather than to stand on its own:
//
//   - no audio, no captions, no logo animation — the voice on the track is the audio
//   - the profile URL is on screen from frame 0 to the last frame, because most
//     people meet this clip as a screenshot or a repost, without a link sticker
//   - a pass over the whole page in page order, but not at a constant speed: it
//     rests on three things a viewer can actually read and glides over the rest
//
// *Which* profile it plays is a prop, not an edit here. Everything the scene needs to
// know about the page — the PNG's pixel size, where the content starts, where the
// readable sections sit — is measured off the live DOM by the capture script and
// written beside the artwork as public/profile-<username>/manifest.json:
//
//   node scripts/capture-profile.mjs https://www.compassmeet.com/euniiiiiiiiiice
//   npm run render:scroll euniiiiiiiiiice
//
// Re-run the capture after any profile-UI change; nothing in this file moves.

export interface ProfileScrollSection {
  /** Card heading as it reads on the page ('About Me', 'Details', …). */
  title: string
  /** Absolute y of the card's top edge in full.png, source px. */
  y: number
  /** Card height, source px. */
  h: number
}

export interface ProfileScrollManifest {
  username: string
  /**
   * Pixel dimensions of the full-page PNG. The capture shoots at DPR 2, so these are
   * 2× the CSS numbers; we scale by width, so only the ratio matters.
   */
  full: {w: number; h: number}
  /**
   * First row of real profile content. The page's own top bar sits above it and is
   * cropped off the head of the shot: it is chrome, not profile, and holding on it
   * would spend the opening beat on nothing.
   */
  cropTop: number
  /**
   * Where the scroll finishes. The shot's own bottom edge unless there is blank canvas
   * under the last card, which would spend the closing beat on nothing.
   */
  cropBottom: number
  /** Every card on the page, in page order. Source px. */
  sections: ProfileScrollSection[]
}

// The index signature is what makes this assignable to Remotion's `Props extends
// Record<string, unknown>` constraint on <Composition>.
export type ProfileScrollProps = Record<string, unknown> & {
  username: string
  manifest: ProfileScrollManifest | null
}

// ─── Motion ─────────────────────────────────────────────────────────────────
// Twelve seconds flat, whatever the profile's length — this clip is cut to a fixed
// slot under a voice track, so duration is the constant and scroll speed is what gives.
//
// What does NOT give is an even speed. Time here is spent in proportion to how long
// something takes to *read*, not to how many pixels it occupies: a constant scroll
// spends as long on 800px of photograph as on 800px of prose, and at a full profile's
// length that works out to ~14 lines of body text per second — nobody reads a word.
//
// So the clip rests on three things and glides over everything else. Under a voice
// track this matters more than it would for a standalone video: uniform motion gives
// the eye nowhere to land, and a viewer half-listening takes away nothing at all.
// Three stops, three impressions. The glides in between are not filler — a bio
// streaming past too fast to read is still legibly *long*, which is the point.
const DURATION_SECONDS = 12

// The two mid-clip stops, named by card heading and visited in page order. Both are
// picked for reading rather than for looks: the bio is the passage that reads as a
// person rather than as a form, and the Details table — work, education, politics,
// religion, exercise — is what says "not a swiping app". A profile that is missing one
// of them falls back to a proportional anchor, so this is a preference, not a
// requirement.
const STOP_TITLES = ['About Me', 'Details']

// Where a stop's anchor sits relative to its card: a little above the card's own top
// edge, so the heading isn't glued to the top of the frame. Source px.
const STOP_LEAD = 60

// Fractions of the scrollable range used for any stop the page doesn't provide — two
// evenly spread resting points, the best a page we know nothing about can do.
const FALLBACK_FRACTIONS = [0.25, 0.6]

// [seconds, index into the anchors resolved below]. Repeated anchors are the dwells;
// `interpolate` eases *within each segment*, which is what the dwells need: every move
// accelerates away from a stop and decelerates into the next one, so the clip reads as
// someone thumbing down a page rather than as a series of cuts.
const BEATS = [
  [0.0, 0], // the photograph, the name, the pull-quote's first line
  [1.2, 0],
  [3.4, 1], // first stop — the bio
  [4.7, 1],
  [8.2, 2], // the rest of the bio streams past, arriving at the second stop
  [9.4, 2], // the key/value table
  [DURATION_SECONDS, 3], // the page bottom
] as const

export const PROFILE_SCROLL_DURATION = DURATION_SECONDS * FORMATS.story.fps

/**
 * The four anchors the clip moves between — page top, stop 1, stop 2, page bottom —
 * plus the scale everything is drawn at.
 *
 * An anchor is an absolute source-PNG y: the row that sits at the top of the frame.
 * They are clamped and forced monotonic, so a page that is short, or one whose cards
 * come back in an odd order, can only ever scroll downwards and never past its own end.
 */
function geometry(manifest: ProfileScrollManifest, canvas: {width: number; height: number}) {
  const {full, cropTop, cropBottom} = manifest
  const scale = canvas.width / full.w
  const pageHeight = (cropBottom - cropTop) * scale

  // What one frame shows of the page, in source px — so `lastAnchor` is the lowest row
  // that can sit at the top of the frame with the page's end resting on the frame's.
  const frameHeight = canvas.height / scale
  const lastAnchor = Math.max(cropTop, cropBottom - frameHeight)

  const stops = STOP_TITLES.map((title) =>
    manifest.sections.find((s) => s.title.toLowerCase() === title.toLowerCase()),
  )
    .filter((s): s is ProfileScrollSection => Boolean(s))
    .map((s) => s.y - STOP_LEAD)
    .sort((a, b) => a - b)

  // Top up from the proportional fallbacks, so there are always exactly two mid stops
  // whatever the page turned out to contain.
  while (stops.length < FALLBACK_FRACTIONS.length) {
    stops.push(cropTop + (lastAnchor - cropTop) * FALLBACK_FRACTIONS[stops.length])
  }

  let previous = cropTop
  const anchors = [cropTop, ...stops.slice(0, 2), lastAnchor].map((y) => {
    previous = Math.min(Math.max(y, previous), lastAnchor)
    return previous
  })

  // Offset, not anchor: what the page is translated by to put that row at the top.
  return {scale, pageHeight, offsets: anchors.map((y) => -((y - cropTop) * scale))}
}

export const ProfileScroll: React.FC<ProfileScrollProps> = ({username, manifest}) => {
  const frame = useCurrentFrame()
  const {width, height, fps} = useVideoConfig()

  if (!manifest) return <AbsoluteFill style={{backgroundColor: colors.canvas100}} />

  const {scale, pageHeight, offsets} = geometry(manifest, {width, height})

  const y = interpolate(
    frame,
    BEATS.map(([t]) => Math.round(t * fps)),
    BEATS.map(([, anchor]) => offsets[anchor]),
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.ease),
    },
  )

  return (
    <AbsoluteFill style={{backgroundColor: colors.canvas100, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height: pageHeight,
          transform: `translateY(${y}px)`,
          willChange: 'transform',
        }}
      >
        <Img
          src={staticFile(`profile-${username}/full.png`)}
          style={{
            position: 'absolute',
            top: -manifest.cropTop * scale,
            left: 0,
            width,
            height: manifest.full.h * scale,
          }}
        />
      </div>

      <UrlBar url={`compassmeet.com/${username}`} />
    </AbsoluteFill>
  )
}

/**
 * Reads the capture manifest written beside the artwork, so pointing the clip at a
 * different profile is a prop rather than an edit to this file.
 *
 * public/profile-*\/ is regenerated by the capture script, so a missing manifest is the
 * normal "you haven't captured this profile yet" state: fail with the command that
 * fixes it rather than rendering a silently blank video.
 */
export const calculateProfileScrollMetadata = async ({props}: {props: ProfileScrollProps}) => {
  const path = `profile-${props.username}/manifest.json`
  const res = await fetch(staticFile(path))
  if (!res.ok) {
    throw new Error(
      `public/${path} is missing (HTTP ${res.status}). Run: ` +
        `node scripts/capture-profile.mjs https://www.compassmeet.com/${props.username}`,
    )
  }
  const manifest: ProfileScrollManifest = await res.json()
  return {props: {...props, manifest}}
}

// Always on screen. The scrim is what guarantees it stays legible whatever the page
// is showing underneath — the profile scrolls past both cream cards and warm gutters.
const UrlBar: React.FC<{url: string}> = ({url}) => {
  const {height} = useVideoConfig()
  return (
    <>
      <AbsoluteFill
        style={{
          top: height - 560,
          background: `linear-gradient(to bottom, rgba(237,232,224,0) 0%, rgba(237,232,224,0.55) 32%, rgba(237,232,224,0.94) 58%, rgba(237,232,224,1) 78%)`,
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: height - 310,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 22,
            padding: '26px 52px',
            borderRadius: 999,
            backgroundColor: colors.cream,
            border: `2px solid ${colors.amber}`,
            boxShadow: '0 10px 40px rgba(44,36,22,0.16)',
          }}
        >
          <Img src={staticFile('logo.svg')} style={{width: 52, height: 52}} />
          <span
            style={{
              fontFamily: fonts.body,
              fontSize: 50,
              fontWeight: 600,
              letterSpacing: '-0.01em',
              color: colors.ink,
            }}
          >
            {url}
          </span>
        </div>
      </div>
    </>
  )
}
