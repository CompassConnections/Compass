import React from 'react'
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import {Background} from '../components/Background'
import {Logo} from '../components/Logo'
import {FadeUp, useSceneFade} from '../components/Animations'
import {colors, fonts} from '../theme'

// A guided tour of a real Compass profile, section by section.
//
// Every shot is a screenshot of the live profile page, captured by
// scripts/capture-profile.mjs into public/profile/. Re-run that script after any
// profile-UI change and this scene picks the new artwork up automatically — but
// update SHOTS below if a card's height changes a lot, since the pan maths uses it.

// ─── Source artwork ─────────────────────────────────────────────────────────
// Sizes are the CSS-pixel dimensions reported by the capture script. Files are 2×
// those numbers; we scale by width, so only the ratio matters here.
const SHOTS = {
  header: {src: 'profile/01-header.png', w: 422, h: 335},
  details: {src: 'profile/02-details.png', w: 422, h: 1217},
  interests: {src: 'profile/03-interests.png', w: 422, h: 422},
  personality: {src: 'profile/04-personality.png', w: 422, h: 464},
  links: {src: 'profile/05-links.png', w: 422, h: 188},
  bio: {src: 'profile/06-bio.png', w: 422, h: 1768},
  photos: {src: 'profile/07-photos.png', w: 422, h: 324},
  prompts: {src: 'profile/08-prompts.png', w: 422, h: 2152},
  full: {src: 'profile/full.png', w: 422, h: 9948},
} as const

// ─── Scene schedule (frames @ 30fps) ────────────────────────────────────────
// Scenes overlap by a few frames so the cross-fades in useSceneFade meet cleanly.
const S = {
  title: {from: 0, dur: 75},
  header: {from: 70, dur: 95},
  details: {from: 160, dur: 115},
  interests: {from: 270, dur: 90},
  personality: {from: 355, dur: 95},
  bio: {from: 445, dur: 115},
  photos: {from: 555, dur: 85},
  prompts: {from: 635, dur: 120},
  links: {from: 750, dur: 70},
  cta: {from: 815, dur: 105},
}
export const PROFILE_TOUR_DURATION = S.cta.from + S.cta.dur // 920 frames ≈ 30.7s

// ─── Layout ─────────────────────────────────────────────────────────────────
// The phone-ish frame the screenshots live in. Its height is what decides whether
// a shot fits or has to pan, so it adapts to the canvas: the 9:16 story gets a tall
// frame, the 4:5 post a short one.
const FRAME_WIDTH = 840

const useFrameBox = () => {
  const {height} = useVideoConfig()
  const captionBlock = height > 1600 ? 430 : 330 // room for eyebrow + caption
  return {
    width: FRAME_WIDTH,
    height: height - captionBlock - 200,
    captionSize: height > 1600 ? 52 : 46,
    eyebrowSize: height > 1600 ? 30 : 26,
  }
}

const Scene: React.FC<{dur: number; children: React.ReactNode}> = ({dur, children}) => {
  const opacity = useSceneFade(dur)
  return (
    <AbsoluteFill
      style={{
        opacity,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 90px',
        textAlign: 'center',
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

const Eyebrow: React.FC<{children: React.ReactNode}> = ({children}) => {
  const {eyebrowSize} = useFrameBox()
  return (
    <div
      style={{
        fontFamily: fonts.display,
        color: colors.amberBright,
        fontSize: eyebrowSize,
        fontWeight: 700,
        letterSpacing: 6,
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  )
}

// ─── The shot ───────────────────────────────────────────────────────────────
// A screenshot inside a rounded frame. Shots taller than the frame pan downward
// over the beat (reads as scrolling the page); shots that fit get a slow Ken Burns
// push so nothing on screen is ever completely static.
//
// `pan` caps how far a tall shot travels, as a fraction of its overscroll — the
// bio is ~4 frames tall, and racing through all of it would just be a blur.
const Shot: React.FC<{
  shot: {src: string; w: number; h: number}
  dur: number
  pan?: number
}> = ({shot, dur, pan = 1}) => {
  const frame = useCurrentFrame()
  const {fps} = useVideoConfig()
  const box = useFrameBox()

  const scale = box.width / shot.w
  const scaledHeight = shot.h * scale
  const overscroll = Math.max(0, scaledHeight - box.height)

  // Hold still for a beat at each end before travelling, so the top of a card
  // (its title) is readable on arrival and the bottom is readable on the cut.
  const HOLD = 12
  const progress = interpolate(frame, [HOLD, dur - HOLD], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const eased = progress * progress * (3 - 2 * progress) // smoothstep

  const translateY = -overscroll * pan * eased
  const zoom = overscroll > 0 ? 1 : interpolate(eased, [0, 1], [1, 1.05])

  // Frame itself springs in, so the cut lands with a little weight.
  const entrance = spring({frame, fps, config: {damping: 200, mass: 0.7}})
  const frameScale = interpolate(entrance, [0, 1], [0.94, 1])

  return (
    <div
      style={{
        width: box.width,
        height: Math.min(box.height, scaledHeight),
        borderRadius: 34,
        overflow: 'hidden',
        border: `1.5px solid ${colors.amberBright}44`,
        boxShadow: `0 40px 120px rgba(0,0,0,0.55), 0 0 0 10px ${colors.espresso}`,
        transform: `scale(${frameScale})`,
        flexShrink: 0,
      }}
    >
      <Img
        src={staticFile(shot.src)}
        style={{
          width: box.width,
          display: 'block',
          transform: `translateY(${translateY}px) scale(${zoom})`,
          transformOrigin: 'top center',
        }}
      />
    </div>
  )
}

// A titled beat: eyebrow + one-line caption above the framed screenshot.
const SectionScene: React.FC<{
  eyebrow: string
  caption: React.ReactNode
  shot: {src: string; w: number; h: number}
  dur: number
  pan?: number
}> = ({eyebrow, caption, shot, dur, pan}) => {
  const box = useFrameBox()
  const opacity = useSceneFade(dur)
  const {height} = useVideoConfig()

  // The caption block is pinned to a fixed offset rather than centred with the
  // shot: a short card (Links) would otherwise drag the text down the frame while
  // a tall one (Details) pushes it up, and the wobble is obvious cut to cut.
  return (
    <AbsoluteFill style={{opacity, padding: `${height * 0.11}px 90px 0`, textAlign: 'center'}}>
      <FadeUp>
        <Eyebrow>{eyebrow}</Eyebrow>
      </FadeUp>
      <FadeUp delay={8} style={{marginTop: 18}}>
        <div
          style={{
            fontFamily: fonts.display,
            color: colors.cream,
            fontSize: box.captionSize,
            fontWeight: 700,
            lineHeight: 1.25,
          }}
        >
          {caption}
        </div>
      </FadeUp>
      {/* Shots are centred in whatever vertical space the caption leaves. */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
        }}
      >
        <Shot shot={shot} dur={dur} pan={pan} />
      </div>
    </AbsoluteFill>
  )
}

// ─── Scene 1 — title, over the whole page scrolling by ──────────────────────
const TitleScene: React.FC = () => {
  const frame = useCurrentFrame()
  const {height} = useVideoConfig()

  return (
    <Scene dur={S.title.dur}>
      {/* The entire profile drifting past, dimmed right down — sets up "there's a
          lot here" before we start pulling out individual sections. */}
      <AbsoluteFill style={{overflow: 'hidden', opacity: 0.28}}>
        <Img
          src={staticFile(SHOTS.full.src)}
          style={{
            width: 1080,
            display: 'block',
            transform: `translateY(${-frame * 14 - height * 0.1}px)`,
            transformOrigin: 'top center',
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background: `linear-gradient(${colors.ink}dd, ${colors.ink}bb, ${colors.ink}dd)`,
        }}
      />
      <div style={{position: 'relative', textAlign: 'center'}}>
        <FadeUp>
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <Logo size={180} />
          </div>
        </FadeUp>
        <FadeUp delay={12} style={{marginTop: 46}}>
          <div
            style={{
              fontFamily: fonts.display,
              color: colors.cream,
              fontSize: 78,
              fontWeight: 800,
              lineHeight: 1.15,
            }}
          >
            What a Compass
            <br />
            profile looks like
          </div>
        </FadeUp>
        <FadeUp delay={24} style={{marginTop: 24}}>
          <div
            style={{
              fontFamily: fonts.serif,
              color: colors.amberBright,
              fontSize: 44,
              fontStyle: 'italic',
            }}
          >
            No filters. No algorithm. Just you.
          </div>
        </FadeUp>
      </div>
    </Scene>
  )
}

// ─── Scene 9 — call to action ───────────────────────────────────────────────
const CtaScene: React.FC = () => (
  <Scene dur={S.cta.dur}>
    <FadeUp>
      <Logo size={190} />
    </FadeUp>
    <FadeUp delay={12} style={{marginTop: 44}}>
      <div
        style={{
          fontFamily: fonts.display,
          color: colors.cream,
          fontSize: 80,
          fontWeight: 800,
          lineHeight: 1.2,
        }}
      >
        Build yours in
        <br />
        five minutes
      </div>
    </FadeUp>
    <FadeUp delay={22} style={{marginTop: 30}}>
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: 56,
          fontWeight: 700,
          color: colors.espresso,
          background: `linear-gradient(${colors.amberBright}, ${colors.amber})`,
          padding: '20px 48px',
          borderRadius: 999,
          boxShadow: `0 20px 60px ${colors.amberDeep}66`,
        }}
      >
        compassmeet.com
      </div>
    </FadeUp>
    <FadeUp delay={34} style={{marginTop: 38}}>
      <div
        style={{
          fontFamily: fonts.display,
          color: colors.amberBright,
          fontSize: 32,
          fontWeight: 600,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        Free · Ad-free · Open-source
      </div>
    </FadeUp>
  </Scene>
)

// ─── Composition ────────────────────────────────────────────────────────────
export const ProfileTour: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: colors.ink}}>
      <Background />

      <Sequence from={S.title.from} durationInFrames={S.title.dur}>
        <TitleScene />
      </Sequence>

      <Sequence from={S.header.from} durationInFrames={S.header.dur}>
        <SectionScene
          eyebrow="Who they are"
          caption={
            <>
              Name, place, and the four things
              <br />
              they care about most.
            </>
          }
          shot={SHOTS.header}
          dur={S.header.dur}
        />
      </Sequence>

      <Sequence from={S.details.from} durationInFrames={S.details.dur}>
        <SectionScene
          eyebrow="Details"
          caption={
            <>
              What you'd actually want to know —
              <br />
              openly stated, not guessed.
            </>
          }
          shot={SHOTS.details}
          dur={S.details.dur}
        />
      </Sequence>

      <Sequence from={S.interests.from} durationInFrames={S.interests.dur}>
        <SectionScene
          eyebrow="Interests & causes"
          caption={<>Searchable. Find your people by what they love.</>}
          shot={SHOTS.interests}
          dur={S.interests.dur}
        />
      </Sequence>

      <Sequence from={S.personality.from} durationInFrames={S.personality.dur}>
        <SectionScene
          eyebrow="Personality"
          caption={<>MBTI and Big Five, if you want to share them.</>}
          shot={SHOTS.personality}
          dur={S.personality.dur}
        />
      </Sequence>

      <Sequence from={S.bio.from} durationInFrames={S.bio.dur}>
        <SectionScene
          eyebrow="About me"
          caption={
            <>
              Room to write properly.
              <br />
              Not 150 characters.
            </>
          }
          shot={SHOTS.bio}
          // The bio runs several screens deep — travel through the top half only.
          pan={0.55}
          dur={S.bio.dur}
        />
      </Sequence>

      <Sequence from={S.photos.from} durationInFrames={S.photos.dur}>
        <SectionScene
          eyebrow="Photos"
          caption={<>Down here, on purpose. Words come first.</>}
          shot={SHOTS.photos}
          dur={S.photos.dur}
        />
      </Sequence>

      <Sequence from={S.prompts.from} durationInFrames={S.prompts.dur}>
        <SectionScene
          eyebrow="Compatibility prompts"
          caption={
            <>
              Real positions on real questions.
              <br />
              Not a vibe check.
            </>
          }
          shot={SHOTS.prompts}
          // Eight prompts deep and paginated — drift over the first few rather
          // than racing the whole card.
          pan={0.35}
          dur={S.prompts.dur}
        />
      </Sequence>

      <Sequence from={S.links.from} durationInFrames={S.links.dur}>
        <SectionScene
          eyebrow="Links"
          caption={<>Your corner of the web, attached.</>}
          shot={SHOTS.links}
          dur={S.links.dur}
        />
      </Sequence>

      <Sequence from={S.cta.from} durationInFrames={S.cta.dur}>
        <CtaScene />
      </Sequence>
    </AbsoluteFill>
  )
}
