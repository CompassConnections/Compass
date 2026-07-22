import clsx from 'clsx'
import {ReactNode, useEffect, useRef, useState} from 'react'
import {useSafeLayoutEffect} from 'web/hooks/use-safe-layout-effect'

/**
 * Fades and lifts its children into place the first time they scroll into view.
 *
 * **Why not `useIsVisible`.** That hook exists and is the first thing to reach for, but its threshold
 * semantics are wrong for a reveal: it fires at 90% visibility for anything shorter than the viewport,
 * so a card would finish scrolling into place before it started animating. A reveal wants the opposite —
 * fire as soon as the top edge crosses in. Hence a local observer with `rootMargin` instead of a second
 * general-purpose visibility hook.
 *
 * **Degrades to visible, never to blank.** The hidden state is applied by `armed`, which is set in a
 * layout effect — so the server-rendered HTML and any no-JS client render the content plainly visible,
 * and the arm happens before first paint on the client, so there is no flash of the un-hidden state.
 * Getting this backwards (hiding by default, revealing in JS) is how a reveal turns into an invisible
 * page when the observer never runs.
 *
 * Reduced-motion visitors never arm it at all, so they get the content with no transition rather than a
 * transition we merely shortened.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  /** Stagger, in ms, for siblings revealed as a group. Keep under ~150ms — beyond that it reads as lag. */
  delay?: number
}) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [armed, setArmed] = useState(false)
  const [shown, setShown] = useState(false)

  useSafeLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setArmed(true)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!armed || !el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        setShown(true)
        observer.disconnect()
      },
      // Negative bottom margin so the reveal starts a little after the element enters, rather than
      // the instant its first pixel does — that reads as intentional instead of twitchy.
      {rootMargin: '0px 0px -10% 0px', threshold: 0.01},
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [armed])

  const hidden = armed && !shown

  return (
    <div
      ref={ref}
      style={delay && armed ? {transitionDelay: `${delay}ms`} : undefined}
      className={clsx(
        'transition-[opacity,transform] duration-500 ease-out',
        hidden ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
