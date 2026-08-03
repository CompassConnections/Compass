import {HeartIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {PublicTestimonial} from 'common/testimonials/testimonials'
import Link from 'next/link'
import {ReactNode} from 'react'
import {useLocale, useT} from 'web/lib/locale'

import {Avatar} from '../widgets/avatar'
import {RatingStars} from './rating-stars'

/**
 * A testimonial written on the way out, after saying they found someone here, is the only one that is
 * also an outcome — so it gets the warm treatment and the badge, and everything else stays quiet. If
 * every card were highlighted none of them would be.
 */
const isFoundSomeone = (t: PublicTestimonial) => t.source === 'deletion_survey'

function MonthYear({iso}: {iso: string}) {
  const {locale} = useLocale()
  // Month and year, never a day. A testimonial is not a status update, and an exact date invites the
  // reader to work out how long ago it was instead of reading it.
  return (
    <time dateTime={iso} className="text-ink-400 text-xs">
      {new Date(iso).toLocaleDateString(locale, {month: 'long', year: 'numeric'})}
    </time>
  )
}

export function FoundSomeoneBadge() {
  const t = useT()
  return (
    <span className="bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold">
      <HeartIcon className="h-3 w-3" aria-hidden />
      {t('testimonials.badge.found_someone', 'Found someone on Compass')}
    </span>
  )
}

/**
 * One card on the wall.
 *
 * `break-inside-avoid` is load-bearing: the wall is a CSS-columns masonry, and without it a card is
 * free to split across the column boundary mid-sentence.
 *
 * `children` is where the moderation strip injects its approve/reject row, so a moderator reviews the
 * exact card the public will see rather than a table row that approximates it.
 */
export function TestimonialCard({
  testimonial,
  children,
  className,
}: {
  testimonial: PublicTestimonial
  children?: ReactNode
  className?: string
}) {
  const t = useT()
  const {author, headline, body, rating, createdTime} = testimonial
  const featured = isFoundSomeone(testimonial)

  return (
    <figure
      className={clsx(
        'break-inside-avoid rounded-2xl p-6 transition-shadow duration-200',
        // The quiet card and the warm one differ by ring and tint only — same radius, same padding, same
        // type. A second card shape would read as a different kind of content rather than a highlight.
        featured
          ? 'from-primary-50 ring-primary-300/70 dark:from-primary-900/20 dark:ring-primary-700/50 bg-gradient-to-br to-canvas-50 ring-1'
          : 'bg-canvas-50 ring-canvas-200/70 ring-1',
        'shadow-[0_1px_2px_rgb(44_36_22/0.04),0_12px_32px_-20px_rgb(44_36_22/0.30)]',
        'dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.04)]',
        'hover:shadow-[0_2px_4px_rgb(44_36_22/0.05),0_22px_48px_-24px_rgb(44_36_22/0.45)]',
        className,
      )}
    >
      {featured && (
        <div className="mb-3">
          <FoundSomeoneBadge />
        </div>
      )}

      {rating !== null && <RatingStars rating={rating} className="mb-3" />}

      {headline && (
        <div className="text-ink-900 mb-2 text-base font-semibold leading-snug">{headline}</div>
      )}

      <blockquote className="text-ink-800 relative text-[15px] leading-relaxed">
        {/* Decorative only — the real quotation is the <blockquote>, and a screen reader announcing a
            stray glyph before every card is noise. */}
        <span
          aria-hidden
          className="text-primary-500/15 pointer-events-none absolute -left-1 -top-6 select-none font-serif text-6xl leading-none"
        >
          &ldquo;
        </span>
        <p className="relative whitespace-pre-line">{body}</p>
      </blockquote>

      <figcaption className="border-canvas-200/70 mt-5 flex items-center gap-3 border-t pt-4">
        {author ? (
          <>
            <Avatar
              username={author.username ?? undefined}
              avatarUrl={author.avatarUrl}
              size="sm"
              noLink={!author.username}
            />
            <div className="min-w-0 flex-1">
              <div className="text-ink-900 truncate text-sm font-medium">
                {author.username ? (
                  <Link href={`/${author.username}`} className="hover:text-primary-600">
                    {author.name}
                  </Link>
                ) : (
                  author.name
                )}
              </div>
              <MonthYear iso={createdTime} />
            </div>
          </>
        ) : (
          <>
            <div className="bg-canvas-100 text-ink-400 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold">
              ?
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-ink-500 truncate text-sm font-medium italic">
                {t('testimonials.anonymous', 'A member, anonymously')}
              </div>
              <MonthYear iso={createdTime} />
            </div>
          </>
        )}
      </figcaption>

      {children}
    </figure>
  )
}
