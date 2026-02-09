import {BadgeCheckIcon} from '@heroicons/react/solid'
import clsx from 'clsx'

import {CompatibilityScore} from 'common/profiles/compatibility-score'
import {formatPercent} from 'common/util/format'
import {Row} from 'web/components/layout/row'
import {Tooltip} from "web/components/widgets/tooltip";
import {useT} from "web/lib/locale"

export const CompatibleBadge = (props: {
  compatibility: CompatibilityScore
  className?: string
}) => {
  const {compatibility, className} = props
  const t = useT()
  return (
    <Tooltip
      text={t('compatibility.tooltip', 'Compatibility score between you two')}>
      <Row
        className={clsx('items-center gap-1 text-sm font-semibold', className)}
      >
        <BadgeCheckIcon className="h-4 w-4"/>
        {formatPercent(compatibility.score ?? 0)}{' '}
      </Row>
    </Tooltip>
  )
}
