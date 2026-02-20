import clsx from 'clsx'
import {DAY_MS} from 'common/util/time'

export function NewBadge(props: {classes: string | undefined; created?: string; days?: number}) {
  const {classes, created, days = 30} = props
  if (created && Date.now() - new Date(created).getTime() > days * DAY_MS) return null
  return (
    <span
      className={clsx(
        'absolute z-10 rounded px-1 text-xs text-primary-500 font-semibold tracking-wide shadow',
        classes,
      )}
    >
      new
    </span>
  )
}
