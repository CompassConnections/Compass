import clsx from 'clsx'
import {formatSpotlightLocation, PublicSpotlight} from 'common/profiles/spotlights'
import {capitalizeWords} from 'common/util/string'
import Image from 'next/image'
import Link from 'next/link'
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

/** The scroll rail. A grid would reflow badly at 1, 2 or 5 cards; a rail reads the same at any count. */
function SpotlightRail({spotlights}: {spotlights: PublicSpotlight[]}) {
  return (
    <div
      className={clsx(
        'mt-8 flex gap-4 overflow-x-auto pb-2 sm:gap-5',
        // Snap so a flick lands on a card rather than between two. The negative margin plus matching
        // padding lets cards bleed to the container edge while keeping the first one aligned with the
        // prose above it.
        'snap-x snap-mandatory scroll-px-4 -mx-4 px-4 sm:-mx-6 sm:px-6',
        // The rail is the one horizontally-scrolling element on the page, so it hides its own bar
        // rather than drawing a second scrollbar under the section.
        '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      )}
    >
      {spotlights.map((s, i) => (
        <Reveal key={s.id} delay={i * 70} className="snap-start">
          <SpotlightCard spotlight={s} />
        </Reveal>
      ))}
    </div>
  )
}

function SpotlightCard({spotlight: s}: {spotlight: PublicSpotlight}) {
  const t = useT()
  const location = formatSpotlightLocation(s)
  // "Ana, 34 · Lisbon, Portugal" — each part dropped rather than blanked when it is missing, so an
  // incomplete profile never renders a dangling comma or a stray middot.
  const nameLine = [s.name, s.age].filter(Boolean).join(', ')

  const card = (
    <article
      className={clsx(
        'group relative flex h-full w-[280px] flex-col overflow-hidden rounded-3xl p-6 sm:w-[340px] sm:p-7',
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
      <blockquote className="relative min-w-0 flex-1">
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

      {s.tags.length > 0 && (
        <div className="relative mt-5 flex flex-wrap gap-1.5">
          {s.tags.map((tag) => (
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
      <div className="border-canvas-200 relative mt-6 flex items-center gap-3 border-t pt-5">
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
            <div className="text-primary-700 mt-1 text-xs font-semibold opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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

  const spotlights = data?.spotlights ?? []
  if (!spotlights.length) return null

  return (
    <div className="mt-4 sm:mt-5">
      {/* No "browse everyone" link here: browsing lives at `/` behind a login, and `WhosHere`
          immediately above already sends the curious reader to /stats. A second outbound link in the
          same block would compete with it and land a logged-out visitor on a sign-in wall. */}
      <div className="min-w-0">
        <p className={clsx(eyebrow, 'text-primary-700 mb-3')}>
          {t('home.spotlights.label', 'In their own words')}
        </p>
        <h3 className="font-heading text-ink-900 mt-0 text-[clamp(20px,2.4vw,28px)] leading-[1.2] tracking-tight text-balance">
          {t('home.spotlights.title', 'Some of the people you’d be joining.')}
        </h3>
      </div>

      {/* Says where the words came from without a paragraph of process. It matters: a reader who
          assumes we wrote these has been given a testimonial wall, which is a different and much less
          credible object. */}
      <p className="text-ink-500 mt-3 max-w-2xl text-sm">
        {t(
          'home.spotlights.note',
          'Passages from their own profiles, published with their permission.',
        )}
      </p>

      <SpotlightRail spotlights={spotlights} />
    </div>
  )
}
