'use client'

import {
  ChatBubbleLeftRightIcon,
  LifebuoyIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {discordLink} from 'common/constants'
import Link from 'next/link'
import {useEffect, useMemo, useRef, useState} from 'react'
import {MarkdownBody} from 'web/components/widgets/markdown-body'
import {eyebrow, surface} from 'web/components/widgets/surface'
import {FaqDoc, FaqQuestion, normalizeForSearch, toPlainText} from 'web/lib/faq'
import {useT} from 'web/lib/locale'

import {FaqItem} from './faq-item'
/**
 * The FAQ page body.
 *
 * Three things carry it, in order of how much they matter for a 22-question page:
 *
 * 1. **Search.** Collapsing the answers is what makes the page scannable, but it also breaks the
 *    browser's own find-in-page — so the search box is not a nicety here, it is the replacement for
 *    the thing collapsing took away. It matches question *and* answer text, and expands its hits.
 * 2. **Categories.** Twenty-two flat questions is a wall; five labelled groups with a sticky rail is
 *    a table of contents. The groups come from `##` headings in the markdown, so translators get them
 *    as ordinary text.
 * 3. **Deep links.** Every question has a slug id and the URL updates as you open one, so a support
 *    answer can be linked to directly instead of described.
 */
export function FaqContent({doc}: {doc: FaqDoc}) {
  const t = useT()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState<Set<string>>(() => new Set())
  const [activeCategory, setActiveCategory] = useState<string | undefined>(doc.categories[0]?.id)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({})

  // Built once per document rather than per keystroke: `toPlainText` runs over every answer, which is
  // wasted work to repeat on each of the ~20 renders a typed query produces.
  //
  // Question and answer only — deliberately *not* the category title. Folding the title in meant every
  // question in "Money & governance" answered a search for "governance", so a query for one topic word
  // returned four unrelated questions alongside the real hit. Navigating by topic is the rail's job.
  const index = useMemo(
    () =>
      doc.categories.flatMap((c) =>
        c.questions.map((q) => ({
          id: q.id,
          haystack: normalizeForSearch(`${q.question} ${toPlainText(q.answer)}`),
        })),
      ),
    [doc],
  )

  const matches = useMemo(() => {
    const terms = normalizeForSearch(query).split(/\s+/).filter(Boolean)
    if (!terms.length) return undefined
    // Every term must appear somewhere in the entry, in any order — "data safe" and "safe data" find
    // the same question. Substring rather than word-boundary matching, so "encrypt" finds
    // "encryption".
    return new Set(
      index.filter((e) => terms.every((term) => e.haystack.includes(term))).map((e) => e.id),
    )
  }, [index, query])

  const visibleCategories = useMemo(
    () =>
      doc.categories
        .map((c) => ({...c, questions: c.questions.filter((q) => !matches || matches.has(q.id))}))
        .filter((c) => c.questions.length > 0),
    [doc, matches],
  )

  const resultCount = visibleCategories.reduce((n, c) => n + c.questions.length, 0)

  const toggle = (q: FaqQuestion) => {
    setOpen((prev) => {
      const next = new Set(prev)
      if (next.has(q.id)) next.delete(q.id)
      else next.add(q.id)
      return next
    })
    // `replaceState` rather than a router push: opening a question should be linkable, but it is not
    // a navigation, and pushing would make Back walk through every card the reader expanded.
    if (typeof window !== 'undefined' && !open.has(q.id)) {
      window.history.replaceState(null, '', `#${q.id}`)
    }
  }

  // A search that returns three questions and leaves them all shut has answered nothing — the reader
  // then has to click each one. Any hit set small enough to read at once is opened outright.
  useEffect(() => {
    if (!matches || matches.size === 0 || matches.size > 6) return
    setOpen((prev) => new Set([...prev, ...matches]))
  }, [matches])

  // Deep links, on mount *and* on `hashchange`.
  //
  // The mount case is the shared link opened cold. The `hashchange` case is the same link followed by
  // someone already on /faq — a same-document navigation, so the component never remounts and the
  // browser scrolls to a question that is still collapsed. Back/forward between two question anchors
  // has the same shape. The rail's own `#cat-` links land here too and are ignored, since no question
  // carries that id.
  useEffect(() => {
    const openFromHash = () => {
      const id = decodeURIComponent(window.location.hash.replace('#', ''))
      if (!id) return
      setOpen((prev) => new Set([...prev, id]))
      // Deferred a frame: the panel has to be expanded before its position is worth measuring, or the
      // scroll lands short by the height of the answer.
      requestAnimationFrame(() =>
        document.getElementById(id)?.scrollIntoView({block: 'start', behavior: 'smooth'}),
      )
    }
    openFromHash()
    window.addEventListener('hashchange', openFromHash)
    return () => window.removeEventListener('hashchange', openFromHash)
  }, [])

  // Scroll-spy for the rail: the active category is the last one whose heading has crossed a line
  // near the top of the viewport.
  //
  // Not an IntersectionObserver, which is the reflex here and is wrong for it. An observer only fires
  // on a *crossing*, so once a section taller than the trigger band has scrolled past, nothing
  // intersects the band and the highlight sticks on whatever last entered it — which on this page
  // means the rail says "The basics" while you are reading "Vision & roadmap". Answers expand and
  // collapse under the reader too, moving every section below them, and a position check re-derives
  // the answer from scratch on the next scroll frame where an observer would need re-observing.
  useEffect(() => {
    const update = () => {
      const line = 140
      let active: string | undefined
      for (const [id, el] of Object.entries(sectionRefs.current)) {
        if (el && el.getBoundingClientRect().top <= line) active = id
      }
      setActiveCategory(active ?? visibleCategories[0]?.id)
    }
    update()
    window.addEventListener('scroll', update, {passive: true})
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [visibleCategories])

  return (
    <div className="max-w-6xl mx-auto px-5 sm:px-8 pt-12 pb-24">
      {/* ── Header ── */}
      <div className="mb-10">
        <p className={clsx(eyebrow, 'text-primary-700 mb-4')}>{t('faq.eyebrow', 'Help center')}</p>
        <h1 className="text-[clamp(34px,5vw,56px)] text-ink-900 tracking-tight leading-[1.08] mb-5 max-w-3xl text-balance">
          {t('faq.title', 'Frequently asked questions')}
        </h1>
        {doc.intro && (
          <MarkdownBody className="max-w-2xl !text-lg text-ink-700">{doc.intro}</MarkdownBody>
        )}
      </div>

      {/* ── Search ── */}
      <div className="relative max-w-xl">
        <MagnifyingGlassIcon
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-400"
          strokeWidth={2}
          aria-hidden
        />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('faq.search.placeholder', 'Search the FAQ…')}
          aria-label={t('faq.search.label', 'Search the FAQ')}
          className={clsx(
            'w-full rounded-2xl bg-canvas-50 py-3.5 pl-12 pr-11 text-base text-ink-900 placeholder:text-ink-400',
            // `appearance-none border-0` before the ring: `type="search"` keeps a UA `1px solid grey`
            // border that Tailwind's preflight does not zero out, so the field drew two edges — a cool
            // grey one inside our warm `canvas-200` ring. The ring is the only edge we want.
            'appearance-none border-0 ring-1 ring-canvas-200 transition-shadow',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/50',
            // The native clear affordance is Chrome-only and sits where our own button goes.
            '[&::-webkit-search-cancel-button]:appearance-none',
          )}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label={t('faq.search.clear', 'Clear search')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-ink-500 transition-colors hover:bg-canvas-100 hover:text-ink-800"
          >
            <XMarkIcon className="h-4 w-4" strokeWidth={2.2} />
          </button>
        )}
      </div>
      {/* Announced, not just shown: filtering happens with focus still in the input, so a screen
          reader user gets no signal that the page below them changed. */}
      <p aria-live="polite" className="mt-3 min-h-5 text-sm text-ink-500">
        {query &&
          (resultCount === 0
            ? t('faq.search.none', 'No questions match — try another word.')
            : // A separate key for one hit rather than one string with `{count}`. `t()` has no
              // pluralisation, so the single template renders "1 passende Fragen" in German and
              // "1 questions correspondantes" in French — wrong in both, and a search for a specific
              // term lands on exactly one hit often enough to be the common case.
              resultCount === 1
              ? t('faq.search.count_one', '1 matching question')
              : t('faq.search.count', '{count} matching questions', {count: resultCount}))}
      </p>

      {/* ── Body ── */}
      <div className="mt-8 grid gap-10 lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-14">
        {/* The rail. Hidden below `lg` — at tablet width it either steals the column the answers need
            or wraps into a chip row that duplicates the section headings two lines below it. */}
        <nav aria-label={t('faq.nav.label', 'FAQ categories')} className="hidden lg:block">
          <div className="sticky top-24">
            <p className={clsx(eyebrow, 'text-ink-500 mb-4')}>{t('faq.nav.title', 'Topics')}</p>
            {/* `list-none pl-0 mt-0` — globals.css puts a disc and a 1.25rem indent on every `ul`. */}
            <ul className="mt-0 list-none space-y-1 pl-0">
              {doc.categories.map((c) => {
                const active = c.id === activeCategory
                const empty = !visibleCategories.some((v) => v.id === c.id)
                return (
                  <li key={c.id}>
                    <a
                      href={`#cat-${c.id}`}
                      className={clsx(
                        'block border-l-2 py-1.5 pl-3 text-sm transition-colors',
                        active
                          ? 'border-primary-500 font-semibold text-primary-800'
                          : 'border-canvas-200 text-ink-600 hover:border-ink-400 hover:text-ink-900',
                        // Dimmed rather than removed while searching: a rail whose items disappear as
                        // you type reads as breakage, and the layout jumping is worse than a grey row.
                        empty && 'opacity-40',
                      )}
                    >
                      {c.title}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        <div className="min-w-0">
          {visibleCategories.map((category, i) => (
            <section
              key={category.id}
              id={`cat-${category.id}`}
              ref={(el) => {
                sectionRefs.current[category.id] = el
              }}
              className={clsx('scroll-mt-24', i > 0 && 'mt-12')}
            >
              {category.title && (
                <div className="mb-5 flex items-center gap-3">
                  {/* A real `h2` so the categories are in the document outline, but styled as the
                      same eyebrow /about uses — hence `m-0 font-figtree`, which undoes the global
                      heading margins and the serif face that would otherwise land on an 11px cap. */}
                  <h2 className={clsx(eyebrow, 'm-0 shrink-0 font-figtree text-ink-700')}>
                    {category.title}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-canvas-200 to-transparent" />
                </div>
              )}
              <div className="space-y-3">
                {category.questions.map((q) => (
                  <FaqItem key={q.id} item={q} open={open.has(q.id)} onToggle={() => toggle(q)} />
                ))}
              </div>
            </section>
          ))}

          {resultCount === 0 && (
            <div className={clsx(surface, 'px-6 py-12 text-center')}>
              <MagnifyingGlassIcon
                className="mx-auto mb-4 h-8 w-8 text-ink-300"
                strokeWidth={1.5}
                aria-hidden
              />
              <p className="font-semibold text-ink-900">
                {t('faq.empty.title', 'Nothing here matches that.')}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600">
                {t(
                  'faq.empty.text',
                  'Try a broader word — or ask us directly, we answer every message.',
                )}
              </p>
              <Link
                href="/contact"
                className="mt-5 inline-flex items-center gap-2 rounded-xl border border-cta bg-cta px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cta-hover"
              >
                {t('faq.empty.cta', 'Ask a question →')}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Outside the grid, not inside the answer column: the answer column is ~520px once the rail
          and the app sidebar are subtracted, which is narrow enough that a two-column closing block
          placed in it wraps its own headline to three words a line. The finale spans the page, the
          way the closing strip on /about does. */}
      <StillStuck />
    </div>
  )
}

/**
 * The closing block.
 *
 * An FAQ that ends on its last answer leaves the reader whose question was not on the list with
 * nowhere to go, and that reader is the one most worth catching. Dark, like the closing strip on
 * `/about`, so the page ends on something rather than trailing off.
 */
function StillStuck() {
  const t = useT()

  return (
    <div className="relative mt-14 overflow-hidden rounded-3xl bg-canvas-950 px-7 py-10 sm:px-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-24 h-[360px] w-[360px] rounded-full bg-primary-500/20 blur-3xl"
      />
      <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="max-w-lg">
          <div className="mb-4 flex items-center gap-2.5">
            <LifebuoyIcon className="h-5 w-5 flex-shrink-0 text-primary-500" strokeWidth={1.8} />
            <span className={clsx(eyebrow, 'text-primary-500')}>
              {t('faq.stuck.label', 'Still stuck')}
            </span>
          </div>
          <h2 className="font-heading mt-0 mb-3 text-[clamp(22px,2.4vw,30px)] font-bold leading-tight tracking-tight text-white text-balance">
            {t('faq.stuck.title', "Didn't find your answer?")}
          </h2>
          <p className="text-base leading-relaxed text-white/70">
            {t(
              'faq.stuck.text',
              'Compass is built by the people who use it — ask anything, and the answer usually ends up on this page for the next person.',
            )}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap gap-3">
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border border-cta bg-cta px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(193,127,62,0.6)] transition-colors hover:bg-cta-hover"
          >
            {t('faq.stuck.contact', 'Contact us')}
          </Link>
          <a
            href={discordLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            <ChatBubbleLeftRightIcon className="h-[1.05rem] w-[1.05rem]" strokeWidth={2} />
            {t('faq.stuck.discord', 'Ask on Discord')}
          </a>
        </div>
      </div>
    </div>
  )
}
