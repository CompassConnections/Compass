import {useRef, useState} from 'react'
import {useSafeLayoutEffect} from 'web/hooks/use-safe-layout-effect'

/**
 * Drives a number from 0 up to `target` on a rAF timeline.
 *
 * Returns the eased `value` and the *raw* (un-eased) `progress`, because the two are wanted for
 * different things: the value should decelerate hard so the last digits settle rather than crawl, while
 * the styling that rides along (scale, weight, blur) reads better on linear time — easing it twice makes
 * the type snap to its final size long before the number stops moving.
 *
 * Callers pass `run: false` for reduced-motion or not-yet-visible, and get `progress: 1` immediately —
 * the final number, no animation, no flash of zero.
 */

// Expo-out: ~85% of the distance is covered in the first third, so it looks like a counter spinning
// down rather than a linear tween, which reads as a progress bar.
const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t))

export function useCountUp(
  target: number,
  {run, duration = 1500, delay = 0}: {run: boolean; duration?: number; delay?: number},
) {
  const [progress, setProgress] = useState(1)
  const frame = useRef<number | null>(null)

  // Layout effect, not `useEffect`: the zero has to be in place before the browser paints the frame in
  // which `run` flips on, otherwise the final number flashes for one frame and then jumps back to 0.
  useSafeLayoutEffect(() => {
    if (!run) {
      setProgress(1)
      return
    }

    setProgress(0)
    let start: number | null = null

    const tick = (now: number) => {
      if (start === null) start = now
      const t = Math.min(1, Math.max(0, (now - start - delay) / duration))
      setProgress(t)
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)

    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [run, target, duration, delay])

  return {value: Math.round(target * easeOutExpo(progress)), progress}
}
