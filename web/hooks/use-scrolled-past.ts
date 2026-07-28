import {useEffect, useRef, useState} from 'react'

/**
 * Tracks whether the observed element has scrolled out of view *above* the viewport.
 *
 * Used by the profile page to fade the identity + actions into the sticky top bar once the hero is
 * gone, so connecting stays one click away no matter how far down someone has read.
 */
export function useScrolledPast<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null)
  const [scrolledPast, setScrolledPast] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        // An element that has not been reached yet is also not intersecting, hence the top check.
        setScrolledPast(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      {threshold: 0},
    )
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return {ref, scrolledPast}
}
