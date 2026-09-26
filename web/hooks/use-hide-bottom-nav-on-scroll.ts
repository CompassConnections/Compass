import {useRouter} from 'next/router'
import {useEffect} from 'react'

// How far the page has to travel in one direction before the bar reacts. Small enough to feel
// immediate, large enough that the jitter of a finger resting on the screen does not flicker it.
const HIDE_AFTER_PX = 16
const SHOW_AFTER_PX = 8
// Within this distance of either end of the page the bar is always shown: at the top nothing has
// been scrolled away yet, and at the bottom the reader is done with the page and about to navigate.
const EDGE_PX = 80

const HIDDEN_CLASS = 'bottom-nav-hidden'

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
 */
export const useHideBottomNavOnScroll = () => {
  const router = useRouter()

  useEffect(() => {
    const body = document.body
    let lastY = window.scrollY
    // Distance travelled in the current direction; positive is down.
    let travelled = 0
    let frame = 0

    const setHidden = (hidden: boolean) => body.classList.toggle(HIDDEN_CLASS, hidden)

    const update = () => {
      frame = 0
      const y = window.scrollY
      const maxY = document.documentElement.scrollHeight - window.innerHeight
      const delta = y - lastY
      lastY = y

      // Also covers the iOS rubber band, which reports scroll positions beyond either end.
      if (y <= EDGE_PX || y >= maxY - EDGE_PX) {
        travelled = 0
        setHidden(false)
        return
      }
      if (delta === 0) return

      // Reset the tally whenever the direction flips.
      travelled = Math.sign(delta) === Math.sign(travelled) ? travelled + delta : delta
      if (travelled > HIDE_AFTER_PX) setHidden(true)
      else if (travelled < -SHOW_AFTER_PX) setHidden(false)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    // A new page starts with the bar visible. Scroll restoration jumps the window afterwards, so the
    // baseline is re-read then, rather than treating the jump as the reader scrolling down.
    const onRouteChange = () => {
      setHidden(false)
      travelled = 0
      requestAnimationFrame(() => (lastY = window.scrollY))
    }

    // Keyboard users tabbing into the hidden bar should be able to see what they are focusing.
    const onFocusIn = (e: FocusEvent) => {
      if ((e.target as Element | null)?.closest?.('.bottom-nav')) setHidden(false)
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
