import {RefObject, useEffect, useRef} from 'react'

/**
 * Keeps a scroll container's distance from the *bottom* constant while the container itself is being
 * resized.
 *
 * Why: on the chat page the message list is sized off the visual viewport (see
 * `useVisualViewportHeight`). When the on-screen keyboard opens the list shrinks by the keyboard height,
 * but `scrollTop` is measured from the top and doesn't move — so the last messages slide out under the
 * composer and the user has to scroll down by the keyboard height to see what they were reading.
 * Re-anchoring to the bottom on every resize scrolls exactly that much for them, and closing the keyboard
 * gives the same content back.
 *
 * It also covers the other things that change the list's height: the bottom nav hiding while the keyboard
 * is open, and the composer growing as a long draft wraps onto more lines.
 */
export const usePreserveScrollFromBottom = (ref: RefObject<HTMLElement | null>) => {
  const distanceFromBottom = useRef(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      distanceFromBottom.current = Math.max(0, el.scrollHeight - el.clientHeight - el.scrollTop)
    }
    measure()
    el.addEventListener('scroll', measure, {passive: true})

    // Only the container's own size matters here: content growing (new messages, loading older ones)
    // changes scrollHeight, not clientHeight, so this leaves those flows to their own scroll handling.
    const observer = new ResizeObserver(() => {
      el.scrollTop = Math.max(0, el.scrollHeight - el.clientHeight - distanceFromBottom.current)
    })
    observer.observe(el)

    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
    }
  }, [ref])
}
