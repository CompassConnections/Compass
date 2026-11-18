import {HeartIcon} from '@heroicons/react/24/solid'
import {range} from 'lodash'
import {useEffect, useMemo, useState} from 'react'
import {createPortal} from 'react-dom'

const HEART_COUNT = 22
/** Longest a heart can still be on screen: the largest delay plus the longest rise. */
const BURST_MS = 3600

/**
 * A handful of hearts rising from the bottom of the screen, once, then gone.
 *
 * Mount it to play it — give it a `key` to play it again. It sits above everything, including the
 * dialog that triggered it, and takes no pointer events, so nothing under it stops working while it
 * runs. Members who asked for reduced motion get nothing at all rather than a toned-down version: the
 * whole of it is decoration.
 */
export function HeartBurst() {
  const [done, setDone] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(true)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
    const timer = setTimeout(() => setDone(true), BURST_MS)
    return () => clearTimeout(timer)
  }, [])

  // Scattered once per mount, so a re-render mid-flight does not reshuffle hearts already in the air.
  const hearts = useMemo(
    () =>
      range(HEART_COUNT).map((i) => ({
        id: i,
        left: 4 + Math.random() * 92,
        size: 16 + Math.random() * 22,
        delay: Math.random() * 900,
        duration: 1900 + Math.random() * 800,
        drift: (Math.random() - 0.5) * 120,
        tilt: (Math.random() - 0.5) * 50,
        strong: i % 3 === 0,
      })),
    [],
  )

  if (done || reducedMotion) return null

  return createPortal(
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1000] overflow-hidden"
      data-testid="heart-burst"
    >
      {hearts.map((h) => (
        <HeartIcon
          key={h.id}
          className={h.strong ? 'heart-burst-heart text-primary-700' : 'heart-burst-heart text-cta'}
          style={
            {
              left: `${h.left}%`,
              width: h.size,
              height: h.size,
              animationDelay: `${h.delay}ms`,
              animationDuration: `${h.duration}ms`,
              '--heart-drift': `${h.drift}px`,
              '--heart-tilt': `${h.tilt}deg`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>,
    document.body,
  )
}
