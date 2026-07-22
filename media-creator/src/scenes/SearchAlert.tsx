import React from 'react'
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion'

import {SearchFrame, SearchManifest, shotAt, TapIndicator} from './SearchDemo'

// The about-page clip: the saved-search loop, end to end.
//
// Filter the people page down to something specific, find nobody, ask to be told when someone turns
// up, and days later open the email that says someone has — then their profile, then the composer.
//
// This is the one differentiator on the about page that a screenshot cannot carry, because the whole
// claim is about something that happens *later*. It needs elapsed time, so it needs a clip.
//
// Like SearchDemo this is a dumb sequencer over frames captured by scripts/capture-alert.mjs, with
// pacing carried per-frame in the manifest. It adds exactly one thing that scene does not: a dissolve
// at the moment the email arrives.

/**
 * Frames spent dissolving into a shot marked `fadeIn`.
 */
const GAP_FADE = 22

/**
 * The time-passing interstitial, in video frames (~2s at 30fps).
 *
 * A dissolve alone was not enough. It said "something changed", not "days went by" — and without that,
 * the email looks like it arrived the instant the search was saved, which is precisely the wrong idea
 * about a feature whose whole point is that it works while you are not looking.
 *
 * So there is a real beat here: the saved-search screen recedes and dims, three days tick across, and
 * the email arrives out of it. Synthesised in Remotion rather than captured, because it is the one
 * moment in the clip that is not a thing the product renders.
 *
 * This does bake English ("3 days later") into the clip. Acceptable here and not elsewhere: the middle
 * of this clip is a screenshot of an English email, so it is already English-only. The hero clip has no
 * text for exactly the opposite reason — one render serves every locale.
 */
const GAP_HOLD = 54
const GAP_DAYS = 3

/** Brand amber — the same accent the tap indicator and the app's primary controls use. */
const ACCENT = '#C17F3E'

/**
 * Spotlights the fields on the profile that satisfy the saved search.
 *
 * The clip's whole argument is "the platform found someone who fits", and without this the profile
 * beat just scrolls past — the viewer is asked to take the match on trust. This dims everything else
 * and rings the fields that actually matched, each captioned with the criterion it satisfies.
 *
 * **This is editorial annotation, not product UI, and it is drawn to look like it.** Compass has no
 * "matches your search" highlighting on profiles; inventing chrome that implied otherwise would be
 * claiming a feature that does not exist, which is the one thing these visuals are not allowed to do.
 * So: a scrim and a ring in the brand accent, captions in the clip's own voice — deliberately unlike
 * anything the app renders. (The tap indicator is different in kind: it depicts a finger, not a
 * feature.)
 *
 * Geometry comes from the capture script measuring the live DOM, so a profile restyle moves these
 * with it rather than leaving them pointing at blank space.
 */
const Spotlight: React.FC<{
  // `label` rides along on each highlight but is not drawn — it names the facet in the capture
  // script's warnings and keeps the manifest self-describing.
  highlights: NonNullable<SearchFrame['highlights']>
  css: {width: number; height: number}
  since: number
  hold: number
}> = ({highlights, css, since, hold}) => {
  const fadeIn = Math.min(1, since / 12)
  const fadeOut = Math.max(0, (since - (hold - 14)) / 14)
  const opacity = Math.max(0, Math.min(fadeIn, 1 - fadeOut))
  if (opacity <= 0) return null

  const PAD = 6

  return (
    <svg
      viewBox={`0 0 ${css.width} ${css.height}`}
      style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity}}
    >
      <defs>
        <mask id="spotlight-mask">
          <rect x="0" y="0" width={css.width} height={css.height} fill="white" />
          {highlights.map((h, i) => (
            <rect
              key={i}
              x={h.x - PAD}
              y={h.y - PAD}
              width={h.w + PAD * 2}
              height={h.h + PAD * 2}
              rx="9"
              fill="black"
            />
          ))}
        </mask>
      </defs>

      {/* One scrim with the matched fields punched out of it, rather than a box drawn over each —
          the point is that everything else recedes, not that these get decorated. */}
      <rect
        x="0"
        y="0"
        width={css.width}
        height={css.height}
        fill="rgba(22,17,11,0.55)"
        mask="url(#spotlight-mask)"
      />

      {highlights.map((h, i) => {
        // Staggered, so the eye is walked through the matches one at a time rather than handed all
        // of them at once. Each circle takes about a third of a second to draw.
        const at = Math.max(0, Math.min(1, (since - 8 - i * 11) / 11))
        if (at <= 0) return null

        // An ellipse round the field, drawn on rather than appearing — the gesture someone makes with
        // a pen when they are checking items off a list, which is exactly what the viewer is doing.
        // No caption: the criteria were just read out in the email a beat earlier, and repeating them
        // here crowded the fields they were pointing at.
        const rx = h.w / 2 + PAD + 5
        const ry = h.h / 2 + PAD + 3
        // Ramanujan's approximation — close enough to run the dash offset off, and cheap.
        const perimeter = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)))

        return (
          <ellipse
            key={i}
            cx={h.x + h.w / 2}
            cy={h.y + h.h / 2}
            rx={rx}
            ry={ry}
            fill="none"
            stroke={ACCENT}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={perimeter}
            // Slightly past a full turn, so the stroke overshoots its start the way a hand-drawn ring
            // does instead of closing on a seam.
            strokeDashoffset={perimeter * (1 - at) - perimeter * 0.04 * at}
            // A degree or two off-axis keeps it from reading as a UI element the app drew.
            transform={`rotate(${i % 2 === 0 ? -2.2 : 1.8} ${h.x + h.w / 2} ${h.y + h.h / 2})`}
          />
        )
      })}
    </svg>
  )
}

export type SearchAlertProps = Record<string, unknown> & {
  manifest: SearchManifest | null
  theme: 'light' | 'dark'
}

/**
 * The interstitial: the last app frame pushed back and dimmed, with days ticking over it.
 *
 * Drawn on top of the outgoing screenshot rather than on a flat colour, so the clip never fully cuts
 * away — the phone is still there, just receding, which is what makes it read as elapsed time on the
 * same screen rather than as a scene change.
 */
/** The scrim the interstitial lays over the app. Shared, because the email dissolves in over exactly
 *  this — see the note in the component below. */
const veilOf = (theme: 'light' | 'dark') =>
  theme === 'dark' ? 'rgba(12,10,8,0.86)' : 'rgba(24,19,12,0.80)'

const TimeGap: React.FC<{since: number; hold: number; theme: 'light' | 'dark'}> = ({
  since,
  hold,
  theme,
}) => {
  const t = Math.min(1, since / 12)
  // The dots and caption fade at the end; the scrim itself does not. It used to, and that was a bug
  // you could see: the veil lifted, the saved-search screen came back at full strength for a few
  // frames, and only then did the email start dissolving in — so the clip appeared to return to where
  // it had just been. The scrim now holds until the email takes over on top of it.
  const out = Math.max(0, (since - (hold - 14)) / 14)
  // Light in both themes. The veil is dark either way — it has to be, or the app screenshot behind it
  // still reads as the live screen — so taking the ink from the theme put dark brown text on a dark
  // scrim in light mode and the caption nearly disappeared.
  const ink = '#F7F2EA'
  const veil = veilOf(theme)

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: veil,
        backdropFilter: 'blur(6px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 34,
        opacity: t,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 34,
          opacity: 1 - out,
        }}
      >
        <div style={{display: 'flex', gap: 22}}>
          {Array.from({length: GAP_DAYS}).map((_, i) => {
            // Each day lights in turn across the middle of the beat, so the count is something you
            // watch happen rather than read.
            const at = 0.18 + i * 0.22
            const lit = Math.max(0, Math.min(1, (since / hold - at) * 9))
            return (
              <div
                key={i}
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: '50%',
                  border: `3px solid ${theme === 'dark' ? '#5A4A33' : '#C7B49A'}`,
                  background: `rgba(193,127,62,${lit})`,
                  transform: `scale(${0.82 + lit * 0.18})`,
                }}
              />
            )
          })}
        </div>
        <div
          style={{
            color: ink,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 46,
            letterSpacing: '0.01em',
            opacity: Math.min(1, Math.max(0, (since / hold - 0.34) * 4)),
          }}
        >
          3 days later
        </div>
      </div>
    </div>
  )
}

export const SearchAlert: React.FC<SearchAlertProps> = ({manifest, theme}) => {
  const frame = useCurrentFrame()
  const backdrop = theme === 'dark' ? '#1A1713' : '#EDE8E0'
  if (!manifest) return <AbsoluteFill style={{backgroundColor: backdrop}} />

  const {shot, since} = shotAt(manifest, frame)
  const css = manifest.cssViewport ?? manifest.viewport
  const index = manifest.frames.indexOf(shot)
  const previous = index > 0 ? manifest.frames[index - 1] : null

  // While a `fadeIn` shot is dissolving in, the previous shot is still painted underneath it.
  const dissolving = shot.fadeIn && since < GAP_FADE
  const opacity = dissolving ? since / GAP_FADE : 1

  const first = manifest.frames[0]
  const fadeStart = manifest.durationInFrames - GAP_FADE
  const loopOpacity = frame < fadeStart ? 0 : (frame - fadeStart) / GAP_FADE

  const img = (name: string, style: React.CSSProperties = {}) => (
    <Img
      src={staticFile(`alert/${theme}/${name}`)}
      style={{
        // Children of AbsoluteFill are in normal flow — it positions only itself — so anything meant
        // to stack has to say so explicitly or it lays out below the frame above it and never shows.
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        ...style,
      }}
    />
  )

  // The synthetic gap beat carries no screenshot of its own — it holds the previous frame and draws
  // the day counter over it.
  if (shot.gap) {
    return (
      <AbsoluteFill style={{backgroundColor: backdrop}}>
        {previous ? img(previous.name) : null}
        <TimeGap since={since} hold={shot.hold} theme={theme} />
      </AbsoluteFill>
    )
  }

  return (
    <AbsoluteFill style={{backgroundColor: backdrop}}>
      {dissolving && previous ? (
        previous.gap ? (
          // Coming out of the interstitial: underlay the pre-gap shot *with the scrim still on it*, so
          // the email fades up from exactly the state the gap ended in. Underlaying the bare
          // screenshot is what let the saved-search screen flash back for a fraction of a second.
          <>
            {img(manifest.frames[index - 2].name)}
            <div style={{position: 'absolute', inset: 0, background: veilOf(theme)}} />
          </>
        ) : (
          img(previous.name)
        )
      ) : null}
      {img(shot.name, {opacity})}
      {/* Suppressed mid-dissolve: a press indicator over a half-faded frame reads as a glitch, and
          the shot being dissolved into is an arrival, not something anybody tapped. */}
      {shot.tap && !dissolving && (
        <TapIndicator tap={shot.tap} css={css} since={since} hold={shot.hold} />
      )}
      {shot.highlights?.length && !dissolving ? (
        <Spotlight highlights={shot.highlights} css={css} since={since} hold={shot.hold} />
      ) : null}
      {loopOpacity > 0 && first ? img(first.name, {opacity: loopOpacity}) : null}
    </AbsoluteFill>
  )
}

/**
 * Sizes the composition from the capture manifest — canvas and duration both — so re-capturing with a
 * different filter set or an extra beat needs no edit here.
 *
 * public/alert/ is gitignored and regenerated by the capture script, so a missing manifest is the
 * ordinary "not captured yet" state. Fail with the command that fixes it rather than rendering blank.
 */
export const calculateSearchAlertMetadata = async ({props}: {props: SearchAlertProps}) => {
  const theme = props.theme ?? 'light'
  const path = `alert/${theme}/manifest.json`
  const res = await fetch(staticFile(path))
  if (!res.ok) {
    throw new Error(
      `public/${path} is missing (HTTP ${res.status}). Run: npm run capture:alert` +
        (theme === 'dark' ? ':dark' : ''),
    )
  }
  const raw: SearchManifest = await res.json()

  // Insert the time-passing beat immediately before the email, rather than asking the capture script
  // to emit a placeholder frame for something it cannot photograph. The manifest stays a pure record
  // of what was captured; this is presentation.
  const frames: SearchFrame[] = []
  for (const f of raw.frames) {
    if (f.fadeIn && f.kind === 'email') {
      frames.push({name: '', kind: 'time-gap', hold: GAP_HOLD, gap: true})
    }
    frames.push(f)
  }
  const manifest: SearchManifest = {
    ...raw,
    frames,
    durationInFrames: frames.reduce((sum, f) => sum + f.hold, 0),
  }

  return {
    durationInFrames: manifest.durationInFrames,
    width: manifest.viewport.width,
    height: manifest.viewport.height,
    props: {...props, manifest},
  }
}
