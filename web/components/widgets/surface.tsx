import clsx from 'clsx'
import {ReactNode} from 'react'

/**
 * The shared surface vocabulary for the marketing pages (`/about`, `/home`).
 *
 * It lives in `widgets/` rather than beside either page because both use it, and a landing page
 * importing its card treatment from `components/about/` would be the kind of dependency that quietly
 * becomes load-bearing.
 */

/**
 * The one card treatment.
 *
 * Every block used to be `border-[1.5px] border-canvas-200` and nothing else, which is why these pages
 * read as a flat sheet: a hairline is the only depth cue, so a run of identical rectangles all sit at
 * exactly the same elevation and nothing can be more important than anything else. The border is now a
 * `ring` at lower opacity — so it defines the edge without drawing it — and the elevation comes from a
 * two-layer shadow: a tight 1px contact shadow plus a wide, heavily-offset ambient one.
 *
 * Dark mode gets an inset top highlight instead. Drop shadows do essentially nothing on a near-black
 * surface, whereas a 1px light edge along the top reads as a lit surface and costs nothing.
 */
export const surface = clsx(
  'rounded-2xl bg-canvas-50 ring-1 ring-canvas-200/60',
  'shadow-[0_1px_2px_rgb(44_36_22/0.04),0_12px_32px_-20px_rgb(44_36_22/0.30)]',
  'dark:ring-canvas-200 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]',
)

/**
 * Hover for cards that are themselves links or contain one.
 *
 * The old hover lit the entire perimeter `primary-500`, which on an otherwise calm surface reads as an
 * alert rather than an affordance. Depth does the same job quietly: lift 2px, deepen the ambient shadow,
 * and let only a hint of warmth into the ring. Also `ease-out`, not `ease-in` — `ease-in` starts slow,
 * which on a 200ms hover feels like the page is lagging behind the cursor.
 */
export const surfaceHover = clsx(
  'transition-[transform,box-shadow,--tw-ring-color] duration-200 ease-out',
  'hover:-translate-y-0.5 hover:ring-primary-500/40',
  'hover:shadow-[0_2px_4px_rgb(44_36_22/0.05),0_22px_48px_-24px_rgb(44_36_22/0.45)]',
  'dark:hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]',
)

/** The one spec for the small uppercase labels. There used to be several, at 11/11/12px and
 *  1.1/1.2/1.5px tracking, which is close enough to look like a mistake rather than a distinction.
 *  Pair it with `text-ink-700` or `text-primary-700` — at 11px the lighter ramp steps fail AA. */
export const eyebrow = 'text-[11px] font-bold uppercase tracking-[1.2px]'

/**
 * Vertical rhythm between sections.
 *
 * These pages used to run `gap-4` inside blocks against `my-10`/`mb-14` between sections — a 2.5x
 * ratio, which is not enough separation for the eye to group anything, so the whole page read as one
 * undifferentiated run of cards. At `py-14`/`py-20` against a 16-20px inner gap the ratio is 5-6x and
 * the sections separate on their own, which is also why the gradient dividers are no longer needed
 * between them.
 */
export function Section({children, className}: {children: ReactNode; className?: string}) {
  return <section className={clsx('py-14 sm:py-20 first:pt-0', className)}>{children}</section>
}
