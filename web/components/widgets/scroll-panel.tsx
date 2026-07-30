import clsx from 'clsx'
import {ChevronDownIcon} from 'lucide-react'
import React, {ReactNode, useCallback, useEffect, useRef, useState} from 'react'

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

  const showTopFade = scrollable && !atTop
  const showBottomFade = scrollable && !atBottom

  return (
    <div className={clsx('relative', className)}>
      {/* `!overscroll-y-auto`: `.scrollbar-visible` sets `overscroll-behavior: contain`, which is right
          while the panel has somewhere to go — the page shouldn't lurch once the rail hits its end — but
          wrong when the content fits. There, containment swallows the wheel entirely and the pointer sits
          over a dead zone; releasing it lets the gesture chain to the page, so a short rail scrolls the
          document just like the prose column beside it. `!` because both are single-class selectors and
          the utility would otherwise lose on source order. */}
      <div
        ref={scrollRef}
        className={clsx('scrollbar-visible', !scrollable && '!overscroll-y-auto', scrollClassName)}
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
        aria-hidden
        className={clsx(
          'pointer-events-none absolute inset-x-0 bottom-0 flex h-16 items-end justify-center rounded-b-[4px] bg-gradient-to-t pb-2 transition-opacity duration-200',
          fadeColorClass,
          showBottomFade ? 'opacity-100' : 'opacity-0',
        )}
      >
        <span className="border-canvas-300 bg-canvas-50 text-ink-500 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm">
          <ChevronDownIcon className="h-3.5 w-3.5" />
        </span>
      </div>
    </div>
  )
}
