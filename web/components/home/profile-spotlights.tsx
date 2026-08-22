import {ChevronLeftIcon, ChevronRightIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {formatSpotlightLocation, PublicSpotlight} from 'common/profiles/spotlights'
import {capitalizeWords} from 'common/util/string'
import Image from 'next/image'
import Link from 'next/link'
import {useCallback, useEffect, useState} from 'react'
import {Reveal} from 'web/components/widgets/reveal'
import {eyebrow} from 'web/components/widgets/surface'
import {useAPIGetter} from 'web/hooks/use-api-getter'
import {useT} from 'web/lib/locale'

/**
 * "In their own words" — real members, under the distributions in `WhosHere`.
 *
 * The section above says 70% hold a degree and 62% are men. Both are true and neither is a person.
 * This is the same claim delivered the other way round, and it is the only place on either marketing
 * page where a visitor meets somebody.
 *
 * Three rules shape the card, and all three come from Compass positioning itself against swipe apps:
 *
 *  1. **The words lead, the face follows.** The quote is set at display size in the heading face; the
 *     photo is a 56px circle in the footer, the size an author's byline gets. A card with the photo on
 *     top and a caption underneath is a dating-app tile, which is the exact object /about promises
 *     this is not ("values and interests first, photos are secondary").
 *  2. **Every card is checkable.** The whole card is a link to the live profile. A spotlight you can
 *     click through and verify is proof; one you cannot is a stock photo with a caption.
 *  3. **Nothing here is generated.** The quote is the member's own prose, chosen by a human, frozen at
 *     capture time (see `common/profiles/spotlights.ts`). The card cannot render a person who has
 *     withdrawn consent — that is enforced server-side on every read, not here.
 *
 * Renders nothing at all when the call comes back empty — the same rule as `StatBand` and
 * `TestimonialsTeaser`. A "meet some members" heading over an empty rail is worse than no section, and
 * on this page it would be worse still: the block above it has just finished promising specifics.
 */

/** Gap between cards, in px. Duplicated from the `gap-*` classes because paging has to measure it. */
const GAP = {base: 16, sm: 20}

/**
 * Scroll state for the rail: which ends are reached, how far along we are, and how to page.
 *
 * Kept local rather than reusing `useCarousel` from `widgets/carousel`: that one throttles to 500ms
 * (fine for arrows, far too coarse for a progress bar that has to track a finger) and pages by raw
 * pixel width, which leaves a card sliced in half at every stop.
 */
function useRail() {
  // A callback ref, not `useRef`: the rail only mounts once the API call comes back, so an effect
  // keyed on a plain ref would run against `null` and never fire again. Storing the node in state
  // re-runs the measure the moment it appears.
  const [el, ref] = useState<HTMLDivElement | null>(null)
  const [state, setState] = useState({atStart: true, atEnd: true, offset: 0, thumb: 1})

  const measure = useCallback(() => {
    if (!el) return
    const {scrollLeft, clientWidth, scrollWidth} = el
    const max = Math.max(1, scrollWidth - clientWidth)
    const thumb = Math.min(1, clientWidth / scrollWidth)
    setState({
      // 8px of slack: sub-pixel scroll positions otherwise leave an arrow lit at a hard stop.
      atStart: scrollLeft <= 8,
      atEnd: scrollLeft >= max - 8,
      offset: Math.min(1, Math.max(0, scrollLeft / max)) * (1 - thumb),
      thumb,
    })
  }, [el])

  useEffect(() => {
    if (!el) return
    measure()
    // Fires on rail resize *and* on card resize (the quote reflows at every breakpoint), which a
    // window listener alone would miss.
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    return () => observer.disconnect()
  }, [el, measure])

  /** Pages by whole cards, so a stop never lands mid-quote. */
  const page = useCallback(
    (direction: 1 | -1) => {
      if (!el) return
      const card = el.firstElementChild as HTMLElement | null
      const step = card ? card.offsetWidth + (window.innerWidth >= 640 ? GAP.sm : GAP.base) : 320
      const cards = Math.max(1, Math.floor(el.clientWidth / step))
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollBy({left: direction * cards * step, behavior: reduced ? 'auto' : 'smooth'})
    },
    [el],
  )

  return {ref, page, onScroll: measure, ...state}
}

function RailArrow({
  direction,
  disabled,
  onClick,
  label,
}: {
  direction: 1 | -1
  disabled: boolean
  onClick: () => void
  label: string
}) {
  const Icon = direction === -1 ? ChevronLeftIcon : ChevronRightIcon
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={clsx(
        'border-canvas-300 text-ink-700 flex h-10 w-10 items-center justify-center rounded-full border',
        'transition-[opacity,color,border-color,background-color] duration-200',
        'focus-visible:ring-primary-500 focus:outline-none focus-visible:ring-2',
        disabled
          ? 'cursor-default opacity-30'
          : 'hover:border-primary-500/60 hover:text-primary-700 hover:bg-primary-50/60',
      )}
    >
      <Icon className="h-5 w-5" strokeWidth={2} />
    </button>
  )
}

/**
 * The scroll rail. A grid would reflow badly at 1, 2 or 5 cards; a rail reads the same at any count.
 *
 * What a bare `overflow-x-auto` gets wrong, and what is added here: the rail hides its scrollbar, so
 * without help a desktop visitor with a wheel mouse has no way to know — or to make — the row move,
 * and the last card is sliced flat by the viewport edge as if the layout broke. So the cut edge is
 * softened into a fade, the header carries paging arrows, and touch gets a progress bar under the
 * row. Each is redundant with the others on purpose: the fade says "more", the arrows say "here is
 * how", the bar says "how much".
 */
function SpotlightRail({
  spotlights,
  rail,
}: {
  spotlights: PublicSpotlight[]
  rail: ReturnType<typeof useRail>
}) {
  const t = useT()
  const {ref, onScroll, atStart, atEnd, offset, thumb} = rail
  const scrollable = thumb < 1

  // Faded only on the side that has something behind it, so at either end the row still sits square
  // against the column. A mask rather than an overlay gradient: the section sits on two different
  // backgrounds between light and dark mode, and an overlay would have to guess at both.
  const fade = [
    atStart ? 'black 0' : 'transparent 0, black 40px',
    atEnd ? 'black 100%' : 'black calc(100% - 72px), transparent 100%',
  ].join(', ')

  return (
    <div className="mt-8">
      <div
        ref={ref}
        onScroll={onScroll}
        // Focusable so the rail can be driven with the arrow keys, which is also what makes it
        // reachable at all for a keyboard user when every card is the same distance away.
        tabIndex={0}
        role="group"
        aria-roledescription={t('home.spotlights.carousel', 'Carousel')}
        aria-label={t('home.spotlights.label', 'In their own words')}
        className={clsx(
          'flex gap-4 overflow-x-auto sm:gap-5',
          // Vertical breathing room inside the scroll box: `overflow-x: auto` clips the y axis too,
          // and without this the hover lift and the card's drop shadow are shaved off.
          '-my-3 py-3',
          // Snap so a flick lands on a card rather than between two. Mandatory on touch, where the
          // gesture is a throw; proximity on desktop, where mandatory fights a trackpad that is
          // trying to nudge.
          'snap-x snap-mandatory sm:snap-proximity',
          // The negative margin plus matching padding lets cards bleed to the container edge while
          // keeping the first one aligned with the prose above it.
          'scroll-px-4 -mx-4 px-4 sm:-mx-6 sm:px-6',
          // The rail is the one horizontally-scrolling element on the page, so it hides its own bar
          // rather than drawing a second scrollbar under the section.
          '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          'focus-visible:ring-primary-500/50 rounded-3xl focus:outline-none focus-visible:ring-2',
        )}
        style={
          scrollable
            ? {
                maskImage: `linear-gradient(to right, ${fade})`,
                WebkitMaskImage: `linear-gradient(to right, ${fade})`,
              }
            : undefined
        }
      >
        {spotlights.map((s, i) => (
          <Reveal key={s.id} delay={i * 70} className="snap-start">
            <SpotlightCard spotlight={s} />
          </Reveal>
        ))}
      </div>

      {/* Touch gets a proportional bar instead of dots: the count is variable and five dots under a
          five-card rail is just a second, worse scrollbar. Desktop has the arrows in the header. */}
      {scrollable && (
        <div aria-hidden className="bg-canvas-200 mt-5 h-[3px] rounded-full sm:hidden">
          <div
            className="bg-primary-500/70 h-full rounded-full"
            style={{
              width: `${thumb * 100}%`,
              transform: `translateX(${(offset / Math.max(thumb, 0.0001)) * 100}%)`,
            }}
          />
        </div>
      )}
    </div>
  )
}

function SpotlightCard({spotlight: s}: {spotlight: PublicSpotlight}) {
  const t = useT()
  const location = formatSpotlightLocation(s)
  // "Ana, 34 · Lisbon, Portugal" — each part dropped rather than blanked when it is missing, so an
  // incomplete profile never renders a dangling comma or a stray middot.
  const nameLine = [s.name, s.age].filter(Boolean).join(', ')
  // Four is what fits on two lines at every card width. A fifth wraps to a third row on one card and
  // not on its neighbour, which reads as a layout bug rather than as a longer list.
  const tags = s.tags.slice(0, 4)

  const card = (
    <article
      className={clsx(
        'group relative flex h-full w-[280px] flex-col overflow-hidden rounded-3xl p-6 sm:w-[340px] sm:p-7 lg:w-[360px]',
        'bg-canvas-50 ring-1 ring-canvas-200/60',
        'shadow-[0_1px_2px_rgb(44_36_22/0.04),0_12px_32px_-20px_rgb(44_36_22/0.30)]',
        'dark:ring-canvas-200 dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]',
        'transition-[transform,box-shadow,--tw-ring-color] duration-200 ease-out',
        'hover:-translate-y-1 hover:ring-primary-500/40',
        'hover:shadow-[0_2px_4px_rgb(44_36_22/0.05),0_24px_52px_-24px_rgb(44_36_22/0.45)]',
      )}
    >
      {/* A warm wash that only arrives on hover. The card is calm at rest — a rail of five permanently
          tinted cards would out-shout the `StageBlock` further down, which is the page's one gradient. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-[radial-gradient(ellipse_50%_60%_at_50%_100%,rgba(193,127,62,0.14),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      {s.quoteContext && (
        <p className={clsx(eyebrow, 'text-primary-700 relative mb-3')}>{s.quoteContext}</p>
      )}

      {/* The quote, and the reason the card exists. `font-heading` at 17–19px is the largest thing on
          the card by a wide margin; everything below it is metadata. */}
      <blockquote className="relative min-w-0">
        <p className="font-heading text-ink-900 text-[17px] leading-[1.45] tracking-tight sm:text-[19px] text-pretty">
          <span aria-hidden className="text-primary-500/70">
            “
          </span>
          {s.quote}
          <span aria-hidden className="text-primary-500/70">
            ”
          </span>
        </p>
      </blockquote>

      {/* `mt-auto` on the tags rather than `flex-1` on the quote: cards are stretched to a common
          height by the rail, and this drops the slack from a short quote into one gap above the tags
          instead of leaving the byline floating. Tags and byline then line up across the row. */}
      {tags.length > 0 && (
        <div className="relative mt-auto flex flex-wrap gap-1.5 pt-5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="border-canvas-300 bg-canvas-0 text-ink-600 rounded-full border px-2.5 py-1 text-[12px]"
            >
              {capitalizeWords(tag)}
            </span>
          ))}
        </div>
      )}

      {/* The byline. Below a hairline so it reads as attribution rather than as the card's subject. */}
      <div
        className={clsx(
          'border-canvas-200 relative flex items-center gap-3 border-t pt-5',
          // Only the tags carry `mt-auto`; when there are none the byline has to take it instead.
          tags.length > 0 ? 'mt-6' : 'mt-auto',
        )}
      >
        {s.photoUrl ? (
          <div className="ring-canvas-200 relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full ring-1">
            <Image src={s.photoUrl} alt="" fill sizes="56px" className="object-cover" />
          </div>
        ) : (
          // No initials placeholder: a fabricated avatar next to a real quote is the exact thing the
          // gradient-initials row on this page was disabled for.
          <div className="bg-primary-100 ring-primary-200 h-14 w-14 flex-shrink-0 rounded-full ring-1" />
        )}
        <div className="min-w-0">
          <div className="text-ink-900 truncate font-semibold">{nameLine}</div>
          {location && <div className="text-ink-500 truncate text-sm">{location}</div>}
          {s.username && (
            // Shown outright on touch, where there is no hover to reveal it and the card would
            // otherwise look like a static quote rather than a door into a profile.
            <div className="text-primary-700 mt-1 text-xs font-semibold transition-opacity duration-200 sm:opacity-0 sm:group-hover:opacity-100">
              {t('home.spotlights.read', 'Read their profile →')}
            </div>
          )}
        </div>
      </div>
    </article>
  )

  // Wrapped only when the account still exists. A snapshot outlives a deleted profile; its link must
  // not, or the card points at a 404 or at whoever holds that handle now.
  if (!s.username) return card

  return (
    <Link
      href={`/${s.username}`}
      className="focus-visible:ring-primary-500 block h-full rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      aria-label={t('home.spotlights.aria', 'Read {name}’s profile', {name: s.name})}
    >
      {card}
    </Link>
  )
}

export function ProfileSpotlights() {
  const t = useT()
  const {data} = useAPIGetter('get-spotlights', {})
  const rail = useRail()

  const spotlights = data?.spotlights ?? []
  if (!spotlights.length) return null

  return (
    <div className="mt-4 sm:mt-5">
      {/* No "browse everyone" link here: browsing lives at `/` behind a login, and `WhosHere`
          immediately above already sends the curious reader to /stats. A second outbound link in the
          same block would compete with it and land a logged-out visitor on a sign-in wall. */}
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          <p className={clsx(eyebrow, 'text-primary-700 mb-3')}>
            {t('home.spotlights.label', 'In their own words')}
          </p>
          <h3 className="font-heading text-ink-900 mt-0 text-[clamp(20px,2.4vw,28px)] leading-[1.2] tracking-tight text-balance">
            {t('home.spotlights.title', 'Some of the people you’d be joining.')}
          </h3>

          {/* Says where the words came from without a paragraph of process. It matters: a reader who
              assumes we wrote these has been given a testimonial wall, which is a different and much
              less credible object. */}
          <p className="text-ink-500 mt-3 max-w-2xl text-sm">
            {t(
              'home.spotlights.note',
              'Passages from their own profiles, published with their permission.',
            )}
          </p>
        </div>

        {/* Desktop only, and in the header rather than floating over the first and last card: an
            arrow parked on top of a quote covers the one thing the section is here to show, and the
            heading row is otherwise half a screen of empty column. */}
        {rail.thumb < 1 && (
          <div className="hidden flex-shrink-0 gap-2 sm:flex">
            <RailArrow
              direction={-1}
              disabled={rail.atStart}
              onClick={() => rail.page(-1)}
              label={t('home.spotlights.prev', 'Previous members')}
            />
            <RailArrow
              direction={1}
              disabled={rail.atEnd}
              onClick={() => rail.page(1)}
              label={t('home.spotlights.next', 'More members')}
            />
          </div>
        )}
      </div>

      <SpotlightRail spotlights={spotlights} rail={rail} />
    </div>
  )
}
