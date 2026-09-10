import {ChartBarIcon} from '@heroicons/react/24/solid'
import clsx from 'clsx'
import {Row} from 'web/components/layout/row'
import {Tooltip} from 'web/components/widgets/tooltip'
import {useT} from 'web/lib/locale'

/**
 * How load-bearing the members who answered a prompt think it is, as an icon and a percentage.
 *
 * It used to be spelled out — "Community Importance: 35%" — which on a phone wrapped onto two lines
 * and, at the top of the dialog, was the widest thing above the question it belongs to. The number
 * is the part worth reading; what it measures goes in the tooltip, next to the answer count that
 * already works this way. The bar-chart glyph is the same shape as the importance meter below, which
 * is what the score aggregates.
 */
// `className` styles the stat itself, not its position in a parent flex row: the returned element is
// the Tooltip wrapper, so a margin utility passed here lands on a nested child and does nothing.
export function CommunityImportance(props: {percent: number; className?: string}) {
  const {percent, className} = props
  const t = useT()

  if (!isFinite(percent)) return null

  return (
    <Tooltip
      text={t(
        'compatibility.question.community_importance_tooltip',
        'How important the members who answered this rate it, on average',
      )}
    >
      <Row className={clsx('select-none items-center gap-1 text-sm guidance', className)}>
        <ChartBarIcon className="h-4 w-4" />
        {Math.round(percent)}%
      </Row>
    </Tooltip>
  )
}
