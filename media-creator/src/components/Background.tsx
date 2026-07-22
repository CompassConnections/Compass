import {AbsoluteFill, useCurrentFrame} from 'remotion'
import {colors} from '../theme'

// Warm espresso gradient with a slow-drifting amber glow. Used behind every scene
// so cuts feel like one continuous piece rather than isolated slides.
export const Background: React.FC = () => {
  const frame = useCurrentFrame()

  // Gentle vertical drift of the glow, looping calmly over ~8s.
  const drift = Math.sin(frame / 70) * 120
  const drift2 = Math.cos(frame / 90) * 100

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, ${colors.espresso} 0%, ${colors.ink} 55%, ${colors.espressoDeep} 100%)`,
      }}
    >
      <AbsoluteFill
        style={{
          background: `radial-gradient(60% 40% at 30% ${28 + drift / 10}%, ${
            colors.amberDeep
          }55 0%, transparent 70%)`,
          transform: `translateY(${drift}px)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(55% 35% at 75% ${80 + drift2 / 12}%, ${
            colors.logoBlue
          }50 0%, transparent 70%)`,
          transform: `translateY(${drift2}px)`,
        }}
      />
      {/* Subtle grain-free vignette to focus the center */}
      <AbsoluteFill
        style={{
          background: 'radial-gradient(80% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.45) 100%)',
        }}
      />
    </AbsoluteFill>
  )
}
