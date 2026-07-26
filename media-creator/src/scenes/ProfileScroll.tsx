import React from 'react'
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion'
import {FORMATS, colors, fonts} from '../theme'

// A six-second silent b-roll scroll of a single profile, made to sit *under* the
// closing sentences of a talking-head clip rather than to stand on its own:
//
//   - no audio, no captions, no logo animation — the voice on the track is the audio
//   - the profile URL is on screen from frame 0 to the last frame, because most
//     people meet this clip as a screenshot or a repost, without a link sticker
//   - a beat on the header, a readable pass down the details, then a slightly
//     slower pass down the whole of the bio, ending on its last line
//
// Artwork is real screenshots of the live page, captured by scripts/capture-profile.mjs:
//   node scripts/capture-profile.mjs https://www.compassmeet.com/mhg1 --out profile-mhg1
// Re-run that after any profile-UI change; update SHOTS below if a card's height moves.

const DIR = 'profile-mhg1'
const PROFILE_URL = 'compassmeet.com/mhg1'

// CSS-px dimensions reported by the capture script. The PNGs are 2× these numbers;
// we scale by width, so only the ratio matters. Order is the order they are stacked.
const SHOTS = [
  {src: `${DIR}/01-header.png`, w: 844, h: 758},
  {src: `${DIR}/02-details.png`, w: 844, h: 3102},
  {src: `${DIR}/06-bio.png`, w: 844, h: 3424},
] as const

const GAP = 36 // page gutter between cards, in source px

const BIO_INDEX = 2 // the card the second half of the clip reads through

// A hair of the card's top edge left showing, so the bio reads as part of a page
// rather than as a full-bleed slab of text.
const BIO_HEADROOM = 40

// ─── Motion ─────────────────────────────────────────────────────────────────
// Timing is expressed as scroll *speed*, not as a frame budget, so the clip stays
// legible whatever the profile's length: a longer bio makes a longer video rather
// than a faster, unreadable one. Duration falls out of the geometry below.
//
// The bio is the point of the clip, so it moves slowest. The details run a little
// quicker — skimmable rather than readable, which is what that card is.
const HOLD_FRAMES = 30 // 1.0s beat on his photo and name before anything moves
const DETAILS_SPEED = 28 // px per frame
const BIO_SPEED = 18.5 // px per frame

// ─── Geometry ───────────────────────────────────────────────────────────────
// Derived at module scope because the composition's duration depends on it, and
// that has to be known before the component renders. Canvas width is the story
// format's, which is the only format this scene is registered for.
const SCALE = FORMATS.story.width / SHOTS[0].w
const TOPS: number[] = []
let cursor = 0
for (const shot of SHOTS) {
  TOPS.push(cursor)
  cursor += shot.h + GAP
}
const PAGE_HEIGHT = (cursor - GAP) * SCALE

// Where the details pass stops: the top of the bio card, just below the frame edge.
const BIO_Y = -(TOPS[BIO_INDEX] * SCALE - BIO_HEADROOM)
// Where it finishes: the bottom of the bio card resting on the bottom of the frame,
// which on this page is also the end of the scroll.
const END_Y = -(PAGE_HEIGHT - FORMATS.story.height)

const DETAILS_END = HOLD_FRAMES + Math.round(Math.abs(BIO_Y) / DETAILS_SPEED)
export const PROFILE_SCROLL_DURATION =
  DETAILS_END + Math.round(Math.abs(END_Y - BIO_Y) / BIO_SPEED)

export const ProfileScroll: React.FC = () => {
  const frame = useCurrentFrame()
  const {width} = useVideoConfig()

  const y = interpolate(
    frame,
    [0, HOLD_FRAMES, DETAILS_END, PROFILE_SCROLL_DURATION],
    [0, 0, BIO_Y, END_Y],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: (t) => t, // per-segment linear; the segments themselves are the rhythm
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
          height: PAGE_HEIGHT,
          transform: `translateY(${y}px)`,
          willChange: 'transform',
        }}
      >
        {SHOTS.map((shot, i) => (
          <Img
            key={shot.src}
            src={staticFile(shot.src)}
            style={{
              position: 'absolute',
              top: TOPS[i] * SCALE,
              left: 0,
              width,
              height: shot.h * SCALE,
            }}
          />
        ))}
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
