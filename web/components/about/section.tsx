import clsx from 'clsx'
import {ReactNode} from 'react'
import {eyebrow} from 'web/components/widgets/surface'

/**
 * Section chrome for the about page, extracted so that blocks which may render nothing can own their
 * own heading.
 *
 * That is the whole reason this is not still inline in `pages/about.tsx`: several blocks on that page
 * are live-queried and return null when the data is missing (`MemberGrowth`, `StatBand`,
 * `RepoActivity`). A heading and a divider left behind by an absent block is worse
 * than no section at all, so the label has to be inside the thing that decides whether to render.
 *
 * The surface/rhythm tokens this used to own now live in `widgets/surface.tsx`, because `/home` uses
 * them too. What is left here is the chrome specific to the about page's left-aligned, rule-trailing
 * section headings.
 */

export function SectionLabel({children}: {children: ReactNode}) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className={clsx(eyebrow, 'text-ink-700 shrink-0')}>{children}</span>
      <div className="flex-1 h-px bg-gradient-to-r from-canvas-200 to-transparent" />
    </div>
  )
}

export function Divider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-canvas-200 to-transparent my-10" />
  )
}
