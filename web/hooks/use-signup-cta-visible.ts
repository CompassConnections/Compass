import {useSyncExternalStore} from 'react'

/**
 * Lets the sidebar hide its "Join us" while the page shows its own sign-up button, so the same CTA is
 * never on screen twice.
 *
 * A page marks its sign-up buttons with `ref={trackSignUpCta}`; the sidebar reads `useIsSignUpCtaVisible`.
 * Module state rather than context because the two sit in unrelated subtrees of the page shell.
 */
const visible = new Set<Element>()
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((l) => l())

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getSnapshot = () => visible.size > 0

export function useIsSignUpCtaVisible() {
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}

/**
 * Ref callback for a sign-up button. A callback rather than a ref object because the buttons mount
 * late (once the user resolves to logged out), after a mount-time effect would already have run.
 */
export function trackSignUpCta(element: Element | null) {
  if (!element) return

  // A button hidden with `display: none` (the hero's on mobile) never intersects, so it never counts.
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) visible.add(element)
      else visible.delete(element)
      emit()
    },
    {threshold: 0},
  )
  observer.observe(element)

  return () => {
    observer.disconnect()
    if (visible.delete(element)) emit()
  }
}
