import clsx from 'clsx'
import {MouseEvent} from 'react'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useT} from 'web/lib/locale'

import {Footnote, footnoteDefId, footnoteRefId} from './footnotes'

const MARKER_CLASS =
  'text-primary-700 hover:text-primary-600 cursor-pointer align-super text-[0.75em] font-medium no-underline hover:underline scroll-mt-24'

/** Bring `id` into view and flash it, without the hard jump a raw hash navigation would cause. */
const scrollTo = (id: string) => (e: MouseEvent) => {
  e.preventDefault()
  const el = typeof document === 'undefined' ? null : document.getElementById(id)
  if (!el) return
  el.scrollIntoView({behavior: 'smooth', block: 'center'})
  // Keep the hash shareable, but replaceState so the smooth scroll isn't overridden.
  history.replaceState(null, '', `#${id}`)
  el.classList.add('bg-primary-100', 'transition-colors', 'duration-500', 'rounded')
  setTimeout(() => el.classList.remove('bg-primary-100'), 1800)
}

/** An in-text footnote marker: hovering previews the footnote, clicking scrolls down to it. */
export function FootnoteRef(props: {footnote: Footnote; text: string; anchor: boolean}) {
  const {footnote, text, anchor} = props
  const t = useT()

  return (
    <Tooltip
      text={
        <span className="block max-h-64 overflow-y-auto whitespace-pre-line text-left">
          {footnote.text}
        </span>
      }
      hasSafePolygon
      noTap
      className="inline"
    >
      <a
        id={anchor ? footnoteRefId(footnote.label) : undefined}
        href={`#${footnoteDefId(footnote.label)}`}
        onClick={scrollTo(footnoteDefId(footnote.label))}
        className={MARKER_CLASS}
        aria-label={t('bio.footnote.go_to', 'Footnote {label}', {label: footnote.label})}
      >
        {text}
      </a>
    </Tooltip>
  )
}

/** The marker at the head of a footnote definition — scrolls back up to where it was referenced. */
export function FootnoteBackLink(props: {label: string; text: string}) {
  const {label, text} = props
  const t = useT()

  return (
    <a
      href={`#${footnoteRefId(label)}`}
      onClick={scrollTo(footnoteRefId(label))}
      className={clsx(MARKER_CLASS, 'mr-1')}
      aria-label={t('bio.footnote.back_to', 'Back to footnote {label} in the text', {label})}
    >
      {text}
    </a>
  )
}
