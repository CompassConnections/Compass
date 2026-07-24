import React from 'react'
import {AbsoluteFill, Img, staticFile} from 'remotion'
import '../components/BrandFonts'
import {colors, fonts} from '../theme'

// The default social preview card — what WhatsApp, X, Slack, LinkedIn etc. show for a shared
// compassmeet.com link. 1200×630 (the 1.91:1 `summary_large_image` slot).
//
// Rendered as a still, uploaded to R2, and pulled into web/public/images at build time; the meta
// tags live in web/pages/_app.tsx. See the README for the full loop.
//
// Design notes, since a preview card is read in under a second at thumbnail size:
//  - It deliberately shares the amber rules, warm cream canvas and serif voice of the per-profile
//    card (web/pages/api/og/profile.tsx) so a shared profile and a shared home link look related.
//  - No faces, no photo grid, no stacked cards — those read as a swiping app at a glance, which is
//    the opposite of the pitch.
//  - Copy is the home page's own (web/components/home/home.tsx), so the card cannot promise
//    something the landing page does not say.

const EYEBROW = 'FREE DIRECTORY · NO ADS · NO ALGORITHMS'
const HEADLINE_TOP = "Don't Swipe."
const HEADLINE_BOTTOM = 'Search.'
const SUBHEAD = 'Find your people based on your values and interests.'
const DOMAIN = 'compassmeet.com'
const FOOTNOTE = 'Non-profit · Open source'

// Paper grain. Inline SVG turbulence rather than an image file: it costs no asset, and at 3.5%
// opacity it is what keeps the flat cream from looking like a screenshot of a blank div.
const GRAIN = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
     <filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" /></filter>
     <rect width="200" height="200" filter="url(#n)" />
   </svg>`,
)}`

// A hairline amber rule, top and bottom — the same device the per-profile card uses.
const Rule: React.FC<{edge: 'top' | 'bottom'}> = ({edge}) => (
  <div
    style={{
      position: 'absolute',
      [edge]: 0,
      left: 0,
      right: 0,
      height: 6,
      background: `linear-gradient(90deg, ${colors.amberDeep} 0%, ${colors.amber} 45%, ${colors.amberBright} 100%)`,
    }}
  />
)

// The compass rose inside concentric rings and bearing ticks: the brand mark doubling as the one
// piece of imagery, and a nod to orientation rather than romance.
const RoseDial: React.FC = () => {
  const outer = 440
  const middle = 372
  const disc = 300
  const ticks = 16

  const ring = (size: number, color: string): React.CSSProperties => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    border: `1px solid ${color}`,
  })

  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        right: 44,
        width: outer,
        height: outer,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Warm glow, so the dial sits in light rather than on top of the canvas */}
      <div
        style={{
          position: 'absolute',
          width: outer + 160,
          height: outer + 160,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.amberPale} 0%, rgba(243,228,206,0) 68%)`,
        }}
      />

      <div style={ring(outer, colors.canvas200)} />
      <div style={ring(middle, colors.amberPale)} />

      {/* Bearing ticks around the outer ring, N/E/S/W longer than the rest */}
      {Array.from({length: ticks}).map((_, i) => {
        const cardinal = i % 4 === 0
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 1.5,
              height: cardinal ? 18 : 9,
              background: cardinal ? colors.amber : colors.canvas200,
              transform: `rotate(${(360 / ticks) * i}deg) translateY(${-outer / 2 + 1}px)`,
              transformOrigin: 'center center',
            }}
          />
        )
      })}

      <div
        style={{
          // Positioned on purpose: every sibling above is either absolute or transformed, which
          // puts them in the positioned-painting layer. A static disc would paint underneath them
          // and the glow would wash the logo out to a ghost.
          position: 'relative',
          width: disc,
          height: disc,
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 24px 60px ${colors.amberDeep}22, 0 0 0 8px ${colors.creamGlow}`,
        }}
      >
        <Img src={staticFile('logo.svg')} style={{width: disc, height: disc}} />
      </div>
    </div>
  )
}

export const OgCard: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(145deg, ${colors.creamGlow} 0%, ${colors.cream} 52%, ${colors.canvas100} 100%)`,
      }}
    >
      {/* Warm light from the upper right, where the dial sits */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(70% 90% at 82% 18%, ${colors.amberPale}88 0%, rgba(243,228,206,0) 70%)`,
        }}
      />
      {/* A cool counterweight from the logo's blue, low enough to read as shadow, not as color */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 60% at 6% 96%, ${colors.logoBlue}14 0%, rgba(29,56,75,0) 72%)`,
        }}
      />

      <RoseDial />

      <AbsoluteFill
        style={{
          padding: '74px 72px 64px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', maxWidth: 660}}>
          <div
            style={{
              fontFamily: fonts.body,
              fontSize: 17,
              fontWeight: 600,
              letterSpacing: 2.6,
              color: colors.amberEmber,
            }}
          >
            {EYEBROW}
          </div>

          <div
            style={{
              fontFamily: fonts.heading,
              fontSize: 92,
              fontWeight: 600,
              lineHeight: 1.03,
              letterSpacing: -1.5,
              color: colors.ink,
              marginTop: 26,
            }}
          >
            <div>{HEADLINE_TOP}</div>
            <div style={{color: colors.amberDeep}}>{HEADLINE_BOTTOM}</div>
          </div>

          <div
            style={{
              fontFamily: fonts.heading,
              fontSize: 33,
              fontWeight: 400,
              lineHeight: 1.38,
              color: colors.ink600,
              marginTop: 28,
              // Tuned so the line breaks after "based on" into two balanced lines rather than
              // leaving "interests." alone on the second.
              maxWidth: 470,
            }}
          >
            {SUBHEAD}
          </div>
        </div>

        <div style={{display: 'flex', flexDirection: 'column'}}>
          <div style={{height: 1, background: colors.canvas200, marginBottom: 22}} />
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
              <div style={{width: 9, height: 9, borderRadius: '50%', background: colors.amber}} />
              <div
                style={{
                  fontFamily: fonts.wordmark,
                  fontSize: 32,
                  fontWeight: 500,
                  letterSpacing: '0.03em',
                  color: colors.ink,
                }}
              >
                {DOMAIN}
              </div>
            </div>
            <div
              style={{
                fontFamily: fonts.body,
                fontSize: 20,
                fontWeight: 500,
                color: colors.ink500,
              }}
            >
              {FOOTNOTE}
            </div>
          </div>
        </div>
      </AbsoluteFill>

      <AbsoluteFill
        style={{
          backgroundImage: `url("${GRAIN}")`,
          opacity: 0.035,
          mixBlendMode: 'multiply',
        }}
      />
      {/* Barely-there vignette: keeps the corners from glowing brighter than the headline */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(85% 85% at 50% 45%, rgba(0,0,0,0) 58%, rgba(30,26,20,0.07) 100%)',
        }}
      />

      <Rule edge="top" />
      <Rule edge="bottom" />
    </AbsoluteFill>
  )
}
