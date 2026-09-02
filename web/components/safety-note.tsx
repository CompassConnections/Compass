import {ShieldCheckIcon, XMarkIcon} from '@heroicons/react/24/outline'
import clsx from 'clsx'
import {defaultLocale} from 'common/constants'
import Link from 'next/link'
import {usePersistentLocalState} from 'web/hooks/use-persistent-local-state'
import {useLocale, useT} from 'web/lib/locale'
import {track} from 'web/lib/service/analytics'

/**
 * The in-product pointers to `/safety`.
 *
 * The guide itself can only help someone who reads it, and nobody navigates to a safety page on a calm
 * Tuesday — they read it in the two moments that matter: opening a conversation with a stranger, and
 * deciding that something is wrong with one. So the links live at those moments, and everywhere else
 * `/safety` is reached the ordinary way (the help hub, the FAQ, onboarding).
 *
 * Both variants deep-link into a *section* rather than the top of the page. Landing on the recovery
 * steps when you have just reported someone for asking you for money is the difference between a link
 * that gets clicked and one that gets closed.
 */

type SafetySection = 'short-version' | 'gone-wrong'

/**
 * Section anchors are slugified from the *translated* heading text (see `web/lib/markdown-doc`), so an
 * anchor that is right in English lands nowhere in French. Only the two sections the product links
 * into need this, and an unlisted locale falls back to the top of the page — a weaker link, never a
 * broken one. Renaming one of these `##` headings in the `safety.md` files means updating it here.
 */
const ANCHORS: Record<SafetySection, Record<string, string>> = {
  'short-version': {
    en: 'the-short-version',
    fr: 'l-essentiel-en-bref',
    de: 'das-wichtigste-in-kurze',
  },
  'gone-wrong': {
    en: 'if-something-has-gone-wrong',
    fr: 'si-quelque-chose-a-mal-tourne',
    de: 'wenn-etwas-schiefgegangen-ist',
  },
}

function useSafetyHref(section?: SafetySection) {
  const {locale} = useLocale()
  if (!section) return '/safety'
  const anchor = ANCHORS[section][locale] ?? ANCHORS[section][defaultLocale]
  return anchor ? `/safety#${anchor}` : '/safety'
}

/** Inline "read the safety guide" link, for empty states and modals. */
export function SafetyLink({
  section,
  children,
  className,
  source,
}: {
  section?: SafetySection
  children?: React.ReactNode
  className?: string
  /** Where the click came from, so we can tell which nudge is doing the work. */
  source: string
}) {
  const t = useT()
  const href = useSafetyHref(section)
  return (
    <Link
      href={href}
      onClick={() => track('click safety link', {source})}
      className={clsx(
        'text-primary-600 hover:text-primary-800 hover:underline underline-offset-4',
        className,
      )}
    >
      {children ?? t('safety.link', 'Read the safety guide')}
    </Link>
  )
}

/**
 * Dismissible strip shown above the composer at the start of a conversation.
 *
 * Dismissal is stored once for the whole account rather than per channel: the point is to teach the
 * three patterns once, and a banner that reappeared on every new conversation forever would be trained
 * away long before anyone needed it. `-v1` in the key so the copy can be reissued later if the patterns
 * change enough to be worth showing again.
 */
export function ConversationSafetyTip({className}: {className?: string}) {
  const t = useT()
  const [dismissed, setDismissed] = usePersistentLocalState(false, 'safety-tip-dismissed-v1')

  if (dismissed) return null

  return (
    <div
      className={clsx(
        'relative rounded-xl border border-primary-200/60 bg-primary-50/60 px-3.5 py-3 pr-9',
        'dark:border-primary-800/30 dark:bg-primary-950/20',
        className,
      )}
    >
      <button
        onClick={() => {
          setDismissed(true)
          track('dismiss safety tip')
        }}
        aria-label={t('common.dismiss', 'Dismiss')}
        className="absolute right-1.5 top-1.5 rounded-full p-1.5 text-ink-400 transition-colors hover:bg-canvas-100 hover:text-ink-700"
      >
        <XMarkIcon className="h-4 w-4" />
      </button>
      <div className="flex items-start gap-2.5">
        <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
        <p className="text-xs leading-relaxed text-ink-700">
          {t(
            'safety.tip.new_conversation',
            'New conversation? Keep it on Compass until you trust them, get on a video call before you meet, and never send money — however good the reason sounds.',
          )}{' '}
          <SafetyLink section="short-version" source="conversation banner" />
        </p>
      </div>
    </div>
  )
}
