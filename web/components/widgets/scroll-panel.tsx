import clsx from 'clsx'
import {ChevronDownIcon} from 'lucide-react'
import React, {ReactNode, useCallback, useEffect, useRef, useState} from 'react'
import {useT} from 'web/lib/locale'

/**
 * A scrollable region that announces itself as one.
 *
 * A pinned panel with hidden overflow reads as a dead end — people assume what they see is all there
 * is. So three cues stack up here: a slim scrollbar that is always drawn (never an auto-hiding
 * overlay), a fade at whichever edge has content beyond it, and a chevron that sits over the bottom
 * fade until the visitor reaches the end. All three disappear on their own once the content fits or
 * the end is reached, so nothing is decorating a region that has nothing left to show.
 */
export function ScrollPanel(props: {
  children: ReactNode
  className?: string
  /**
   * Applied to the scrolling element itself — put `overflow-y-auto` and the max-height here, together
   * and behind the same breakpoint. Where the panel is stacked in normal flow rather than pinned
   * beside something, it should not be a scroll container at all: with no height cap there is nothing
   * to scroll, and an `overflow` value alone still clips whatever tries to escape it.
   */
  scrollClassName?: string
  /** Matches the panel's own background so the edge fades blend into it. */
  fadeColorClass?: string
}) {
  const {
    children,
    className,
    scrollClassName,
    fadeColorClass = 'from-canvas-50 to-transparent',
  } = props

  const t = useT()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [{atTop, atBottom, scrollable}, setState] = useState({
    atTop: true,
    atBottom: true,
    scrollable: false,
  })

  const measure = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const overflow = el.scrollHeight - el.clientHeight
    const next = {
      scrollable: overflow > 4,
      atTop: el.scrollTop <= 4,
      // A 4px slack keeps sub-pixel layouts from leaving the cue stuck on at the very bottom.
      atBottom: overflow - el.scrollTop <= 4,
    }
    // Bail when nothing moved: this runs on every scroll event and from a ResizeObserver, and a state
    // object that is new each time would re-render the whole rail on each wheel tick.
    setState((prev) =>
      prev.scrollable === next.scrollable &&
      prev.atTop === next.atTop &&
      prev.atBottom === next.atBottom
        ? prev
        : next,
    )
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    measure()

    el.addEventListener('scroll', measure, {passive: true})
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    for (const child of Array.from(el.children)) observer.observe(child)
    window.addEventListener('resize', measure)

    return () => {
      el.removeEventListener('scroll', measure)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [measure])

  // Most of a panel's height rather than all of it, so the row that was at the bottom is still in
  // view at the top afterwards and the reader keeps their place.
  const scrollDown = () => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({top: el.clientHeight * 0.8, behavior: 'smooth'})
  }

  const showTopFade = scrollable && !atTop
  const showBottomFade = scrollable && !atBottom

  return (
    <div className={clsx('relative', className)}>
      {/* `!overscroll-y-auto` overrides the `overscroll-behavior: contain` that `.scrollbar-visible`
          sets, so the wheel always chains out to the page: while the rail still has somewhere to go it
          scrolls the rail, and a further scroll once it is at its end carries on down the document
          instead of stopping dead under the pointer. Containment was reserving that stop for the case
          where the rail can scroll, but the panel sits beside the prose rather than over it — nothing
          is hidden behind it for the chained scroll to disturb, and being unable to leave the column
          reads as the page being stuck. `!` because both are single-class selectors and the utility
          would otherwise lose on source order. */}
      <div
        ref={scrollRef}
        className={clsx('scrollbar-visible !overscroll-y-auto', scrollClassName)}
      >
        {children}
      </div>

      <div
        aria-hidden
        className={clsx(
          'pointer-events-none absolute inset-x-0 top-0 h-10 rounded-t-[4px] bg-gradient-to-b transition-opacity duration-200',
          fadeColorClass,
          showTopFade ? 'opacity-100' : 'opacity-0',
        )}
      />

      <div
        className={clsx(
          'pointer-events-none absolute inset-x-0 bottom-0 flex h-44 items-end justify-center rounded-b-[4px] bg-gradient-to-t pb-2 transition-opacity duration-200',
          fadeColorClass,
          showBottomFade ? 'opacity-100' : 'opacity-0',
        )}
      >
        {/* The fade stays click-through so the rows under it remain usable; only the chevron takes
            the pointer, and only while it is shown — a faded-out button must not swallow clicks or
            sit in the tab order. */}
        <button
          type="button"
          onClick={scrollDown}
          tabIndex={showBottomFade ? 0 : -1}
          aria-hidden={!showBottomFade}
          aria-label={t('scroll_panel.scroll_down', 'Scroll down')}
          className={clsx(
            'border-canvas-300 bg-canvas-50 text-ink-500 hover:text-primary-700 hover:border-primary-500/60 flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-colors',
            showBottomFade ? 'pointer-events-auto' : 'pointer-events-none',
          )}
        >
          <ChevronDownIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
