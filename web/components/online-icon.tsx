import clsx from 'clsx'
import dayjs from 'dayjs'
import {memo} from 'react'
import {Tooltip} from 'web/components/widgets/tooltip'
import {fromNow} from 'web/lib/util/time'

export const OnlineIcon = memo(function OnlineIcon(props: {last_online_time?: string}) {
  const {last_online_time} = props

  if (!last_online_time) return <></>

  const lastOnlineTime = dayjs(last_online_time)
  const currentTime = dayjs()

  // Calculate the time difference as a duration
  const timeDiff = dayjs.duration(Math.abs(currentTime.diff(lastOnlineTime)))

  const STALLED_CUTOFF = 15
  const INACTIVE_HOURS = 12

  // Check if last online time was more than 30 minutes ago and more than one day ago
  const isStalled = timeDiff.asMinutes() > STALLED_CUTOFF
  const isInactive = timeDiff.asHours() > INACTIVE_HOURS

  if (isInactive) {
    return <></>
  }

  return (
    <Tooltip text={'Last online: ' + fromNow(last_online_time)}>
      <div className={clsx('h-2 w-2 rounded-full', isStalled ? 'bg-yellow-500' : 'bg-green-500')} />
    </Tooltip>
  )
})
