import {useRouter} from 'next/router'
import {RefObject, useEffect} from 'react'

// How far the page has to travel in one direction before the bar reacts. Small enough to feel
// immediate, large enough that the jitter of a finger resting on the screen does not flicker it.
const HIDE_AFTER_PX = 16
const SHOW_AFTER_PX = 8
// Within this distance of either end of the page the bar is always shown: at the top nothing has
// been scrolled away yet, and at the bottom the reader is done with the page and about to navigate.
const EDGE_PX = 80

const HIDDEN_CLASS = 'bottom-nav-hidden'

type ScrollTally = {lastY: number; travelled: number}

/**
 * Feeds one scroll position in. Returns whether the bar should now be hidden, or undefined to leave
 * it as it is. Shared by the window-driven bottom nav and by inner scroll containers.
 */
function stepScrollTally(tally: ScrollTally, y: number, maxY: number): boolean | undefined {
  const delta = y - tally.lastY
  tally.lastY = y

  // Also covers the iOS rubber band, which reports scroll positions beyond either end.
  if (y <= EDGE_PX || y >= maxY - EDGE_PX) {
    tally.travelled = 0
    return false
  }
  if (delta === 0) return undefined

  // Reset the tally whenever the direction flips.
  tally.travelled =
    Math.sign(delta) === Math.sign(tally.travelled) ? tally.travelled + delta : delta
  if (tally.travelled > HIDE_AFTER_PX) return true
  if (tally.travelled < -SHOW_AFTER_PX) return false
  return undefined
}

/**
 * Slides the mobile bottom nav bar out of the way while the reader scrolls down the page, and back
 * as soon as they scroll up, reach either end of the page, change page or focus into the bar — the
 * pattern people know from Facebook / LinkedIn.
 *
 * Only ever driven by scrolling: nothing else hides the bar, so a page that does not scroll keeps it.
 * Pages whose content scrolls in an inner container (private messages) never move the window, so
 * they are unaffected too.
 *
 * Like useHideBottomNavOnKeyboard, it toggles a class on `<body>` and leaves the rest to
 * `globals.css`, so a scroll frame costs no re-render. The bar translates by its *full* height,
 * safe-area padding included, so in the native apps the page shows through behind the system
 * navigation bar / home indicator while it is hidden.
 *
 * Sticky top bars that opt in with the `hides-on-scroll` class (the profile header) ride the same
 * body class and slide up instead, so the two move together.
 */
export const useHideBottomNavOnScroll = () => {
  const router = useRouter()

  useEffect(() => {
    const body = document.body
    // `travelled` is the distance moved in the current direction; positive is down.
    const tally: ScrollTally = {lastY: window.scrollY, travelled: 0}
    let frame = 0

    const setHidden = (hidden: boolean) => body.classList.toggle(HIDDEN_CLASS, hidden)

    const update = () => {
      frame = 0
      const maxY = document.documentElement.scrollHeight - window.innerHeight
      const hidden = stepScrollTally(tally, window.scrollY, maxY)
      if (hidden !== undefined) setHidden(hidden)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // A new page starts with the bar visible. Scroll restoration jumps the window afterwards, so the
    // baseline is re-read then, rather than treating the jump as the reader scrolling down.
    const onRouteChange = () => {
      setHidden(false)
      tally.travelled = 0
      requestAnimationFrame(() => (tally.lastY = window.scrollY))
    }

    // Keyboard users tabbing into a hidden bar should be able to see what they are focusing.
    const onFocusIn = (e: FocusEvent) => {
      if ((e.target as Element | null)?.closest?.('.bottom-nav, .hides-on-scroll')) setHidden(false)
    }

    window.addEventListener('scroll', onScroll, {passive: true})
    document.addEventListener('focusin', onFocusIn)
    router.events.on('routeChangeComplete', onRouteChange)

    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('focusin', onFocusIn)
      router.events.off('routeChangeComplete', onRouteChange)
      if (frame) cancelAnimationFrame(frame)
      setHidden(false)
    }
  }, [router.events])
}

/** Class set on an inner scroll container while its `hides-on-scroll` bars are slid away. */
export const SCROLL_HIDDEN_CLASS = 'scroll-hidden'

/**
 * The same cue for a container that scrolls on its own rather than with the window (the profile
 * panel beside a chat): toggles `scroll-hidden` on that element, which `globals.css` turns into the
 * same slide for any `hides-on-scroll` bar inside it. Scoped to the element so it never touches the
 * bottom nav, which belongs to the window.
 */
export const useHideOnScrollWithin = (ref: RefObject<HTMLElement | null>) => {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const tally: ScrollTally = {lastY: el.scrollTop, travelled: 0}
    let frame = 0

    const setHidden = (hidden: boolean) => el.classList.toggle(SCROLL_HIDDEN_CLASS, hidden)

    const update = () => {
      frame = 0
      const hidden = stepScrollTally(tally, el.scrollTop, el.scrollHeight - el.clientHeight)
      if (hidden !== undefined) setHidden(hidden)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    const onFocusIn = (e: FocusEvent) => {
      if ((e.target as Element | null)?.closest?.('.hides-on-scroll')) setHidden(false)
    }

    el.addEventListener('scroll', onScroll, {passive: true})
    el.addEventListener('focusin', onFocusIn)

    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('focusin', onFocusIn)
      if (frame) cancelAnimationFrame(frame)
      setHidden(false)
    }
  }, [ref])
}
