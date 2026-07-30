import {useEffect} from 'react'

/**
 * Pins the calling page to the *visual* viewport (the part of the screen not covered by the on-screen
 * keyboard) and stops the document itself from scrolling, for as long as the component is mounted.
 *
 * Why: on a chat page the composer sits at the bottom of the page. When the keyboard opens, the visual
 * viewport shrinks but the document keeps its old height, so the browser/WebView scrolls the document up
 * to keep the focused input visible — dragging the conversation header (the name of the person you're
 * messaging) off the top of the screen. `100dvh` doesn't help: it tracks the *layout* viewport, which the
 * keyboard doesn't change.
 *
 * The fix is to publish the live visual-viewport height as `--vvh` and let the page size itself off that,
 * with the document locked at scroll 0 so nothing can push the header away. The page then only scrolls
 * where we want it to: inside the message list.
 */
export const useVisualViewportHeight = () => {
  useEffect(() => {
    const root = document.documentElement
    const vv = window.visualViewport

    const update = () => {
      root.style.setProperty('--vvh', `${vv?.height ?? window.innerHeight}px`)
      // Undo any auto-scroll the browser did to reveal the focused input: with the page sized to the
      // visual viewport there is nothing to scroll to, and a leftover offset hides the header.
      if (document.scrollingElement) document.scrollingElement.scrollTop = 0
      window.scrollTo(0, 0)
    }

    update()
    vv?.addEventListener('resize', update)
    vv?.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)

    const bodyStyle = {
      overflow: document.body.style.overflow,
      ob: document.body.style.overscrollBehavior,
    }
    const rootStyle = {overflow: root.style.overflow, ob: root.style.overscrollBehavior}
    // Nothing outside the message list scrolls: overflow hidden on both the document element and the
    // body (a drag started on the composer chains to whichever of the two is scrollable), and
    // overscroll-behavior none so neither rubber-bands the whole page.
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    root.style.overflow = 'hidden'
    root.style.overscrollBehavior = 'none'

    return () => {
      vv?.removeEventListener('resize', update)
      vv?.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
      document.body.style.overflow = bodyStyle.overflow
      document.body.style.overscrollBehavior = bodyStyle.ob
      root.style.overflow = rootStyle.overflow
      root.style.overscrollBehavior = rootStyle.ob
      root.style.removeProperty('--vvh')
    }
  }, [])
}
