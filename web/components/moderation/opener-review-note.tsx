import clsx from 'clsx'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'
import {useT} from 'web/lib/locale'

/**
 * Shown under a first message the model review sent back. The refusal itself says what to fix; this
 * says what the check is: new, in testing, there to keep conversations deep, and fallible. A member
 * who thinks it got it wrong is the signal we need to tune it, so the note asks them to tell us
 * rather than just rewrite and move on — and points at `/values` so "unfair" has something concrete
 * to be measured against.
 *
 * Whole sentences per key, links as their own labels: splitting one sentence around a link leaves
 * translators fragments whose word order they cannot change.
 */
export function OpenerReviewNote({className}: {className?: string}) {
  const t = useT()
  const link = 'font-semibold text-primary-700 transition-colors hover:text-primary-800'
  return (
    <Col className={clsx('gap-1.5 text-xs leading-relaxed text-ink-600', className)}>
      <p>
        {t(
          'messages.review_note.text',
          'First-message checks are a new feature we are testing to keep connections on Compass deep. Like anything new, they are not perfect yet: you can edit your message and try again.',
        )}
      </p>
      <p>
        {t(
          'messages.review_note.unfair',
          'If this decision seems unfair or out of line with our values, please tell us.',
        )}
      </p>
      <p className="flex flex-wrap gap-x-4 gap-y-1">
        <Link href="/values" className={link}>
          {t('messages.review_note.values', 'Our values')}
        </Link>
        <Link href="/contact" className={link}>
          {t('messages.review_note.contact', 'Contact us')}
        </Link>
      </p>
    </Col>
  )
}
