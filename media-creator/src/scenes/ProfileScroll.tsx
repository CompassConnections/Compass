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
// Artwork is a real full-page screenshot of the live page, captured by
// scripts/capture-profile.mjs:
//   node scripts/capture-profile.mjs https://www.compassmeet.com/mhg1 --out profile-mhg1
// Re-run that after any profile-UI change; update FULL and STOPS below if the page moves.

const USERNAME = 'mhg1'
const DIR = `profile-${USERNAME}`
const PROFILE_URL = `compassmeet.com/${USERNAME}`

// Pixel dimensions of the full-page PNG as written by the capture script (it shoots
// at DPR 2, so these are 2× the CSS numbers). We scale by width, so only the ratio
// matters.
const FULL = {src: `${DIR}/full.png`, w: 860, h: 8612}

// The page's own top bar, cropped off the head of the shot: it is chrome, not profile,
// and holding on it would spend the opening beat on nothing. In source-PNG px, so 100
// here is 50 CSS px.
const CROP_TOP = 200
// Blank canvas below the sign-up button, cropped off the tail so the clip doesn't
// spend its last beat resting on nothing.
const CROP_BOTTOM = 8460

// ─── Motion ─────────────────────────────────────────────────────────────────
// Twelve seconds flat, whatever the profile's length — this clip is cut to a fixed
// slot under a voice track, so duration is the constant and scroll speed is what gives.
//
// What does NOT give is an even speed. Time here is spent in proportion to how long
// something takes to *read*, not to how many pixels it occupies: a constant scroll
// spends as long on 800px of photograph as on 800px of prose, and at this page's
// length that works out to ~14 lines of body text per second — nobody reads a word.
//
// So the clip rests on three things and glides over everything else. Under a voice
// track this matters more than it would for a standalone video: uniform motion gives
// the eye nowhere to land, and a viewer half-listening takes away nothing at all.
// Three stops, three impressions. The glides in between are not filler — a bio
// streaming past too fast to read is still legibly *long*, which is the point.
//
// Anchors are absolute source-PNG y, i.e. what sits at the top of the frame. Re-measure
// them against a fresh full.png; everything else here is derived.
const DURATION_SECONDS = 12
const STOPS = [
  // [seconds, source-px y]
  // CROP_TOP, not 0: the anchor is an absolute source-px y, so opening at 0 would
  // scroll back above the crop line and put the page's own Card/Share bar on screen.
  [0.0, CROP_TOP], // the face, his name, the pull-quote's first line
  [1.1, CROP_TOP],
  [3.6, 2115], // "First, the good news / The bad news" — the passage that reads as a person
  [4.9, 2115],
  [8.5, 5340], // the rest of the bio streams past, arriving at Details
  [9.6, 5340], // the key/value table: politics, religion, cannabis, psychedelics
  [DURATION_SECONDS, -1], // -1 = the page bottom, resolved below
] as const

// ─── Geometry ───────────────────────────────────────────────────────────────
// Derived at module scope because the composition's duration depends on it, and
// that has to be known before the component renders. Canvas is the story format's,
// which is the only format this scene is registered for.
const SCALE = FORMATS.story.width / FULL.w
const PAGE_HEIGHT = (CROP_BOTTOM - CROP_TOP) * SCALE

export const PROFILE_SCROLL_DURATION = DURATION_SECONDS * FORMATS.story.fps

// Where the scroll finishes: the bottom of the page resting on the bottom of the frame.
const END_Y = -(PAGE_HEIGHT - FORMATS.story.height)

const FRAMES = STOPS.map(([t]) => Math.round(t * FORMATS.story.fps))
const OFFSETS = STOPS.map(([, y]) => (y < 0 ? END_Y : -((y - CROP_TOP) * SCALE)))

export const ProfileScroll: React.FC = () => {
  const frame = useCurrentFrame()
  const {width} = useVideoConfig()

  // interpolate eases *within each segment*, which is what the dwells need: every move
  // accelerates away from a stop and decelerates into the next one, so the clip reads as
  // someone thumbing down a page rather than as a series of cuts.
  const y = interpolate(frame, FRAMES, OFFSETS, {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  })

  return (
    <AbsoluteFill style={{backgroundColor: colors.canvas100, overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height: PAGE_HEIGHT,
          transform: `translateY(${y}px)`,
          willChange: 'transform',
        }}
      >
        <Img
          src={staticFile(FULL.src)}
          style={{
            position: 'absolute',
            top: -CROP_TOP * SCALE,
            left: 0,
            width,
            height: FULL.h * SCALE,
          }}
        />
      </div>

      <UrlBar url={PROFILE_URL} />
    </AbsoluteFill>
  )
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
