'use client'

import clsx from 'clsx'
import {useEffect, useRef, useState} from 'react'
import {MarkdownBody} from 'web/components/widgets/markdown-body'
import {eyebrow} from 'web/components/widgets/surface'
import {MarkdownDoc} from 'web/lib/markdown-doc'

/**
 * The renderer for a long-form markdown document: `/privacy` today, `/terms` and `/constitution`
 * whenever they follow.
 *
 * Deliberately *not* the FAQ's accordion. A policy is read in two ways — top to bottom by someone
 * who wants the whole thing, and by jumping straight to one clause by someone who wants that clause
 * — and collapsing the sections would break both: the first reader has to click twelve times, and
 * the second loses find-in-page, which for a legal document is the primary navigation tool. So the
 * body stays open and the rail does the jumping.
 *
 * What it does share with `/faq` is the important half: the text is a markdown file under
 * `public/md/`, parsed at build time, rendered through the product's own type tokens rather than
 * `prose`. That is what makes it editable without touching JSX or a translation JSON.
 */
export function DocPage({
  doc,
  label,
  meta,
}: {
  doc: MarkdownDoc
  /** Small caps line above the title — "Legal", "Governance". */
  label: string
  /** Optional line under the title, e.g. the effective date. */
  meta?: string
}) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})
  const [active, setActive] = useState<string | undefined>(doc.sections[0]?.id)

  // Scroll-spy for the rail, position-based rather than an IntersectionObserver — same reasoning as
  // the FAQ's: an observer only fires on a crossing, so a section taller than the trigger band leaves
  // the highlight stuck on whichever heading last entered it, which on a policy page means the rail
  // says "What we collect" for the whole of "Cookies and local storage".
  useEffect(() => {
    const update = () => {
      const line = 140
      let current: string | undefined
      for (const [id, el] of Object.entries(sectionRefs.current)) {
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current ?? doc.sections[0]?.id)
    }
    update()
    window.addEventListener('scroll', update, {passive: true})
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [doc])

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-24">
      {/* ── Header ── */}
      <div className="mb-10">
        <p className={clsx(eyebrow, 'text-primary-700 mb-4')}>{label}</p>
        <h1 className="text-[clamp(34px,5vw,56px)] text-ink-900 tracking-tight leading-[1.08] mb-4 max-w-3xl text-balance">
          {doc.title}
        </h1>
        {meta && <p className="mb-5 text-sm text-ink-500">{meta}</p>}
        {doc.lede && (
          <MarkdownBody className="max-w-2xl !text-lg text-ink-700">{doc.lede}</MarkdownBody>
        )}
      </div>

      {/* ── Body ── */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-14">
        {/* Hidden below `lg`: at tablet width the rail either steals the column the prose needs or
            wraps into a chip row that duplicates the headings two lines below it. */}
        <nav aria-label={doc.title} className="hidden lg:block">
          <div className="sticky top-24">
            <p className={clsx(eyebrow, 'text-ink-500 mb-4')}>{doc.title}</p>
            {/* `list-none pl-0 mt-0` — globals.css puts a disc and a 1.25rem indent on every `ul`. */}
            <ul className="mt-0 list-none space-y-1 pl-0">
              {doc.sections.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className={clsx(
                      'block border-l-2 py-1.5 pl-3 text-sm leading-snug transition-colors',
                      s.id === active
                        ? 'border-primary-500 font-semibold text-primary-800'
                        : 'border-canvas-200 text-ink-600 hover:border-ink-400 hover:text-ink-900',
                    )}
                  >
                    {s.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="min-w-0 max-w-2xl">
          {doc.sections.map((s, i) => (
            <section
              key={s.id}
              id={s.id}
              ref={(el) => {
                sectionRefs.current[s.id] = el
              }}
              // `scroll-mt` clears the sticky header when a rail click or a deep link lands here.
              className={clsx('scroll-mt-24', i > 0 && 'mt-11')}
            >
              <div className="mb-4 flex items-center gap-3">
                {/* A real `h2` so the sections are in the document outline, styled as the eyebrow the
                    rest of the site uses — hence `m-0 font-figtree`, which undoes the global heading
                    margins and the serif face that would otherwise land on an 11px cap.

                    `text-ink-900`, not `ink-700`: the eyebrow is a *label* treatment, and at 11px
                    uppercase with 1.2px of tracking its smallness already carries the "quiet". Dimming
                    it as well put the heading 1.25x above body text — invisible as a difference — and
                    1.65x *below* the `strong` inside its own paragraphs, so an emphasised phrase
                    outranked the section it sat in. Small tracked caps need more contrast than body,
                    not less. */}
                <h2 className={clsx(eyebrow, 'm-0 shrink-0 font-figtree text-ink-900')}>
                  {s.title}
                </h2>
                <div className="h-px flex-1 bg-gradient-to-r from-canvas-200 to-transparent" />
              </div>
              <MarkdownBody>{s.body}</MarkdownBody>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
