import {HeartIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {formatDonationAmount} from 'common/donations'
import {useLocale, useT} from 'web/lib/locale'

import {Tooltip} from './tooltip'

/**
 * The supporter badge: what a member gave to Compass over the past year, as a chip beside their
 * name. Drawn only when there is an amount to draw — the caller checks, so a zero is never shown as
 * "$0" (see `get-donor-badge`, which also answers zero for a member who opted out).
 *
 * Styled as a quieter cousin of `AdminBadge`: a tinted chip rather than a filled one, because this is
 * a thank-you the member chose to wear, not a mark of office, and it should sit beside a name
 * without competing with it.
 */
export function DonorBadge(props: {
  amountCents: number
  className?: string
  /** Heart and amount only, for a card's name row where "Supporter" would not fit. */
  compact?: boolean
}) {
  const {amountCents, className, compact} = props
  const t = useT()
  const {locale} = useLocale()
  const amount = formatDonationAmount(amountCents, locale)

  return (
    <Tooltip
      text={t(
        'badge.donor.tooltip',
        'Donated {amount} over the past year to keep Compass free and independent.',
        {amount},
      )}
      placement="bottom"
      // On the Tooltip rather than the chip, for the same reason as `AdminBadge`: Tooltip renders
      // its own wrapper span, which is what ends up being the flex item.
      className="inline-flex shrink-0 align-middle"
    >
      <span
        className={clsx(
          'bg-primary-100 text-primary-900 ring-primary-300 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-wide ring-1',
          className,
        )}
        data-testid="donor-badge"
      >
        <HeartIcon className="text-primary-700 h-3 w-3" aria-hidden="true" />
        {compact ? (
          <span className="tabular-nums">{amount}</span>
        ) : (
          <>
            {t('badge.donor', 'Supporter')}
            <span className="font-normal normal-case tabular-nums tracking-normal">· {amount}</span>
          </>
        )}
      </span>
    </Tooltip>
  )
}
