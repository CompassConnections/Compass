import {ChevronDownIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {MarkdownBody} from 'web/components/widgets/markdown-body'
import {surface, surfaceHover} from 'web/components/widgets/surface'
import {FaqQuestion} from 'web/lib/faq'

/**
 * One question, as a disclosure card.
 *
 * **The answer stays in the DOM when collapsed.** It is hidden by a `grid-template-rows` collapse, not
 * by unmounting — which is what keeps 22 answers' worth of text in the served HTML for crawlers, and
 * what lets a `#hash` deep link scroll to a question that has not been opened yet. Conditionally
 * rendering the body would have quietly traded away the SEO the build-time parse was for.
 *
 * The `0fr → 1fr` grid trick rather than a `max-height` guess: answers here range from two lines to
 * roughly thirty, so any single `max-height` is either a clipped answer or a long dead pause on the
 * short ones. Grid animates to the content's real height with no measurement.
 */
export function FaqItem({
  item,
  open,
  onToggle,
}: {
  item: FaqQuestion
  open: boolean
  onToggle: () => void
}) {
  return (
    <div
      id={item.id}
      className={clsx(
        surface,
        !open && surfaceHover,
        // `scroll-mt` clears the sticky header when a deep link or a nav click scrolls here — without
        // it the question lands underneath the chrome.
        'scroll-mt-28 overflow-hidden',
        open && 'ring-primary-500/30',
      )}
    >
      {/* `m-0` because globals.css gives every heading `margin: 1.5rem 0 0.5rem` — inside a card whose
          padding already sets the spacing, that is 32px of dead height per question, times 22. */}
      <h3 className="m-0 text-lg">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${item.id}-panel`}
          className="flex w-full items-start gap-4 px-5 py-4 text-left sm:px-6 sm:py-5"
        >
          <span
            className={clsx(
              'flex-1 font-semibold leading-snug transition-colors',
              open ? 'text-primary-800' : 'text-ink-900',
            )}
          >
            {item.question}
          </span>
          <span
            aria-hidden
            className={clsx(
              'mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out',
              open ? 'rotate-180 bg-primary-100 text-primary-700' : 'bg-canvas-100 text-ink-500',
            )}
          >
            <ChevronDownIcon className="h-4 w-4" strokeWidth={2.2} />
          </span>
        </button>
      </h3>

      <div
        id={`${item.id}-panel`}
        role="region"
        className={clsx(
          'grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        {/* The clipper. The row collapses to zero height, so this has to hide the overflow or the
            answer stays painted over the card below it. */}
        <div className="overflow-hidden">
          {/* `inert` rather than `hidden` or unmounting: a zero-height `overflow-hidden` box still
              holds focusable links, so without this, tabbing through the page walks into every
              collapsed answer. `inert` takes the subtree out of the tab order and the accessibility
              tree while leaving it in the DOM, which is exactly the split this needs — invisible to
              a keyboard, still present for crawlers. */}
          <div className="px-5 pb-5 sm:px-6 sm:pb-6" inert={!open}>
            <div className="border-t border-canvas-200/70 pt-4">
              <MarkdownBody>{item.answer}</MarkdownBody>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
