import clsx from 'clsx'
import Link from 'next/link'
import {surface} from 'web/components/widgets/surface'
import {useT} from 'web/lib/locale'

/**
 * A real proposal card from /vote, on the about page (A1 in docs/marketing-visuals.md).
 *
 * The page asserts that the community governs the project and links to /vote in plain text. This is
 * the evidence for that assertion: a contested ballot — 11 for, 1 against, so it was a real vote and
 * not a formality — that ended in `Implemented ✔️`. Proposal → vote → shipped, and this particular
 * decision is one a reader can verify by trying to message someone from an unverified account.
 *
 * It is a screenshot of the live page rather than a re-implementation of the card, so it cannot drift
 * into claiming something /vote does not actually show. Regenerate with
 * `npm run capture:vote` from media-creator/ — including after any restyle of
 * `web/components/votes/vote-item.tsx`.
 *
 * Both themes are captured and CSS picks between them: `init-theme.js` sets the `dark` class on
 * <html> in a render-blocking script, so the choice is made before first paint. Resolving it in an
 * effect instead would paint the light image first and visibly swap. Same approach as
 * `components/home/search-demo.tsx`, which has the longer note.
 *
 * The card's own text is English only — it is a screenshot of a real proposal, and translating it
 * would mean fabricating it. The caption around it is translated, so the point still lands in every
 * locale.
 */

/**
 * Both captures from capture-vote.mjs, at DPR 2, cropped to the card element.
 *
 * Two widths because one does not work: the desktop shot is 868 CSS px, and scaling that into a phone
 * column renders the card's 14px description at about 6px. The narrow shot lets the card reflow into
 * its own mobile layout, and is then shown at 1:1. Same reasoning as the mobile capture for H1.
 */
const SHOTS = {
  wide: {width: 1736, height: 560},
  narrow: {width: 716, height: 1168},
}

// Matches Tailwind's `sm` (640px): below it, the card's own layout has already gone narrow.
// const NARROW_MEDIA = '(max-width: 420px)'

// From lg up (see the grid below), the block is two columns and the about main column is only ~760px
// wide, so a landscape shot would be squeezed into ~300px and rendered near-illegible. There the
// reflowed *portrait* capture is the right one: it fills the column's height beside the copy and stays
// at a legible scale. Keep this breakpoint in sync with the grid's `lg:`.
// const WIDE_COLUMN_MEDIA = '(min-width: 1024px)'

/**
 * A <picture> rather than next/image, so the browser picks a width itself and downloads only that
 * one. next/image cannot emit a <picture>, and its optimisation is not missed here: the files are
 * authored at exactly the sizes used and already WebP.
 *
 * The theme still needs two of these — CSS picks between them on the `dark` class, which
 * `init-theme.js` sets before first paint (see components/home/search-demo.tsx for the long note).
 */
function Shot({theme, alt, className}: {theme: 'light' | 'dark'; alt: string; className: string}) {
  return (
    <picture>
      {/* width/height on every <source> too, not just the <img>: the shots have different aspect
          ratios, and without them the box is reserved at the wide ratio and jumps on load. The first
          matching source wins, so the two portrait cases are listed before the wide fallback. */}
      <source
        media={'(min-width: 0px)'}
        srcSet={`/images/vote-tally-${theme}-narrow.webp`}
        width={SHOTS.narrow.width}
        height={SHOTS.narrow.height}
      />
      {/*<source*/}
      {/*  media={NARROW_MEDIA}*/}
      {/*  srcSet={`/images/vote-tally-${theme}-narrow.webp`}*/}
      {/*  width={SHOTS.narrow.width}*/}
      {/*  height={SHOTS.narrow.height}*/}
      {/*/>*/}
      <img
        src={`/images/vote-tally-${theme}-narrow.webp`}
        alt={alt}
        width={SHOTS.wide.width}
        height={SHOTS.wide.height}
        loading="lazy"
        decoding="async"
        className={clsx('w-full h-auto rounded-xl', className)}
      />
    </picture>
  )
}

export function VoteEvidence() {
  const t = useT()

  const alt = t(
    'about.vote.alt',
    'A proposal on the Compass vote page: "Require email verification before interacting with other people". 11 votes for, 0 abstain, 1 against. Status: Implemented.',
  )

  return (
    <figure className={clsx(surface, 'p-6 sm:p-8 lg:p-10')}>
      {/* Two columns from lg up: the claim and its link sit left, the ballot that proves them fills the
          right — the width the capped screenshot used to leave empty. This was the "Democratic" feature
          card, moved down here verbatim; asserting it one screen above its own evidence read as a
          duplicate, so claim and proof are now one thought. The translation keys are unchanged from the
          card, so the existing fr/de strings apply as they are. */}
      <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[1fr_auto] lg:gap-12">
        <div className="min-w-0">
          <p className="font-heading text-ink-900 text-xl sm:text-2xl leading-snug tracking-tight mb-3 max-w-2xl text-balance">
            {t('about.block.democratic.prefix', 'Governed and ')}
            {t('about.block.democratic.link_voted', 'voted')}
            {t(
              'about.block.democratic.middle',
              ' by the community, while ensuring no drift through our ',
            )}
            <Link href="/constitution" className="text-primary-500 hover:underline">
              {t('about.block.democratic.link_constitution', 'constitution')}
            </Link>
            {t('about.block.democratic.suffix', '.')}
          </p>

          <p className="text-sm text-ink-600 leading-relaxed max-w-md">
            {t(
              'about.vote.intro',
              'Members propose changes, everyone votes, and the result is binding. The one highlighted here added a step to signing up.',
            )}
          </p>

          <figcaption className="text-sm text-ink-600 leading-relaxed mt-5">
            {t(
              'about.vote.caption',
              'Every proposal and tally is public — including the ones that lost. ',
            )}
            <Link href="/vote" className="font-medium text-primary-700 hover:underline">
              {t('about.vote.link', 'See all proposals →')}
            </Link>
          </figcaption>
        </div>

        {/* No border here: the captured card brings its own, and adding a second draws a double rule
            along the same edge. Below lg it is the landscape shot, capped and left-aligned so its
            baked-in title stays under this block's heading (the shot is 868 CSS px, and filling the
            card scaled it past 1:1, blowing that title larger than the heading). From lg up the column
            is only ~300px, so <picture> serves the portrait capture instead; a fixed width holds it at
            a legible scale and a soft shadow lifts it off the surface. */}
        <div className="max-w-xl mx-auto overflow-hidden rounded-xl w-[300px] lg:w-[264px] lg:max-w-none lg:shadow-[0_24px_60px_-28px_rgb(44_36_22/0.5)]">
          <Shot theme="light" alt={alt} className="dark:hidden" />
          <Shot theme="dark" alt={alt} className="hidden dark:block" />
        </div>
      </div>
    </figure>
  )
}
