import clsx from 'clsx'
import {APIError} from 'common/api/utils'
import {
  FIRST_MESSAGE_REJECTED_CODE,
  MIN_ANSWERS_TO_MESSAGE,
  MIN_BIO_CHARS_TO_MESSAGE,
  OPENER_REVIEW_REJECTED_CODE,
  PROFILE_INCOMPLETE_CODE,
  ProfileGateIssues,
} from 'common/moderation/first-message'
import {PencilLine} from 'lucide-react'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

const detailsOf = (e: unknown) => {
  const details = (e as APIError)?.details
  return Array.isArray(details) ? details : details ? [details] : []
}

/**
 * The missing pieces when the API refused to start a conversation because the sender's own profile
 * is not written yet (tagged `PROFILE_INCOMPLETE_CODE` by
 * `backend/api/src/create-private-user-message-channel.ts`), or null for any other error.
 */
export function profileIncompleteIssues(e: unknown): ProfileGateIssues | null {
  const d = detailsOf(e).find((d) => d?.context === PROFILE_INCOMPLETE_CODE) as
    | (Partial<ProfileGateIssues> & {context: string})
    | undefined
  if (!d) return null
  return {bio: !!d.bio, answers: !!d.answers}
}

/**
 * True when the API refused a first message for what it said (too short, or nothing in it about the
 * recipient) — a reason worth showing verbatim rather than as "something went wrong".
 */
export function isFirstMessageRejectedError(e: unknown) {
  return detailsOf(e).some((d) => d?.context === FIRST_MESSAGE_REJECTED_CODE)
}

/**
 * True when the refusal came from the model review of a first message rather than a fixed rule
 * (tagged `OPENER_REVIEW_REJECTED_CODE` in `backend/api/src/helpers/first-message.ts`). Those can be wrong, so the
 * composer says so — see `OpenerReviewNote`.
 */
export function isOpenerReviewRejection(e: unknown) {
  return detailsOf(e).some((d) => d?.context === OPENER_REVIEW_REJECTED_CODE)
}

/**
 * What a member sees when they try to write to someone before writing their own profile. Each
 * missing piece links to where it gets fixed, because the point is to send them there, not to
 * scold them.
 */
export function ProfileIncompleteNotice(props: {
  issues: ProfileGateIssues
  className?: string
  compact?: boolean
}) {
  const {issues, className, compact} = props
  const t = useT()

  const steps = [
    issues.bio && {
      href: '/profile',
      label: t(
        'profile_incomplete.bio',
        'A bio of at least {chars} characters, in your own words',
        {
          chars: MIN_BIO_CHARS_TO_MESSAGE,
        },
      ),
      cta: t('profile_incomplete.bio_cta', 'Write your bio'),
    },
    issues.answers && {
      href: '/compatibility',
      label: t(
        'profile_incomplete.answers',
        'Answers to at least {count} compatibility questions',
        {
          count: MIN_ANSWERS_TO_MESSAGE,
        },
      ),
      cta: t('profile_incomplete.answers_cta', 'Answer questions'),
    },
  ].filter((s): s is {href: string; label: string; cta: string} => !!s)

  return (
    <Col
      className={clsx(
        'gap-3 rounded-2xl border border-canvas-200 bg-canvas-50 p-4 text-left',
        className,
      )}
    >
      <Row className="items-center gap-2">
        <PencilLine className="h-5 w-5 shrink-0 text-primary-700" aria-hidden="true" />
        <span className="font-semibold text-ink-900">
          {t('profile_incomplete.title', 'Finish your profile before writing to anyone')}
        </span>
      </Row>
      {!compact && (
        <p className="text-sm text-ink-700">
          {t(
            'profile_incomplete.body',
            'Compass only works when both profiles have been written. Before your first message, the other person needs something to go on:',
          )}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {steps.map((step) => (
          <li
            key={step.href}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-sm"
          >
            <span className="text-ink-700">{step.label}</span>
            <Link
              href={step.href}
              className="font-semibold text-primary-700 transition-colors hover:text-primary-800"
            >
              {step.cta}
            </Link>
          </li>
        ))}
      </ul>
    </Col>
  )
}
