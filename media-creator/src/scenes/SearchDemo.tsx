import React from 'react'
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion'

// The home-page hero clip: one real mobile session — filter to women, type a keyword, watch the list
// narrow, open a profile, scroll it, reach out.
//
// Every frame is a screenshot of the live app taken by scripts/capture-search.mjs, including the typing
// and the scrolling. Nothing here is simulated, so the result count updates on the app's own debounce
// schedule and the clip cannot drift from the product.
//
// This scene is deliberately a dumb sequencer. Each frame in the manifest carries its own `hold`, so
// pacing lives in the capture script next to the interaction it describes, and adding a beat to the
// flow needs no change here.
//
// It also adds no text, caption or branding: the surrounding home-page copy does the talking, and baked
// in English would not translate (docs/marketing-visuals.md, i18n constraint). One clip, every locale.

export interface SearchFrame {
  name: string
  /** Beat label, e.g. 'idle' | 'filters-open' | 'type-m' | 'profile-scroll-2' | 'contact-open'. */
  kind: string
  /** How many video frames to hold this shot. */
  hold: number
  /** Viewport position in CSS px of the control that produced this shot, when it came from a tap. */
  tap?: {x: number; y: number}
}

export interface SearchManifest {
  query: string
  /** Video canvas, in device px. */
  viewport: {width: number; height: number}
  /** Logical size the app was rendered at — tap coordinates are in this space. */
  cssViewport: {width: number; height: number}
  durationInFrames: number
  frames: SearchFrame[]
}

// The index signature is what makes this assignable to Remotion's `Props extends Record<string,
// unknown>` constraint on <Composition>; without it the component type is rejected.
export type SearchDemoProps = Record<string, unknown> & {
  manifest: SearchManifest | null
  /** Which capture set to play. Each theme has its own frames and manifest under public/search/<theme>/. */
  theme: 'light' | 'dark'
}

/**
 * Which shot is on screen at a given video frame.
 *
 * A step function, not a cross-fade: these are consecutive states of one continuous interaction, and
 * dissolving between them reads as a slideshow rather than as someone using the app.
 */
export function shotAt(m: SearchManifest, frame: number) {
  let elapsed = 0
  for (const shot of m.frames) {
    const start = elapsed
    elapsed += shot.hold
    if (frame < elapsed) return {shot, since: frame - start}
  }
  const last = m.frames[m.frames.length - 1]
  // Past the end: report the shot as fully elapsed so its tap flourish does not replay.
  return {shot: last, since: last.hold}
}

/** How long the tap flourish lasts, in video frames. */
const TAP_FRAMES = 14

/**
 * The press indicator: a ring that expands and fades, with a solid dot at its centre.
 *
 * Without this the clip is a series of UI states that mutate for no visible reason — you can see
 * *that* the filter sheet opened but not that someone pressed a button to open it. The indicator is
 * drawn at the moment the resulting frame appears, which reads as cause and effect.
 *
 * Positioned in percentages of the CSS viewport so it lands correctly whatever the capture scale.
 */
const TapIndicator: React.FC<{
  tap: {x: number; y: number}
  css: {width: number; height: number}
  since: number
  hold: number
}> = ({tap, css, since, hold}) => {
  // Plays over the tail of the shot: the press happens while the pre-click state is still on screen,
  // and the next shot is its consequence.
  const startAt = Math.max(0, hold - TAP_FRAMES)
  if (since < startAt) return null

  const t = Math.min(1, (since - startAt) / TAP_FRAMES) // 0 -> 1
  const ringScale = 0.35 + t * 1.4
  const ringOpacity = (1 - t) * 0.85
  // The dot lingers a little past the ring so the eye keeps the location after the pulse.
  const dotOpacity = Math.max(0, 1 - t * 1.35)

  const left = `${(tap.x / css.width) * 100}%`
  const top = `${(tap.y / css.height) * 100}%`
  const ringSize = `${(96 / css.width) * 100}%`
  const dotSize = `${(26 / css.width) * 100}%`

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: ringSize,
          aspectRatio: '1',
          transform: `translate(-50%, -50%) scale(${ringScale})`,
          borderRadius: '50%',
          border: '6px solid rgba(193,127,62,0.95)',
          opacity: ringOpacity,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left,
          top,
          width: dotSize,
          aspectRatio: '1',
          transform: 'translate(-50%, -50%)',
          borderRadius: '50%',
          backgroundColor: 'rgba(193,127,62,0.9)',
          boxShadow: '0 0 0 6px rgba(193,127,62,0.25)',
          opacity: dotOpacity,
        }}
      />
    </>
  )
}

/**
 * Frames spent dissolving the last shot back into the first.
 *
 * The clip is a `loop`ing `<video>`, and the loop point is a hard cut from the message composer to the
 * unfiltered list — two completely unrelated screens, which reads as a glitch rather than a restart.
 * Every other transition in the clip is a step because it shows one continuous interaction; this one is
 * not a transition at all, so it is the one place a dissolve belongs.
 *
 * Dissolving *to the opening frame* rather than through black or a colour means that by the time the
 * browser wraps around, the video is already showing exactly what frame 0 shows — so the wrap itself is
 * invisible and nothing flashes.
 */
const LOOP_FADE = 20

export const SearchDemo: React.FC<SearchDemoProps> = ({manifest, theme}) => {
  const frame = useCurrentFrame()
  // Matches the app canvas so the frame never flashes a mismatched colour behind the screenshot.
  const backdrop = theme === 'dark' ? '#1A1713' : '#EDE8E0'
  if (!manifest) return <AbsoluteFill style={{backgroundColor: backdrop}} />

  const {shot, since} = shotAt(manifest, frame)
  const css = manifest.cssViewport ?? manifest.viewport

  const first = manifest.frames[0]
  const fadeStart = manifest.durationInFrames - LOOP_FADE
  const loopOpacity = frame < fadeStart ? 0 : (frame - fadeStart) / LOOP_FADE

  return (
    <AbsoluteFill style={{backgroundColor: backdrop}}>
      {shot ? (
        <Img
          src={staticFile(`search/${theme}/${shot.name}`)}
          style={{width: '100%', height: '100%', objectFit: 'cover'}}
        />
      ) : null}
      {shot?.tap && <TapIndicator tap={shot.tap} css={css} since={since} hold={shot.hold} />}
      {loopOpacity > 0 && first ? (
        <Img
          src={staticFile(`search/${theme}/${first.name}`)}
          style={{
            // Must be absolutely positioned: AbsoluteFill only positions itself, its children are in
            // normal flow. Without this the overlay is laid out *below* the full-height shot above it
            // and never appears on screen.
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loopOpacity,
          }}
        />
      ) : null}
    </AbsoluteFill>
  )
}

/**
 * Reads the capture manifest and sizes the composition from it — canvas *and* duration, so re-capturing
 * with a different --query or an extra beat needs no edit here.
 *
 * public/search/ is gitignored and regenerated by the capture script, so a missing manifest is the
 * normal "you haven't captured yet" state: fail with the command that fixes it rather than rendering a
 * silently blank video.
 */
export const calculateSearchDemoMetadata = async ({props}: {props: SearchDemoProps}) => {
  const theme = props.theme ?? 'light'
  const path = `search/${theme}/manifest.json`
  const res = await fetch(staticFile(path))
  if (!res.ok) {
    throw new Error(
      `public/${path} is missing (HTTP ${res.status}). Run: npm run capture:search` +
        (theme === 'dark' ? ':dark' : ''),
    )
  }
  const manifest: SearchManifest = await res.json()
  return {
    durationInFrames: manifest.durationInFrames,
    width: manifest.viewport.width,
    height: manifest.viewport.height,
    props: {...props, manifest},
  }
}
