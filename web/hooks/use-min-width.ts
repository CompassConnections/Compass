import {useState} from 'react'

import {useSafeLayoutEffect} from './use-safe-layout-effect'

/**
 * Whether the window is at least `px` wide, kept live as it resizes.
 *
 * For layouts that must not render both variants (each would load its own images), where a CSS
 * breakpoint would only hide one. False on the server and on the first render, then settled in a
 * layout effect so the first paint already shows the right variant.
 */
export function useMinWidth(px: number) {
  const [matches, setMatches] = useState(false)

  useSafeLayoutEffect(() => {
    const mql = window.matchMedia(`(min-width: ${px}px)`)
    const update = () => setMatches(mql.matches)
    update()
    mql.addEventListener('change', update)
    return () => mql.removeEventListener('change', update)
  }, [px])

  return matches
}
