import {clamp} from 'lodash'
import {RefObject, useEffect} from 'react'

/**
 * Pins a tall sidebar the way X pins its right rail: it scrolls with the page until one of its edges
 * reaches the matching edge of the viewport, then holds there. Scroll down and it travels until its
 * bottom is in view; scroll back up and it travels the other way straight away, until its top is in
 * view. A rail shorter than the viewport simply sits pinned at `top`.
 *
 * There is one scroll on the page, so nothing hides inside a second scroll area under the pointer, and
 * every part of the rail is reachable by scrolling the page alone.
 *
 * Works by moving the sticky element's `top` between `top` (top edge pinned) and
 * `viewport - height - bottom` (bottom edge pinned) by however far the page scrolled. Its position is
 * `max(natural, top)`, so moving `top` with the scroll makes it travel with the content, and the clamp
 * makes it stop. The element needs `position: sticky` and a containing block taller than itself.
 * `top` is written straight to the element's style, so scrolling never re-renders anything.
 *
 * Nothing sticky may sit over the top of the same scroll area: the rail's top edge pins at `top` from
 * the viewport's top, under anything pinned there. (The profile's top bar stops being sticky in the
 * two-column layout for this reason.)
 */
export function useStickyRail(
  ref: RefObject<HTMLElement | null>,
  {enabled = true, top = 0, bottom = 0}: {enabled?: boolean; top?: number; bottom?: number} = {},
) {
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    // Sticky positioning is relative to the nearest scroll container — the window on the profile
    // page, the panel itself beside a chat — so the scroll is read from the same place.
    const scroller = getScrollParent(el)
    const scrollTop = () => (scroller ? scroller.scrollTop : window.scrollY)
    const viewportHeight = () => (scroller ? scroller.clientHeight : window.innerHeight)

    let lastScrollTop = scrollTop()
    let current = top

    const apply = (delta: number) => {
      const minTop = Math.min(top, viewportHeight() - el.offsetHeight - bottom)
      const next = clamp(current - delta, minTop, top)
      if (next === current && el.style.top) return
      current = next
      el.style.top = `${next}px`
    }

    const onScroll = () => {
      const now = scrollTop()
      apply(now - lastScrollTop)
      lastScrollTop = now
    }
    // A resize (window, or the rail's own content arriving or splitting into two columns) moves the
    // limits, so re-clamp in place.
    const onResize = () => apply(0)

    apply(0)
    const target: HTMLElement | Window = scroller ?? window
    target.addEventListener('scroll', onScroll, {passive: true})
    window.addEventListener('resize', onResize)
    const observer = new ResizeObserver(onResize)
    observer.observe(el)

    return () => {
      target.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      observer.disconnect()
      el.style.top = ''
    }
  }, [ref, enabled, top, bottom])
}

// The overflow values that make a box a scroll container (`clip` does not; neither does `visible`).
const SCROLL_CONTAINER_OVERFLOW = ['auto', 'scroll', 'hidden', 'overlay']

/** The nearest ancestor that clips its overflow, or undefined when that is the document itself. */
function getScrollParent(el: HTMLElement): HTMLElement | undefined {
  for (let node = el.parentElement; node; node = node.parentElement) {
    if (node === document.body || node === document.documentElement) return undefined
    const {overflowY} = getComputedStyle(node)
    if (SCROLL_CONTAINER_OVERFLOW.includes(overflowY)) return node
  }
  return undefined
}
