import clsx from 'clsx'
import {ReactNode} from 'react'

/**
 * A section of the main reading column. No border and no card — the column is prose, and whitespace
 * plus a small-caps label separates sections better than five stacked boxes do.
 *
 * Lives here rather than in `profile-info` so the sections it composes — Connect and the interest
 * signal among them — can build themselves out of the same heading without importing their parent.
 */
export function Section(props: {
  title?: ReactNode
  id?: string
  children: ReactNode
  testId?: string
}) {
  const {title, id, children, testId} = props
  if (children == null) return null
  return (
    <section id={id} className="min-w-0 scroll-mt-24" data-testid={testId}>
      {title != null && <SectionHeading>{title}</SectionHeading>}
      {children}
    </section>
  )
}

export function SectionHeading(props: {children: ReactNode; className?: string}) {
  const {children, className} = props
  return (
    <h2
      className={clsx('text-ink-400 font-dm-sans mb-5 font-normal uppercase', className)}
      style={{fontSize: '10px', letterSpacing: '0.18em'}}
    >
      {children}
    </h2>
  )
}
