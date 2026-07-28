import {debug} from 'common/logger'
import {Router} from 'next/router'
import {useEffect} from 'react'

/**
 * Scroll restoration that doesn't depend on *how* we go back.
 *
 * Next only restores scroll on the popstate path (and only with `experimental.scrollRestoration`), so any
 * back that has to be emulated with a `router.push` — which is what the Android hardware back button falls
 * back to on the entry the app booted on — lands at the top of the page. Here we snapshot the scroll
 * position of the page we're leaving ourselves, and put it back whenever the next navigation is a
 * *backward* one, whichever router call produced it.
 */

const scrollPositions: Record<string, number> = {}

/** Whether the navigation currently in flight is a backward one (only then do we restore). */
let isBackNavigation = false

/** asPath of the page currently on screen; Router.asPath only updates once the change completes. */
let currentPath: string | undefined

/** How long to keep re-applying the scroll while the restored page is still filling in. */
const RESTORE_TIMEOUT_MS = 1000

/** Call right before a `router.push` that is semantically a "back", so its scroll gets restored too. */
export function markBackNavigation() {
  isBackNavigation = true
}

function restoreScroll(path: string) {
  const target = scrollPositions[path]
  if (!target) return
  debug('restoring scroll', path, target)

  const deadline = Date.now() + RESTORE_TIMEOUT_MS
  let cancelled = false
  const cancel = () => {
    cancelled = true
  }
  // Never fight the user for control of the scroll.
  const events = ['wheel', 'touchstart', 'keydown'] as const
  events.forEach((e) => window.addEventListener(e, cancel, {passive: true, once: true}))
  const stop = () => events.forEach((e) => window.removeEventListener(e, cancel))

  const attempt = () => {
    if (cancelled) return stop()
    window.scrollTo(0, target)
    // The page can still be mounting (or its images loading), so the document may not be tall enough to
    // reach the target yet. Keep trying until it is, or until we give up.
    if (Math.abs(window.scrollY - target) > 1 && Date.now() < deadline) {
      requestAnimationFrame(attempt)
    } else {
      stop()
    }
  }
  requestAnimationFrame(attempt)
}

export function useScrollRestoration() {
  useEffect(() => {
    // Matches the `url` Next hands us on routeChangeComplete (path + query, no origin).
    currentPath ??= window.location.pathname + window.location.search

    // Browser / hardware back and forward both come through popstate; `router.back()` included.
    const onPopState = () => {
      isBackNavigation = true
    }

    const onRouteChangeStart = () => {
      if (currentPath) scrollPositions[currentPath] = window.scrollY
    }

    const onRouteChangeComplete = (url: string) => {
      currentPath = url
      if (isBackNavigation) restoreScroll(url)
      isBackNavigation = false
    }

    const onRouteChangeError = () => {
      isBackNavigation = false
    }

    window.addEventListener('popstate', onPopState)
    Router.events.on('routeChangeStart', onRouteChangeStart)
    Router.events.on('routeChangeComplete', onRouteChangeComplete)
    Router.events.on('routeChangeError', onRouteChangeError)
    return () => {
      window.removeEventListener('popstate', onPopState)
      Router.events.off('routeChangeStart', onRouteChangeStart)
      Router.events.off('routeChangeComplete', onRouteChangeComplete)
      Router.events.off('routeChangeError', onRouteChangeError)
    }
  }, [])
}
