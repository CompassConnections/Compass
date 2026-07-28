import clsx from 'clsx'
import {APIError} from 'common/api/utils'
import {
  AUTO_BAN_REVIEW_HOURS,
  AUTO_BAN_UNDER_REVIEW_CODE,
  BanReason,
  isPermanentBan,
  MAX_NEW_CHANNELS_PER_DAY,
} from 'common/moderation/ban'
import {ShieldCheck, ShieldX} from 'lucide-react'
import Link from 'next/link'
import {Col} from 'web/components/layout/col'
import {Row} from 'web/components/layout/row'
import {useT} from 'web/lib/locale'

/**
 * True when an API error is the automatic "too many new conversations in 24h" ban, which the backend
 * tags with AUTO_BAN_UNDER_REVIEW_CODE. Anything else (deliberate admin ban, unrelated 403) is not.
 */
export function isAutoBanUnderReviewError(e: unknown) {
  const details = (e as APIError)?.details
  const list = Array.isArray(details) ? details : details ? [details] : []
  return list.some((d) => d?.context === AUTO_BAN_UNDER_REVIEW_CODE)
}

/**
 * What a banned member is told, keyed on `users.ban_reason`.
 *
 * Two very different situations share this component:
 *
 * - A provisional hold (`auto_rate_limit`, `under_review`, or an unknown/legacy null). Nobody has
 *   judged them yet, so we explain what happened, promise a human review with a timeframe, and
 *   reassure them that nothing is lost — most people who trip the automatic limit are genuine.
 * - A confirmed scam / spam / harassment ban (`confirmed_abuse`). That decision is final, so the
 *   copy is short and flat: no duration, no promise of a review that isn't coming, and no hint at
 *   what gave them away — naming the signal just teaches the next account to avoid it. The one line
 *   pointing at /contact is deliberate: it's the appeal route the DSA expects us to offer, without
 *   implying the outcome is in doubt.
 */
export function AccountOnHoldNotice(props: {
  reason?: BanReason | null
  className?: string
  compact?: boolean
}) {
  const {reason, className, compact} = props
  const t = useT()
  const permanent = isPermanentBan(reason)

  const title = permanent
    ? t('account_banned.title', 'This account has been closed')
    : reason === 'auto_rate_limit'
      ? t('account_on_hold.title_rate_limit', 'Your account is on hold while we take a look')
      : t('account_on_hold.title', 'Your account is on hold')

  const why = permanent
    ? t('account_banned.why', 'This account has been permanently closed for violating our terms.')
    : reason === 'auto_rate_limit'
      ? t(
          'account_on_hold.why_rate_limit',
          "You started more than {limit} new conversations in the last 24 hours. We pause accounts that go over that limit automatically — it's how we keep spam, scams and harassment off Compass before anyone gets hurt.",
          {limit: MAX_NEW_CHANNELS_PER_DAY},
        )
      : t(
          'account_on_hold.why',
          'We pause accounts automatically when activity looks like spam, scams or harassment, so we can check before anyone gets hurt.',
        )

  const reassurance = t(
    'account_on_hold.reassurance',
    'This is not a judgement on you. A real person reviews every paused account within {hours} hours, and if everything looks genuine — as it usually does — we lift the hold and you can carry on where you left off. Your profile, conversations and messages are all kept.',
    {hours: AUTO_BAN_REVIEW_HOURS},
  )

  const Icon = permanent ? ShieldX : ShieldCheck

  return (
    <Col
      className={clsx(
        'gap-3 rounded-2xl border border-canvas-200 bg-canvas-50 p-4 text-left',
        className,
      )}
    >
      <Row className="items-center gap-2">
        <Icon
          className={clsx('h-5 w-5 shrink-0', permanent ? 'text-ink-400' : 'text-primary-600')}
          aria-hidden="true"
        />
        <span className="font-semibold text-ink-900">{title}</span>
      </Row>
      <p className="text-sm text-ink-700">{why}</p>
      {!permanent && !compact && <p className="text-sm text-ink-700">{reassurance}</p>}
      {permanent ? (
        <p className="custom-link text-sm text-ink-500">
          {t('account_banned.contact_prefix', 'If you believe this is a mistake, ')}
          <Link href="/contact">{t('account_banned.contact_link', 'contact us')}</Link>
          {t('account_banned.contact_suffix', '.')}
        </p>
      ) : (
        <p className="custom-link text-sm text-ink-500">
          {t('account_on_hold.contact_prefix', 'Think this is a mistake or want to speed it up? ')}
          <Link href="/contact">{t('account_on_hold.contact_link', 'Tell us about it')}</Link>
          {t('account_on_hold.contact_suffix', ' and we’ll get back to you.')}
        </p>
      )}
    </Col>
  )
}
