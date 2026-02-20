import {Placement} from '@floating-ui/react'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import {useIsClient} from 'web/hooks/use-is-client'
import {shortenedFromNow} from 'web/lib/util/shortenedFromNow'
import {fromNow} from 'web/lib/util/time'

import {DateTimeTooltip} from './widgets/datetime-tooltip'

export function RelativeTimestamp(props: {
  time: number
  className?: string
  placement?: Placement
  shortened?: boolean
}) {
  const {time, className, placement, shortened} = props
  const isClient = useIsClient()
  return (
    <DateTimeTooltip
      className="text-ink-400 ml-1 whitespace-nowrap"
      time={time}
      placement={placement}
    >
      <span className={className}>
        {isClient ? shortened ? shortenedFromNow(time) : fromNow(time) : <></>}
      </span>
    </DateTimeTooltip>
  )
}

export function RelativeTimestampNoTooltip(props: {
  time: number
  className?: string
  shortened?: boolean
}) {
  const {time, className, shortened} = props
  const isClient = useIsClient()
  return (
    <span className={className}>
      {isClient && (shortened ? shortenedFromNow(time) : fromNow(time))}
    </span>
  )
}

dayjs.extend(relativeTime)
